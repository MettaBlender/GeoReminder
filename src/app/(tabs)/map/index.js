import { View, Text, Alert, ActivityIndicator, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, memo } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import MemoizedMapView from '../../../components/MemoizedMapView';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const [followsUser, setFollowsUser] = useState(false);
  const [hasReminderParams, setHasReminderParams] = useState(false);
  const [lastReminderPosition, setLastReminderPosition] = useState(null);

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

  useFocusEffect(
    React.useCallback(() => {
      console.log('Map-Tab wurde fokussiert');
      console.log('Parameter beim Focus:', params);
      console.log('From-Parameter:', params.from);

      setTimeout(() => {
        if (params.latitude && params.longitude && params.from === 'home') {
          const lat = parseFloat(params.latitude);
          const lon = parseFloat(params.longitude);

          if (!isNaN(lat) && !isNaN(lon)) {
            console.log('Focus: Vom Home-Tab - Verwende Reminder-Parameter für Kartenposition:', lat, lon);
            setHasReminderParams(true);
            setLastReminderPosition({ latitude: lat, longitude: lon });
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
            setFollowsUser(false);
            setIsLoading(false);
            return;
          }
        }

        if (lastReminderPosition) {
          console.log('Focus: Zeige letzten Reminder an:', lastReminderPosition);
          setHasReminderParams(true);
          setInitialRegion({
            latitude: lastReminderPosition.latitude,
            longitude: lastReminderPosition.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setLocation({
            latitude: lastReminderPosition.latitude,
            longitude: lastReminderPosition.longitude,
          });
          setFollowsUser(false);
          setIsLoading(false);
          return;
        }

        console.log('Focus: Keine Reminder-Parameter - kehre zur aktuellen Position zurück');
        setHasReminderParams(false);
        setFollowsUser(true);
        loadCurrentLocation();
      }, 100);

      return () => {
        console.log('Map-Tab wird verlassen - lösche Parameter');
        if (params.latitude || params.longitude || params.from) {
          router.replace('/map');
        }
      };
    }, [params.latitude, params.longitude, params.from, lastReminderPosition])
  );

  const loadCurrentLocation = async () => {
    console.log('Lade aktuellen Standort');
    setIsLoading(true);
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
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
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

  useEffect(() => {
    let locationSubscription = null;

    if (followsUser && !hasReminderParams) {
      const startLocationTracking = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            locationSubscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
                distanceInterval: 10,
              },
              (newLocation) => {
                console.log('Neue Position erhalten:', newLocation.coords);
                setLocation(newLocation.coords);
                setInitialRegion({
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                });
              }
            );
          }
        } catch (error) {
          console.error('Fehler beim Live-Location-Tracking:', error);
        }
      };

      startLocationTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [followsUser, hasReminderParams]);

  const goToCurrentLocation = () => {
    console.log('Benutzer möchte zur aktuellen Position zurückkehren');
    setHasReminderParams(false);
    setFollowsUser(true);
    router.replace('/map');
    loadCurrentLocation();
  };

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
        <>
          <MemoizedMapView
            style={styles.map}
            region={initialRegion}
            showsUserLocation={true}
            followsUserLocation={followsUser}
            onRegionChangeComplete={(region) => {
              if (!followsUser) {
                setInitialRegion(region);
              }
            }}
            reminderData={reminderData}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={goToCurrentLocation}
          >
            <Ionicons name="locate" size={24} color="#fff" />
          </TouchableOpacity>
        </>
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
  locationButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#33a5f6',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default memo(Map);
