import React, { memo } from 'react';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';

const OpenStreetMapView = memo(({
  region,
  style,
  showsUserLocation,
  followsUserLocation,
  onRegionChangeComplete,
  reminderData
}) => (
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
    mapType="none" // Wichtig: Deaktiviert Google Maps
  >
    {/* Kostenloser CartoDB Tile Server - App-freundlich */}
    <UrlTile
      urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
      maximumZ={19}
      minimumZ={1}
    />

    {/* Alternative kostenlose Tile Provider:

    CartoDB Dark Theme:
    <UrlTile
      urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
      maximumZ={19}
      minimumZ={1}
    />

    ESRI World Street Map (kostenlos für nicht-kommerzielle Nutzung):
    <UrlTile
      urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      maximumZ={19}
      minimumZ={1}
    />

    Wikimedia Maps (kostenlos):
    <UrlTile
      urlTemplate="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
      maximumZ={19}
      minimumZ={1}
    />
    */}

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
), (prevProps, nextProps) => {
  return (
    prevProps.region?.latitude === nextProps.region?.latitude &&
    prevProps.region?.longitude === nextProps.region?.longitude &&
    prevProps.region?.latitudeDelta === nextProps.region?.latitudeDelta &&
    prevProps.region?.longitudeDelta === nextProps.region?.longitudeDelta &&
    prevProps.showsUserLocation === nextProps.showsUserLocation &&
    prevProps.followsUserLocation === nextProps.followsUserLocation &&
    JSON.stringify(prevProps.reminderData) === JSON.stringify(nextProps.reminderData)
  );
});

export default OpenStreetMapView;
