import { View, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, Alert, Text, KeyboardAvoidingView, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import SearchBar from '../../../components/SearchBar';
import SearchResults from '../../../components/SearchResults';
import FormField from '../../../components/FormField';
import CoordinateInput from '../../../components/CoordinateInput';
import SubmitButton from '../../../components/SubmitButton';
import LoadingView from '../../../components/LoadingView';
import { router } from 'expo-router';
import SyncManager from '../../../utils/syncManager';

const Index = () => {
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
  const { title, content, radius, latitude, longitude } = data;
  const { getItem, setItem } = useAsyncStorage('reminder');
  const { getItem: getCurrentUser } = useAsyncStorage('currentUser');

  const searchCache = {};

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
      if (searchCache[query]) {
        setSearchResults(searchCache[query]);
        setIsSearching(false);
        return;
      }
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
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Unerwartete Antwort:', text);
        throw new Error('Antwort ist kein JSON');
      }
      const results = await response.json();
      setSearchResults(results);
      searchCache[query] = results;
    } catch (error) {
      console.error('Fehler bei der Suche:', error.message);
      Alert.alert('Fehler', 'Die Suche konnte nicht durchgeführt werden. Bitte versuchen Sie es später erneut.');
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
    setLocation((prev) => ({
      ...prev,
      region: {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
    }));
    setSearchQuery(place.display_name);
    setSearchResults([]);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSubmit = async () => {
    if (!areAllFieldsValid()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }

    try {
      const user = await getCurrentUser();
      let userId = 'unsigned';

      if (user) {
        try {
          const userData = JSON.parse(user);
          userId = userData.id || userData.username || 'unsigned';
        } catch (parseError) {
          console.warn('Fehler beim Parsen der Benutzerdaten, verwende unsigned:', parseError);
          userId = 'unsigned';
        }
      }

      console.log('Erstelle Reminder für User:', userId);

      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newReminder = {
        localId: localId,
        title: title.trim(),
        content: content.trim(),
        radius: parseFloat(radius),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isDeleted: false,
        synced: false
      };

      console.log('Neuer Reminder:', newReminder);

      await SyncManager.createLocalReminder(userId, newReminder);
      console.log('Reminder lokal erstellt');

      setData({
        title: '',
        content: '',
        radius: '',
        latitude: '0.0',
        longitude: '0.0',
      });

      router.push('/(tabs)/home');
    } catch (error) {
      console.error('Fehler beim Erstellen des Reminders:', error);
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Standortzugriff verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte gewähren Sie den Zugriff auf den Standort.');
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

  const isPositiveNumber = (value) => {
    const numericRegex = /^[0-9]+(\.[0-9]+)?$/;
    if (!numericRegex.test(value.trim())) {
      return false;
    }

    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && isFinite(num);
  };

  const areAllFieldsValid = () => {
    return (
      title.trim() !== '' &&
      content.trim() !== '' &&
      radius.trim() !== '' &&
      isPositiveNumber(radius) &&
      latitude !== '0.0' &&
      longitude !== '0.0' &&
      latitude.trim() !== '' &&
      longitude.trim() !== ''
    );
  };

  const handleRadiusChange = (text) => {
    const numericText = text.replace(/[^0-9.]/g, '');
    const parts = numericText.split('.');
    const filteredText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
    setData((prev) => ({ ...prev, radius: filteredText }));
  };

  const getRadiusError = () => {
    if (radius.length === 0) return null;
    if (!/^[0-9]+(\.[0-9]+)?$/.test(radius.trim())) {
      return 'Bitte geben Sie nur Ziffern ein (z.B. 100 oder 50.5).';
    }
    if (!isPositiveNumber(radius)) {
      return 'Bitte geben Sie eine positive Zahl für den Radius ein (z.B. 100 für 100 Meter).';
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior='padding'
      keyboardVerticalOffset={Platform.OS === 'ios' ? 150 : 100}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View className="flex-1 bg-black">
          <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
            {isLoading ? (
              <LoadingView message="Karte wird geladen..." />
            ) : errorMsg ? (
              <Text className="text-red-400 text-base text-center mt-5">{errorMsg}</Text>
            ) : location ? (
              <>
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
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  region={location.region}
                  showsUserLocation={true}
                  onPress={handleMapPress}
                >
                  {parseFloat(latitude) !== 0.0 && parseFloat(longitude) !== 0.0 && (
                    <Marker
                      coordinate={{
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                      }}
                      title={title || 'Neuer Pin'}
                      description={content || 'Von Nutzer gesetzt'}
                      pinColor="#4CAF50"
                    />
                  )}
                </MapView>

                <CoordinateInput
                  latitude={latitude}
                  longitude={longitude}
                  setData={setData}
                />
              </>
            ) : (
              <LoadingView message="Standort wird geladen..." />
            )}
            <FormField
              label="Radius (in Metern)"
              placeholder="Radius eingeben (z.B. 100)"
              value={radius}
              onChangeText={handleRadiusChange}
              keyboardType="numeric"
              hasError={radius.length > 0 && !isPositiveNumber(radius)}
              errorMessage={getRadiusError()}
            />

            <FormField
              label="Titel"
              placeholder="Titel eingeben"
              value={title}
              onChangeText={(text) => setData((prev) => ({ ...prev, title: text }))}
              isRequired={title.length === 0}
            />

            <FormField
              label="Inhalt"
              placeholder="Inhalt eingeben"
              value={content}
              onChangeText={(text) => setData((prev) => ({ ...prev, content: text }))}
              multiline={true}
              numberOfLines={6}
              isRequired={content.length === 0}
            />
            <View style={{ marginBottom: 40 }}>
              <SubmitButton
                onPress={handleSubmit}
                disabled={!areAllFieldsValid()}
              >
                {!areAllFieldsValid() ? 'Bitte alle Felder ausfüllen' : 'Erstellen'}
              </SubmitButton>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 300,
    marginBottom: 16,
    borderRadius: 10,
  },
});

export default Index;