import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';

const SafeMapView = ({
  region,
  style,
  showsUserLocation = true,
  followsUserLocation = false,
  onRegionChangeComplete,
  reminderData = [],
  ...otherProps
}) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Timeout für Map-Loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleMapError = (error) => {
    console.error('Map Fehler:', error);
    setMapError(true);
    setIsLoading(false);
  };

  const handleMapReady = () => {
    console.log('Map ist bereit');
    setIsLoading(false);
    setMapError(false);
  };

  // Fallback UI wenn Map nicht geladen werden kann
  if (mapError) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorTitle}>Karte nicht verfügbar</Text>
        <Text style={styles.errorText}>
          Die Karte konnte nicht geladen werden.{'\n'}
          Bitte prüfen Sie Ihre Internetverbindung.
        </Text>
        {reminderData.length > 0 && (
          <View style={styles.remindersList}>
            <Text style={styles.remindersTitle}>Ihre Erinnerungen:</Text>
            {reminderData.slice(0, 3).map((reminder, index) => (
              <Text key={index} style={styles.reminderItem}>
                📍 {reminder.title}
              </Text>
            ))}
            {reminderData.length > 3 && (
              <Text style={styles.reminderItem}>
                +{reminderData.length - 3} weitere...
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // Loading-Zustand
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Karte wird geladen...</Text>
      </View>
    );
  }

  try {
    return (
      <MapView
        style={style}
        region={region}
        showsUserLocation={showsUserLocation}
        followsUserLocation={followsUserLocation}
        onRegionChangeComplete={onRegionChangeComplete}
        onMapReady={handleMapReady}
        onError={handleMapError}
        showsTraffic={false}
        showsBuildings={false}
        loadingEnabled={true}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        mapType="none"
        moveOnMarkerPress={false}
        showsScale={false}
        showsCompass={false}
        {...otherProps}
      >
        {/* Sichere Tile-Layer */}
        <UrlTile
          urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
          maximumZ={18}
          minimumZ={1}
          flipY={false}
        />

        {/* Sichere Marker-Rendering */}
        {reminderData && Array.isArray(reminderData) && reminderData.map((reminder, index) => {
          // Validierung der Reminder-Daten
          if (!reminder ||
              typeof reminder.latitude !== 'number' ||
              typeof reminder.longitude !== 'number' ||
              isNaN(reminder.latitude) ||
              isNaN(reminder.longitude) ||
              Math.abs(reminder.latitude) > 90 ||
              Math.abs(reminder.longitude) > 180) {
            console.warn(`Invalid reminder data at index ${index}:`, reminder);
            return null;
          }

          try {
            return (
              <React.Fragment key={reminder.localId || reminder.id || `reminder-${index}`}>
                <Marker
                  coordinate={{
                    latitude: reminder.latitude,
                    longitude: reminder.longitude,
                  }}
                  title={reminder.title || 'Erinnerung'}
                  description={reminder.content || ''}
                  pinColor="#4CAF50"
                />
                {reminder.radius && reminder.radius > 0 && (
                  <Circle
                    center={{
                      latitude: reminder.latitude,
                      longitude: reminder.longitude,
                    }}
                    radius={Math.min(reminder.radius, 10000)} // Max 10km für Stabilität
                    strokeColor="rgba(76, 175, 80, 0.8)"
                    fillColor="rgba(76, 175, 80, 0.3)"
                    strokeWidth={2}
                  />
                )}
              </React.Fragment>
            );
          } catch (markerError) {
            console.error(`Fehler beim Rendern von Marker ${index}:`, markerError);
            return null;
          }
        })}
      </MapView>
    );
  } catch (error) {
    console.error('MapView Render-Fehler:', error);
    setMapError(true);
    return null;
  }
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  remindersList: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    minWidth: 200,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  reminderItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default SafeMapView;
