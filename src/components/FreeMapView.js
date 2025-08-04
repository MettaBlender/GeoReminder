import React, { memo } from 'react';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';
import { DEFAULT_TILE_PROVIDER } from '../config/tileProviders';

/**
 * Eine wiederverwendbare Map-Komponente mit kostenlosem CartoDB Tile Provider
 * Diese Komponente ersetzt Google Maps vollständig und ist kostenlos nutzbar
 */
const FreeMapView = memo(({
  region,
  style,
  showsUserLocation = true,
  followsUserLocation = false,
  onRegionChangeComplete,
  onPress,
  reminderData = [],
  children,
  tileProvider = DEFAULT_TILE_PROVIDER,
  ...otherProps
}) => (
  <MapView
    style={style}
    region={region}
    showsUserLocation={showsUserLocation}
    followsUserLocation={followsUserLocation}
    onRegionChangeComplete={onRegionChangeComplete}
    onPress={onPress}
    showsTraffic={false}
    showsBuildings={false}
    loadingEnabled={true}
    showsMyLocationButton={true}
    toolbarEnabled={false}
    mapType="none" // Deaktiviert Google Maps
    {...otherProps}
  >
    {/* Kostenloser Tile Provider */}
    <UrlTile
      urlTemplate={tileProvider.urlTemplate}
      maximumZ={tileProvider.maxZoom}
      minimumZ={1}
    />

    {/* Reminder Markers und Kreise */}
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

    {/* Zusätzliche Kinder-Komponenten */}
    {children}
  </MapView>
), (prevProps, nextProps) => {
  return (
    prevProps.region?.latitude === nextProps.region?.latitude &&
    prevProps.region?.longitude === nextProps.region?.longitude &&
    prevProps.region?.latitudeDelta === nextProps.region?.latitudeDelta &&
    prevProps.region?.longitudeDelta === nextProps.region?.longitudeDelta &&
    prevProps.showsUserLocation === nextProps.showsUserLocation &&
    prevProps.followsUserLocation === nextProps.followsUserLocation &&
    prevProps.tileProvider?.urlTemplate === nextProps.tileProvider?.urlTemplate &&
    JSON.stringify(prevProps.reminderData) === JSON.stringify(nextProps.reminderData)
  );
});

export default FreeMapView;
