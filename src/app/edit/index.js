import { View, ScrollView, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, Alert, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import FormField from '@/components/FormField';
import CoordinateInput from '@/components/CoordinateInput';
import SubmitButton from '@/components/SubmitButton';
import LoadingView from '@/components/LoadingView';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const EditReminder = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getItem, setItem } = useAsyncStorage('reminder');

  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [data, setData] = useState({
    title: '',
    content: '',
    radius: '',
    latitude: '0.0',
    longitude: '0.0',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load the reminder data
  useEffect(() => {
    const loadReminder = async () => {
      try {
        const reminders = await getItem();
        const reminderList = reminders ? JSON.parse(reminders) : [];
        const reminder = reminderList[id];
        if (reminder) {
          setData(reminder);
          setSearchQuery(reminder.title);
        } else {
          Alert.alert('Fehler', 'Erinnerung nicht gefunden.');
          router.back();
        }
      } catch (error) {
        console.error('Error loading reminder:', error);
        Alert.alert('Fehler', 'Fehler beim Laden der Erinnerung.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    loadReminder();
  }, [id]);

  // Get the user's current location
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
        setIsLoading(false);
      } catch (error) {
        console.error('Fehler beim Abrufen des Standorts:', error);
        setErrorMsg('Fehler beim Laden des Standorts.');
        setIsLoading(false);
      }
    })();
  }, []);

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setData((prev) => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearch = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'MeineKartenApp/1.0 (dein.email@example.com)',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP Fehler: ${response.status} ${response.statusText}`);
      }
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Fehler bei der Suche:', error.message);
      Alert.alert('Fehler', 'Suche konnte nicht durchgeführt werden.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lon.toString(),
      title: place.display_name.split(',')[0] || prev.title,
    }));
    setSearchQuery(place.display_name);
    setSearchResults([]);
  };

  const handleSubmit = () => {
    if (!data.title.trim() || !data.content.trim() || !data.radius.trim() || !data.latitude || !data.longitude) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus.');
      return;
    }
    if (!isPositiveNumber(data.radius)) {
      Alert.alert('Fehler', 'Der Radius muss eine positive Zahl sein.');
      return;
    }
    if (data.latitude === '0.0' || data.longitude === '0.0') {
      Alert.alert('Fehler', 'Bitte setze einen Pin auf der Karte oder gib gültige Koordinaten ein.');
      return;
    }
    getItem()
      .then((value) => {
        const reminders = value ? JSON.parse(value) : [];
        reminders[id] = data;
        setItem(JSON.stringify(reminders));
        Alert.alert('Erfolg', 'Änderungen gespeichert ✓', [
          {

            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      })
      .catch((error) => {
        console.error('Error saving reminder:', error);
        Alert.alert('Fehler', 'Fehler beim Speichern der Erinnerung.');
      });
  };

  const handleDelete = () => {
    Alert.alert(
      'Erinnerung löschen',
      `Möchtest du die Erinnerung "${data.title}" wirklich löschen? Gelöschte Erinnerungen können nicht wiederhergestellt werden.`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const reminders = await getItem();
              const reminderList = reminders ? JSON.parse(reminders) : [];
              if (!reminderList[id]) {
                Alert.alert('Fehler', 'Erinnerung nicht gefunden.');
                router.back();
                return;
              }
              reminderList.splice(id, 1); // Remove the reminder at index id
              await setItem(JSON.stringify(reminderList));
              Alert.alert('Erfolg', 'Erinnerung gelöscht ✓', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Fehler', 'Fehler beim Löschen der Erinnerung. Bitte versuche es erneut.');
            }
          },
        },
      ]
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setSearchResults([]);
  };

  const isPositiveNumber = (value) => {
    const numericRegex = /^[0-9]+(\.[0-9]+)?$/;
    if (!numericRegex.test(value.trim())) return false;
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && isFinite(num);
  };

  const areAllFieldsValid = () => {
    return (
      data.title.trim() !== '' &&
      data.content.trim() !== '' &&
      data.radius.trim() !== '' &&
      isPositiveNumber(data.radius) &&
      data.latitude !== '0.0' &&
      data.longitude !== '0.0' &&
      data.latitude.trim() !== '' &&
      data.longitude.trim() !== ''
    );
  };

  const handleRadiusChange = (text) => {
    const numericText = text.replace(/[^0-9.]/g, '');
    const parts = numericText.split('.');
    const filteredText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
    setData((prev) => ({ ...prev, radius: filteredText }));
  };

  const getRadiusError = () => {
    if (data.radius.length === 0) return null;
    if (!/^[0-9]+(\.[0-9]+)?$/.test(data.radius.trim())) {
      return 'Bitte gib nur Ziffern ein (z.B. 100 oder 50.5).';
    }
    if (!isPositiveNumber(data.radius)) {
      return 'Bitte gib eine positive Zahl für den Radius ein (z.B. 100 für 100 Meter).';
    }
    return null;
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className="flex-1 bg-black">
        <ScrollView className="flex-1 p-4">
          {isLoading ? (
            <LoadingView message="Karte wird geladen..." />
          ) : errorMsg ? (
            <Text className="text-red-400 text-base text-center mt-5">{errorMsg}</Text>
          ) : location ? (
            <>
              {Platform.OS === 'ios' && (
                <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Abbrechen</Text>
                </TouchableOpacity>
              )}
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearching={isSearching}
              />
              <SearchResults
                searchResults={searchResults}
                handleSelectPlace={handleSelectPlace}
              />
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: parseFloat(data.latitude) || location.latitude,
                  longitude: parseFloat(data.longitude) || location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                onPress={handleMapPress}
              >
                {parseFloat(data.latitude) !== 0.0 && parseFloat(data.longitude) !== 0.0 && (
                  <Marker
                    coordinate={{
                      latitude: parseFloat(data.latitude),
                      longitude: parseFloat(data.longitude),
                    }}
                    title={data.title || 'Neuer Pin'}
                    description={data.content || 'Von Nutzer gesetzt'}
                    pinColor="green"
                  />
                )}
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Mein Standort"
                  description="Hier bin ich gerade"
                  pinColor="blue"
                />
              </MapView>
              <CoordinateInput
                latitude={data.latitude}
                longitude={data.longitude}
                setData={setData}
              />
              <FormField
                label="Radius (in Metern)"
                placeholder="Radius eingeben (z.B. 100)"
                value={data.radius}
                onChangeText={handleRadiusChange}
                keyboardType="numeric"
                hasError={data.radius.length > 0 && !isPositiveNumber(data.radius)}
                errorMessage={getRadiusError()}
              />
              <FormField
                label="Titel"
                placeholder="Titel eingeben"
                value={data.title}
                onChangeText={(text) => setData((prev) => ({ ...prev, title: text }))}
                isRequired={data.title.length === 0}
              />
              <FormField
                label="Inhalt"
                placeholder="Inhalt eingeben"
                value={data.content}
                onChangeText={(text) => setData((prev) => ({ ...prev, content: text }))}
                multiline={true}
                numberOfLines={6}
                isRequired={data.title.length === 0}
              />
              <View style={styles.buttonContainer}>
                <SubmitButton
                  onPress={handleSubmit}
                  disabled={!areAllFieldsValid()}
                >
                  {!areAllFieldsValid() ? 'Bitte alle Felder ausfüllen' : 'Speichern'}
                </SubmitButton>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <View className="w-16 h-16 rounded-lg bg-red-500 justify-center items-center">
                    <MaterialIcons
                      size={40}
                      style={{ marginBottom: -3 }}
                      name="delete"
                      color="black"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <LoadingView message="Standort wird geladen..." />
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 300,
    marginBottom: 16,
    borderRadius: 10,
  },
  cancelButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  cancelText: {
    color: 'red',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButton: {
    marginLeft: 10,
  },
});

export default EditReminder;