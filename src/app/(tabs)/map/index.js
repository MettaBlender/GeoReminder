import { StyleSheet, View, Alert } from 'react-native';
import React, {useState, useEffect} from 'react'
import MapView, {Marker} from 'react-native-maps'
import * as Location from 'expo-location';

const index = () => {

  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      // Berechtigungen für Standort anfragen
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung verweigert', 'Bitte erlaube den Zugriff auf den Standort.');
        return;
      }

      // Aktuellen Standort abrufen
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  return (
    <View>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true} // Zeigt den blauen Punkt für den Nutzerstandort
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Mein Standort"
            description="Hier bin ich gerade"
            pinColor="blue" // Farbe des Markers
          />
        </MapView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default index