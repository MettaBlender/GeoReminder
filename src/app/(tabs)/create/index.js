import { View, ScrollView, TextInput, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const Index = () => {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 46.9479739,
    longitude: 7.4474468,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [data, setData] = useState({
    title: '',
    content: '',
    radius: '',
    latitude: '46.9479739',
    longitude: '7.4474468',
  });
  const { title, content, radius, latitude, longitude } = data;
  const { getItem, setItem } = useAsyncStorage('reminder');

  // Handler für Map-Tap (Pin setzen)
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setData((prev) => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    }));
    console.log('Neuer Pin gesetzt:', { latitude, longitude });
  };

  // Handler für Absenden
  const handleSubmit = () => {
    if (!title || !content || !radius || !latitude || !longitude) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus.');
      return;
    }
    console.log('Data:', data);
    getItem()
      .then((value) => {
        let existingReminders = [];
        try {
          existingReminders = value ? JSON.parse(value) : [];
          // Sicherstellen, dass es ein Array ist
          if (!Array.isArray(existingReminders)) {
            existingReminders = [];
          }
        } catch (parseError) {
          console.error('Error parsing stored data:', parseError);
          existingReminders = [];
        }
        
        const newReminder = [...existingReminders, data];
        console.log('New Reminder:', newReminder);
        setItem(JSON.stringify(newReminder));
        
        Alert.alert('Erfolg', 'Erinnerung wurde gespeichert!');
        
        // Zurücksetzen der Eingabefelder
        setData({
          title: '',
          content: '',
          radius: '',
          latitude: currentLocation.coords.latitude.toString(),
          longitude: currentLocation.coords.longitude.toString(),
        });
      })
      .catch((error) => {
        console.error('Error saving reminder:', error);
        Alert.alert('Fehler', 'Fehler beim Speichern der Erinnerung.');
      });
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Standortzugriff verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte erlaube den Zugriff auf den Standort.');
          setIsLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Platform.OS === 'ios' ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        // Initialisiere die Koordinaten mit dem aktuellen Standort
        setData(prev => ({
          ...prev,
          latitude: currentLocation.coords.latitude.toString(),
          longitude: currentLocation.coords.longitude.toString(),
        }));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Fehler beim Abrufen des Standorts:', error);
        setErrorMsg('Fehler beim Laden des Standorts.');
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        {/* Plattformspezifischer Header */}
        <View
          style={[
            styles.header,
            Platform.OS === 'ios' ? styles.headerIOS : styles.headerAndroid,
          ]}
        >
          <Text style={styles.headerText}>Meine Karten-App</Text>
          {Platform.OS === 'ios' && (
            <Text style={styles.headerSubText}>iOS-spezifische Nachricht</Text>
          )}
        </View>
        <ScrollView style={styles.scrollContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Standort wird geladen...</Text>
            </View>
          ) : errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <>
              {/* GooglePlacesAutocomplete temporär deaktiviert für Debugging */}
              {/* <GooglePlacesAutocomplete
                placeholder="Ort suchen (z.B. Bern, Schweiz)"
                onPress={(data, details = null) => {
                  if (details) {
                    const { lat, lng } = details.geometry.location;
                    setData((prev) => ({
                      ...prev,
                      latitude: lat.toString(),
                      longitude: lng.toString(),
                      title: data.description || prev.title,
                    }));
                    setRegion({
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                    setLocation({
                      latitude: lat,
                      longitude: lng,
                    });
                    console.log('Gesuchter Ort:', { latitude: lat, longitude: lng });
                  }
                }}
                fetchDetails={true}
                query={{
                  key: 'DEIN_GOOGLE_API_SCHLÜSSEL',
                  language: 'de',
                  types: '(cities)|address|establishment',
                }}
                styles={{
                  container: styles.searchContainer,
                  textInput: styles.searchInput,
                  listView: styles.searchListView,
                }}
                enablePoweredByContainer={false}
              /> */}
              <MapView
                style={styles.map}
                initialRegion={region}
                region={region}
                showsUserLocation={true}
                onPress={handleMapPress}
              >
                {latitude && longitude && parseFloat(latitude) !== 0.0 && parseFloat(longitude) !== 0.0 && (
                  <Marker
                    coordinate={{
                      latitude: parseFloat(latitude),
                      longitude: parseFloat(longitude),
                    }}
                    title={title || 'Neuer Pin'}
                    description={content || 'Von Nutzer gesetzt'}
                    pinColor="green"
                  />
                )}
                {location && location.latitude && location.longitude && (
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title="Mein Standort"
                    description="Hier bin ich gerade"
                    pinColor="blue"
                  />
                )}
              </MapView>
              <Text style={styles.label}>Koordinaten</Text>
              <View style={styles.coordinateContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Latitude"
                  placeholderTextColor="#999"
                  value={latitude}
                  onChangeText={(text) => setData((prev) => ({ ...prev, latitude: text }))}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Longitude"
                  placeholderTextColor="#999"
                  value={longitude}
                  onChangeText={(text) => setData((prev) => ({ ...prev, longitude: text }))}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.label}>Radius</Text>
              <TextInput
                style={styles.input}
                placeholder="Radius eingeben"
                value={radius}
                onChangeText={(text) => setData((prev) => ({ ...prev, radius: text }))}
                keyboardType="numeric"
              />
              <Text style={styles.label}>Titel</Text>
              <TextInput
                style={styles.input}
                placeholder="Titel eingeben"
                value={title}
                onChangeText={(text) => setData((prev) => ({ ...prev, title: text }))}
              />
              <Text style={styles.label}>Inhalt</Text>
              <TextInput
                style={styles.input}
                placeholder="Inhalt eingeben"
                value={content}
                onChangeText={(text) => setData((prev) => ({ ...prev, content: text }))}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Absenden</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  headerIOS: {
    height: 100,
    backgroundColor: '#007AFF',
  },
  headerAndroid: {
    height: 60,
    backgroundColor: '#3F51B5',
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flex: 1,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  searchListView: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom: 16,
    borderRadius: 10,
  },
  coordinateContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#000',
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Index;