import { View, Text, Alert, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import React, { useState, useEffect, memo } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import MemoizedMapView from '../../../components/MemoizedMapView';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

const GEOFENCING_TASK = 'background-location-task';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(GEOFENCING_TASK, ({ data, error }) => {
  if (error) {
    console.error('Geofencing error:', error);
    return;
  }

  if (data) {
    const { eventType, region } = data;

    if (eventType === Location.GeofencingEventType.Enter) {
      const notificationMessage = region.notificationMessage || `Sie haben den Bereich "${region.identifier}" betreten.`;

      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Geo-Erinnerung',
          body: notificationMessage,
          sound: true,
        },
        trigger: null,
      }).catch(err => console.error('Notification error:', err));
    }
  }
});

const Map = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialRegion, setInitialRegion] = useState(null);

  const {getItem} = useAsyncStorage('reminder');
  const { getItem: getCurrentUser } = useAsyncStorage('currentUser');
  const params = useLocalSearchParams();

  const [reminderData, setReminderData] = useState([]);

  const isExpoGoOnIOS = Constants.appOwnership === 'expo' && Platform.OS === 'ios';

  const getData = async () => {
    try {
      console.log('Lade Erinnerungsdaten aus AsyncStorage');
      const user = await getCurrentUser();
      let userId = 'unsigned';

      if (user) {
        const userData = JSON.parse(user);
        userId = userData.id || userData.username;
      }

      const value = await getItem();
      const allReminders = value ? JSON.parse(value) : {};
      let userReminders = allReminders[userId] || [];

      if (!Array.isArray(userReminders)) {
        userReminders = [];
      }

      const numericData = userReminders.map(item => ({
        ...item,
        radius: parseFloat(item.radius),
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
      }));

      console.log('Parsed reminderData:', numericData);
      setReminderData(numericData);
    } catch (error) {
      console.error("Error loading items:", error);
      setReminderData([]);
    }
  };

  // Prüfe URL-Parameter und setze initialRegion
  useEffect(() => {
    if (params.latitude && params.longitude) {
      const lat = parseFloat(params.latitude);
      const lon = parseFloat(params.longitude);

      if (!isNaN(lat) && !isNaN(lon)) {
        console.log('Verwende URL-Parameter für Kartenposition:', lat, lon);
        setInitialRegion({
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setLocation({
          latitude: lat,
          longitude: lon,
        });
        setIsLoading(false);
        return;
      }
    }

    // Nur aktuellen Standort laden, wenn keine Parameter vorhanden sind
    loadCurrentLocation();
  }, [params.latitude, params.longitude]);

  const loadCurrentLocation = async () => {
    console.log('Lade aktuellen Standort');
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setErrorMsg('Standortzugriff im Vordergrund verweigert.');
        Alert.alert('Berechtigung verweigert', 'Bitte gewähren Sie den Zugriff auf den Standort.');
        setIsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation.coords);
      setInitialRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden des Standorts:', error);
      setErrorMsg(`Fehler: ${error.message}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (reminderData.length === 0 || !location) return;

    console.log('Richte Geofencing ein');
    (async () => {
      try {
        if (!Device.isDevice) {
          console.log('Geofencing funktioniert nur auf physischen Geräten');
          return;
        }

        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        if (notificationStatus !== 'granted') {
          console.log('Benachrichtigungsberechtigung verweigert');
          return;
        }

        if (!isExpoGoOnIOS) {
          console.log('Geofencing wird gestartet');
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            console.log('Hintergrund-Standortzugriff verweigert');
            return;
          }
          await Location.startGeofencingAsync(GEOFENCING_TASK, reminderData.map(reminder => ({
            identifier: reminder.title,
            latitude: reminder.latitude,
            longitude: reminder.longitude,
            radius: reminder.radius,
            notificationMessage: reminder.content,
          })));
        } else {
          console.log('Geofencing wird in Expo Go auf iOS übersprungen (nicht unterstützt).');
        }
      } catch (error) {
        console.error('Fehler beim Einrichten von Geofencing:', error);
      }
    })();

    return () => {
      if (!isExpoGoOnIOS) {
        console.log('Geofencing wird gestoppt');
        Location.stopGeofencingAsync(GEOFENCING_TASK).catch((error) =>
          console.error('Fehler beim Stoppen von Geofencing:', error)
        );
      }
    };
  }, [isExpoGoOnIOS, reminderData, location]);

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!initialRegion && isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#33a5f6" />
          <Text style={styles.loadingText}>Karte wird geladen...</Text>
        </View>
      ) : initialRegion ? (
        <MemoizedMapView
          style={styles.map}
          region={initialRegion}
          showsUserLocation={true}
          followsUserLocation={false}
          onRegionChangeComplete={(region) => setInitialRegion(region)}
          reminderData={reminderData}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#33a5f6" />
          <Text style={styles.loadingText}>Standort wird geladen...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: '#000',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
  },
});

export default memo(Map);
