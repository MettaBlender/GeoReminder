import React, { memo } from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

const LeafletMapView = memo(({
  region,
  style,
  showsUserLocation,
  reminderData = []
}) => {
  // HTML-String für Leaflet Map
  const createLeafletHTML = () => {
    const markers = reminderData.map(reminder => ({
      lat: reminder.latitude,
      lng: reminder.longitude,
      title: reminder.title,
      content: reminder.content,
      radius: reminder.radius
    }));

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Leaflet Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Initialisiere Karte
        var map = L.map('map').setView([${region?.latitude || 47.3769}, ${region?.longitude || 8.5417}], 13);

        // Kostenloser CartoDB Tile Layer
        L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors, © CartoDB',
            maxZoom: 19
        }).addTo(map);

        // Alternative kostenlose Tile Provider:
        // Wikimedia: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png'
        // ESRI World: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
        // CartoDB Dark: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'

        // User Location Marker (falls aktiviert)
        ${showsUserLocation ? `
        var userMarker = L.marker([${region?.latitude || 47.3769}, ${region?.longitude || 8.5417}])
            .addTo(map)
            .bindPopup('Ihr Standort')
            .openPopup();
        ` : ''}

        // Reminder Markers und Kreise
        var markers = ${JSON.stringify(markers)};
        markers.forEach(function(marker) {
            // Marker
            L.marker([marker.lat, marker.lng])
                .addTo(map)
                .bindPopup('<b>' + marker.title + '</b><br>' + marker.content);

            // Radius Kreis
            L.circle([marker.lat, marker.lng], {
                color: 'rgba(76, 175, 80, 0.8)',
                fillColor: 'rgba(76, 175, 80, 0.3)',
                fillOpacity: 0.3,
                radius: marker.radius
            }).addTo(map);
        });

        // Event Handler für Positionsänderungen
        map.on('moveend', function() {
            var center = map.getCenter();
            var zoom = map.getZoom();
            var bounds = map.getBounds();

            // Sende Position zurück an React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'regionChange',
                latitude: center.lat,
                longitude: center.lng,
                zoom: zoom,
                latitudeDelta: bounds.getNorth() - bounds.getSouth(),
                longitudeDelta: bounds.getEast() - bounds.getWest()
            }));
        });

        // Setze initiale Region
        ${region ? `
        map.setView([${region.latitude}, ${region.longitude}],
            ${region.latitudeDelta ? Math.round(14 - Math.log2(region.latitudeDelta * 111)) : 13});
        ` : ''}
    </script>
</body>
</html>`;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'regionChange' && onRegionChangeComplete) {
        onRegionChangeComplete({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: data.latitudeDelta,
          longitudeDelta: data.longitudeDelta
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={style}>
      <WebView
        style={StyleSheet.absoluteFillObject}
        source={{ html: createLeafletHTML() }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
});

export default LeafletMapView;
