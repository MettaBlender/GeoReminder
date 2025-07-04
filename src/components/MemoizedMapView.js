import React, { useState, useEffect, memo } from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';

const MemoizedMapView = memo(({ region, style, showsUserLocation, followsUserLocation, onRegionChangeComplete, reminderData }) => (
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
  >
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
  // Custom comparison function to ensure re-render when reminderData changes
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

export default MemoizedMapView;