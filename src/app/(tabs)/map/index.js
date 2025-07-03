import { StyleSheet, View, Text, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Device from 'expo-device';

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

const Index = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    console.log('useEffect gestartet');
    (async () => {
      if (!Device.isDevice) {
        setErrorMsg('Geofencing funktioniert nur auf physischen Geräten.');
        return;
      }

      let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setErrorMsg('Standortzugriff im Vordergrund verweigert.');
        Alert.alert('Berechtigung verweigert', 'Bitte erlaube den Zugriff auf den Standort.');
        return;
      }

      let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        setErrorMsg('Standortzugriff im Hintergrund verweigert.');
        Alert.alert('Berechtigung verweigert', 'Hintergrundstandort ist für Geofencing erforderlich.');
        return;
      }

      let { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        setErrorMsg('Benachrichtigungsberechtigung verweigert.');
        Alert.alert('Berechtigung verweigert', 'Bitte erlaube Benachrichtigungen.');
        return;
      }

      console.log('Standort wird abgerufen');
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      const region = {
        identifier: 'Zielort',
        latitude: 37.78825,
        longitude: -122.4324,
        radius: 100,
        notifyOnEnter: true,
        notifyOnExit: false,
      };

      console.log('Geofencing wird gestartet');
      await Location.startGeofencingAsync(GEOFENCING_TASK, [region]);

    })();

    return () => {
      console.log('Geofencing wird gestoppt');
      Location.stopGeofencingAsync(GEOFENCING_TASK);
    };
  }, []);

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <Text className='text-white mt-6 ml-2'>{errorMsg}</Text>
      ) : location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Mein Standort"
            description="Hier bin ich gerade"
            pinColor="blue"
          />
          <Marker
            coordinate={{
              latitude: 37.78825,
              longitude: -122.4324,
            }}
            title="Zielort"
            description="Geofence-Region"
            pinColor="red"
          />
        </MapView>
      ) : (
        <Text>Standort wird geladen...</Text>
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
});

export default Index;