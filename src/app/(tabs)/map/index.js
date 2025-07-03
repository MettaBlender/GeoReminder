import { StyleSheet, View, Text, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, memo } from 'react';
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

// Optimierte MapView-Komponente mit memo
const MemoizedMapView = memo(({ location, style, showsUserLocation, markers }) => (
  <MapView
    style={style}
    initialRegion={{
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }}
    showsUserLocation={showsUserLocation}
    showsTraffic={false} // Deaktiviert Verkehrsinfos für schnellere Ladezeit
    showsBuildings={false} // Deaktiviert 3D-Gebäude
    loadingEnabled={true} // Zeigt Lade-Indikator der Karte
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
    {markers.map((marker) => (
      <Marker
        key={marker.identifier}
        coordinate={{
          latitude: marker.latitude,
          longitude: marker.longitude,
        }}
        title={marker.identifier}
        description="Geofence-Region"
        pinColor="red"
      />
    ))}
  </MapView>
));

const Index = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mehrere Geofence-Regionen
  const geofenceRegions = [
    {
      identifier: 'Zielort 1',
      latitude: 46.93995,
      longitude: 7.39864,
      radius: 100,
      notifyOnEnter: true,
      notifyOnExit: false,
    },
    {
      identifier: 'Zielort 2',
      latitude: 46.9405,
      longitude: 7.3995,
      radius: 100,
      notifyOnEnter: true,
      notifyOnExit: false,
    },
    {
      identifier: 'Zielort 3',
      latitude: 46.9385,
      longitude: 7.3970,
      radius: 100,
      notifyOnEnter: true,
      notifyOnExit: false,
    },
  ];

  useEffect(() => {
    console.log('useEffect gestartet');
    (async () => {
      try {
        if (!Device.isDevice) {
          setErrorMsg('Geofencing funktioniert nur auf physischen Geräten.');
          setIsLoading(false);
          return;
        }

        // Berechtigungen anfragen
        let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          setErrorMsg('Standortzugriff im Vordergrund verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte erlaube den Zugriff auf den Standort.');
          setIsLoading(false);
          return;
        }

        let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          setErrorMsg('Standortzugriff im Hintergrund verweigert.');
          Alert.alert('Berechtigung verweigert', 'Hintergrundstandort ist für Geofencing erforderlich.');
          setIsLoading(false);
          return;
        }

        let { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        if (notificationStatus !== 'granted') {
          setErrorMsg('Benachrichtigungsberechtigung verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte erlaube Benachrichtigungen.');
          setIsLoading(false);
          return;
        }

        // Standort abrufen
        console.log('Standort wird abgerufen');
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Weniger präzise für schnellere Abfrage
        });
        setLocation(currentLocation.coords);

        // Geofencing starten
        console.log('Geofencing wird gestartet');
        await Location.startGeofencingAsync(GEOFENCING_TASK, geofenceRegions);

        setIsLoading(false);
      } catch (error) {
        console.error('Fehler in useEffect:', error);
        setErrorMsg('Fehler beim Laden des Standorts oder Geofencing.');
        setIsLoading(false);
      }
    })();

    return () => {
      console.log('Geofencing wird gestoppt');
      Location.stopGeofencingAsync(GEOFENCING_TASK);
    };
  }, []);

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
          markers={geofenceRegions}
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

export default Index;