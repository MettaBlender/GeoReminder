import { StyleSheet, View, Text, Alert, ActivityIndicator, Platform } from 'react-native';
import React, { useState, useEffect, memo } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import MemoizedMapView from '@/components/MemoizedMapView';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';

// Task-Name für Geofencing
const GEOFENCING_TASK = 'geofencing-task';

// Benachrichtigungskonfiguration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Hintergrundtask für Geofencing
TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofencing error:', error);
    return;
  }
  if (data) {
    const { eventType, region } = data;
    if (eventType === Location.GeofencingEventType.Enter) {
      console.log(`Region betreten: ${region.identifier}`);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Willkommen!',
          body: `Du bist in der Nähe von ${region.identifier}!`,
        },
        trigger: null,
      });
    }
  }
});

const Map = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const {getItem, setItem} = useAsyncStorage('reminder');  
  
  const [reminderData, setReminderData] = useState([])

  // Check if running in Expo Go on iOS
  const isExpoGoOnIOS = Platform.OS === 'ios'; //Constants.appOwnership === 'expo' &&

  const getData = () => {
    setIsLoading(true);
    getItem()
      .then((value) => {
        if (value) {   
          console.log('reminderData:', JSON.parse(value));             
          setReminderData(JSON.parse(value))
        }
        else {
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
        // Prüfen, ob es ein physisches Gerät ist
        if (!Device.isDevice) {
          setErrorMsg('Standortzugriff funktioniert nur auf physischen Geräten.');
          setIsLoading(false);
          return;
        }

        // Berechtigungen für Benachrichtigungen anfragen
        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        if (notificationStatus !== 'granted') {
          setErrorMsg('Benachrichtigungsberechtigung verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte erlaube Benachrichtigungen.');
          setIsLoading(false);
          return;
        }

        // Berechtigungen für Standort anfragen
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          setErrorMsg('Standortzugriff im Vordergrund verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte erlaube den Zugriff auf den Standort.');
          setIsLoading(false);
          return;
        }

        // Standort abrufen
        console.log('Standort wird abgerufen');
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation.coords);

        // Geofencing nur starten, wenn nicht in Expo Go auf iOS
        if (!isExpoGoOnIOS) {
          console.log('Geofencing wird gestartet');
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            setErrorMsg('Standortzugriff im Hintergrund verweigert.');
            Alert.alert('Berechtigung verweigert', 'Hintergrundstandort ist für Geofencing erforderlich.');
            setIsLoading(false);
            return;
          }
          await Location.startGeofencingAsync(GEOFENCING_TASK, reminderData);
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
  }, [isExpoGoOnIOS]);

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