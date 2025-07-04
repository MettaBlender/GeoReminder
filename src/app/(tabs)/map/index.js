import { View, Text, Alert, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import React, { useState, useEffect, memo } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import MemoizedMapView from '../../../components/MemoizedMapView';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';

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

  const {getItem, setItem} = useAsyncStorage('reminder');

  const [reminderData, setReminderData] = useState([])

  const isExpoGoOnIOS = Constants.appOwnership === 'expo' && Platform.OS === 'ios';

  const getData = () => {
    setIsLoading(true);
    console.log('Lade Erinnerungsdaten aus AsyncStorage');
    getItem()
      .then((value) => {
        if (value) {
          console.log('reminderData:', JSON.parse(value));
          const parsedData = JSON.parse(value);
          const nummericData = parsedData.map(item => ({
            ...item,
            radius: parseFloat(item.radius),
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
          }));
          console.log('Parsed reminderData:', nummericData);
          setReminderData(nummericData);
        }
        else {
          console.log('Keine Erinnerungen gefunden, setze reminderData auf leeres Array');
          setReminderData([]);
        }
      })
      .catch(error => {
          console.error("Error loading items:", error)
      }).finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    console.log('useEffect gestartet');
    (async () => {
      try {
        if (reminderData.length === 0) {
          console.log('Keine Erinnerungen für Geofencing gefunden');
          setIsLoading(false);
          return;
        }
        if (!Device.isDevice) {
          setErrorMsg('Standortzugriff funktioniert nur auf physischen Geräten.');
          setIsLoading(false);
          return;
        }

        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        if (notificationStatus !== 'granted') {
          setErrorMsg('Benachrichtigungsberechtigung verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte erlaube Benachrichtigungen.');
          setIsLoading(false);
          return;
        }

        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          setErrorMsg('Standortzugriff im Vordergrund verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte erlaube den Zugriff auf den Standort.');
          setIsLoading(false);
          return;
        }

        console.log('Standort wird abgerufen');
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation.coords);

        if (!isExpoGoOnIOS) {
          console.log('Geofencing wird gestartet');
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            setErrorMsg('Standortzugriff im Hintergrund verweigert.');
            Alert.alert('Berechtigung verweigert', 'Hintergrundstandort ist für Geofencing erforderlich.');
            setIsLoading(false);
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
          Alert.alert(
            'Eingeschränkte Funktionalität',
            'Geofencing ist in Expo Go auf iOS nicht verfügbar. Verwende einen Development Build oder ein Android-Gerät für volle Funktionalität.'
          );
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Fehler in useEffect:', error);
        setErrorMsg(`Fehler: ${error.message}`);
        setIsLoading(false);
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
  }, [isExpoGoOnIOS, reminderData]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Karte wird geladen...</Text>
        </View>
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : location ? (
        <MemoizedMapView
          location={location}
          style={styles.map}
          showsUserLocation={true}
          markers={reminderData}
        />
      ) : (
        <Text style={styles.loadingText}>Standort wird geladen...</Text>
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
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    marginLeft: 10,
    textAlign: 'center',
  },
});

export default Map;