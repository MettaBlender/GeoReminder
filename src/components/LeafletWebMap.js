import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletWebMap = ({
  region,
  style,
  showsUserLocation = true,
  followsUserLocation = false,
  onRegionChangeComplete,
  reminderData = [],
  onPress,
  ...otherProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(region);
  const webViewRef = useRef(null);

  useEffect(() => {
    if (region && webViewRef.current) {
      // Update map center when region changes
      const message = JSON.stringify({
        type: 'updateRegion',
        region: region
      });
      webViewRef.current.postMessage(message);
      setCurrentRegion(region);
    }
  }, [region]);

  useEffect(() => {
    if (reminderData && webViewRef.current) {
      // Update markers when reminder data changes
      const message = JSON.stringify({
        type: 'updateMarkers',
        markers: reminderData
      });
      webViewRef.current.postMessage(message);
    }
  }, [reminderData]);

  const createLeafletHTML = () => {
    const defaultLat = region?.latitude || 47.3769;
    const defaultLng = region?.longitude || 8.5417;
    const defaultZoom = region?.latitudeDelta ? Math.round(14 - Math.log2(region.latitudeDelta * 111)) : 13;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Leaflet Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #map {
            height: 100vh;
            width: 100vw;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,255,255,0.9);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 1000;
        }
        .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,0,0,0.1);
            border: 1px solid #ff6b6b;
            color: #d63031;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        <div>Karte wird geladen...</div>
    </div>
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossorigin=""></script>

    <script>
        let map, userMarker, markersGroup, circlesGroup;
        let isMapReady = false;

        // Initialize map
        try {
            map = L.map('map', {
                zoomControl: true,
                attributionControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                dragging: true,
                zoomSnap: 0.5,
                zoomDelta: 0.5
            }).setView([${defaultLat}, ${defaultLng}], ${defaultZoom});

            // Add tile layer - CartoDB Light (kostenlos)
            L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors, © CartoDB',
                maxZoom: 18,
                minZoom: 1
            }).addTo(map);

            // Alternative tile layers (commented out)
            /*
            // CartoDB Dark
            L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors, © CartoDB',
                maxZoom: 18
            }).addTo(map);

            // Wikimedia
            L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors, © Wikimedia',
                maxZoom: 18
            }).addTo(map);
            */

            // Create layer groups
            markersGroup = L.layerGroup().addTo(map);
            circlesGroup = L.layerGroup().addTo(map);

            // User location marker
            ${showsUserLocation ? `
            userMarker = L.marker([${defaultLat}, ${defaultLng}], {
                icon: L.divIcon({
                    className: 'user-location',
                    html: '<div style="background-color: #4285f4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.3);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
            ` : ''}

            // Map ready
            map.whenReady(function() {
                document.getElementById('loading').style.display = 'none';
                isMapReady = true;
                sendMessage({
                    type: 'mapReady'
                });
            });

            // Map events
            map.on('moveend', function() {
                if (!isMapReady) return;
                const center = map.getCenter();
                const zoom = map.getZoom();
                const bounds = map.getBounds();

                sendMessage({
                    type: 'regionChange',
                    region: {
                        latitude: center.lat,
                        longitude: center.lng,
                        latitudeDelta: bounds.getNorth() - bounds.getSouth(),
                        longitudeDelta: bounds.getEast() - bounds.getWest()
                    }
                });
            });

            map.on('click', function(e) {
                sendMessage({
                    type: 'mapPress',
                    coordinate: {
                        latitude: e.latlng.lat,
                        longitude: e.latlng.lng
                    }
                });
            });

            map.on('error', function(e) {
                showError('Karte konnte nicht geladen werden');
                sendMessage({
                    type: 'mapError',
                    error: e.message || 'Unknown error'
                });
            });

        } catch (error) {
            console.error('Map initialization error:', error);
            showError('Fehler beim Initialisieren der Karte');
        }

        // Helper functions
        function sendMessage(data) {
            try {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(data));
                }
            } catch (e) {
                console.error('Error sending message:', e);
            }
        }

        function showError(message) {
            const loading = document.getElementById('loading');
            loading.className = 'error';
            loading.innerHTML = '<div>' + message + '</div>';
            loading.style.display = 'block';
        }

        function updateRegion(region) {
            if (!map || !isMapReady) return;
            try {
                const zoom = region.latitudeDelta ?
                    Math.round(14 - Math.log2(region.latitudeDelta * 111)) :
                    map.getZoom();
                map.setView([region.latitude, region.longitude], Math.max(1, Math.min(18, zoom)));

                if (userMarker) {
                    userMarker.setLatLng([region.latitude, region.longitude]);
                }
            } catch (e) {
                console.error('Error updating region:', e);
            }
        }

        function updateMarkers(markers) {
            if (!map || !isMapReady) return;
            try {
                // Clear existing markers and circles
                markersGroup.clearLayers();
                circlesGroup.clearLayers();

                markers.forEach(function(marker, index) {
                    if (!marker || !marker.latitude || !marker.longitude) return;

                    // Add marker
                    const leafletMarker = L.marker([marker.latitude, marker.longitude], {
                        icon: L.divIcon({
                            className: 'reminder-marker',
                            html: '<div style="background-color: #4CAF50; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">📍</div>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })
                    });

                    leafletMarker.bindPopup(
                        '<b>' + (marker.title || 'Erinnerung') + '</b><br>' +
                        (marker.content || '')
                    );

                    markersGroup.addLayer(leafletMarker);

                    // Add circle if radius exists
                    if (marker.radius && marker.radius > 0) {
                        const circle = L.circle([marker.latitude, marker.longitude], {
                            color: 'rgba(76, 175, 80, 0.8)',
                            fillColor: 'rgba(76, 175, 80, 0.3)',
                            fillOpacity: 0.3,
                            radius: Math.min(marker.radius, 10000),
                            weight: 2
                        });

                        circlesGroup.addLayer(circle);
                    }
                });
            } catch (e) {
                console.error('Error updating markers:', e);
            }
        }

        // Message handler from React Native
        document.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);

                switch(data.type) {
                    case 'updateRegion':
                        updateRegion(data.region);
                        break;
                    case 'updateMarkers':
                        updateMarkers(data.markers);
                        break;
                }
            } catch (e) {
                console.error('Error handling message:', e);
            }
        });

        // Initialize with default markers
        const initialMarkers = ${JSON.stringify(reminderData)};
        if (initialMarkers && initialMarkers.length > 0) {
            setTimeout(function() {
                updateMarkers(initialMarkers);
            }, 1000);
        }
    </script>
</body>
</html>`;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch(data.type) {
        case 'mapReady':
          setIsLoading(false);
          setMapError(false);
          break;

        case 'regionChange':
          if (onRegionChangeComplete) {
            onRegionChangeComplete(data.region);
          }
          break;

        case 'mapPress':
          if (onPress) {
            onPress({
              nativeEvent: {
                coordinate: data.coordinate
              }
            });
          }
          break;

        case 'mapError':
          console.error('Leaflet map error:', data.error);
          setMapError(true);
          setIsLoading(false);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      setMapError(true);
      setIsLoading(false);
    }
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setMapError(true);
    setIsLoading(false);
  };

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
                📍 {reminder.title || 'Unbenannte Erinnerung'}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[style, { position: 'relative' }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Karte wird geladen...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: createLeafletHTML() }}
        style={StyleSheet.absoluteFillObject}
        onMessage={handleMessage}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={Platform.OS === 'android'}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={false}
        sharedCookiesEnabled={false}
        originWhitelist={['*']}
        {...otherProps}
      />
    </View>
  );
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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

export default LeafletWebMap;
