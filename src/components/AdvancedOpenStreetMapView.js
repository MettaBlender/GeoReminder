import React, { memo, useState } from 'react';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

// Verschiedene kostenlose und app-freundliche Tile Provider
const TILE_PROVIDERS = {
  cartodb_light: {
    name: 'CartoDB Light',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  cartodb_dark: {
    name: 'CartoDB Dark',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  wikimedia: {
    name: 'Wikimedia Maps',
    urlTemplate: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  esri_world: {
    name: 'ESRI World Street',
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
  esri_satellite: {
    name: 'ESRI Satellite',
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
  carto_voyager: {
    name: 'CartoDB Voyager',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',
    maxZoom: 19,
  }
};

const OpenStreetMapView = memo(({
  region,
  style,
  showsUserLocation,
  followsUserLocation,
  onRegionChangeComplete,
  reminderData,
  showTileSelector = false
}) => {
  const [selectedProvider, setSelectedProvider] = useState('cartodb_light');

  const currentProvider = TILE_PROVIDERS[selectedProvider];

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MapView
        style={style}
        region={region}
        showsUserLocation={showsUserLocation}
        followsUserLocation={followsUserLocation}
        onRegionChangeComplete={onRegionChangeComplete}
        showsTraffic={false}
        showsBuildings={false}
        loadingEnabled={true}
        showsMyLocationButton={true}
        toolbarEnabled={false}
        mapType="none" // Deaktiviert Google Maps
      >
        <UrlTile
          urlTemplate={currentProvider.urlTemplate}
          maximumZ={currentProvider.maxZoom}
          minimumZ={1}
        />

        {reminderData && reminderData.map((reminder, index) => (
          <React.Fragment key={reminder.localId || reminder.id || `${reminder.title}-${index}`}>
            <Marker
              coordinate={{
                latitude: reminder.latitude,
                longitude: reminder.longitude,
              }}
              title={reminder.title}
              description={reminder.content}
              pinColor="#4CAF50"
            />
            <Circle
              center={{
                latitude: reminder.latitude,
                longitude: reminder.longitude,
              }}
              radius={reminder.radius}
              strokeColor="rgba(76, 175, 80, 0.8)"
              fillColor="rgba(76, 175, 80, 0.3)"
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
      </MapView>

      {showTileSelector && (
        <View style={styles.tileSelector}>
          <Text style={styles.tileSelectorTitle}>Map Style:</Text>
          {Object.entries(TILE_PROVIDERS).map(([key, provider]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tileOption,
                selectedProvider === key && styles.selectedTileOption
              ]}
              onPress={() => setSelectedProvider(key)}
            >
              <Text style={[
                styles.tileOptionText,
                selectedProvider === key && styles.selectedTileOptionText
              ]}>
                {provider.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.region?.latitude === nextProps.region?.latitude &&
    prevProps.region?.longitude === nextProps.region?.longitude &&
    prevProps.region?.latitudeDelta === nextProps.region?.latitudeDelta &&
    prevProps.region?.longitudeDelta === nextProps.region?.longitudeDelta &&
    prevProps.showsUserLocation === nextProps.showsUserLocation &&
    prevProps.followsUserLocation === nextProps.followsUserLocation &&
    prevProps.showTileSelector === nextProps.showTileSelector &&
    JSON.stringify(prevProps.reminderData) === JSON.stringify(nextProps.reminderData)
  );
});

const styles = StyleSheet.create({
  tileSelector: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 10,
    minWidth: 150,
  },
  tileSelectorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  tileOption: {
    padding: 8,
    borderRadius: 5,
    marginVertical: 2,
  },
  selectedTileOption: {
    backgroundColor: '#33a5f6',
  },
  tileOptionText: {
    fontSize: 12,
    color: '#666',
  },
  selectedTileOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OpenStreetMapView;
