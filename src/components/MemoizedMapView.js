import React, { useState, useEffect, memo } from 'react';
import MapView, { Marker } from 'react-native-maps';

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
    showsTraffic={false}
    showsBuildings={false}
    loadingEnabled={true}
  >   
    {markers.map((marker) => (
      <Marker
        key={marker.identifier}
        coordinate={{
          latitude: marker.latitude,
          longitude: marker.longitude,
        }}
        title={marker.title}
        description={marker.content}
        pinColor="#4CAF50"
      />
    ))}
  </MapView>
));

export default MemoizedMapView;