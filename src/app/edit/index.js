import { View, ScrollView, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, Alert, Text, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import FormField from '@/components/FormField';
import CoordinateInput from '@/components/CoordinateInput';
import LoadingView from '@/components/LoadingView';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import Trash from '@/components/Trash';
import SubmitButton from '@/components/SubmitButton';
import SyncManager from '@/utils/syncManager';

const EditReminder = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getItem, setItem } = useAsyncStorage('reminder');
  const { getItem: getCurrentUser } = useAsyncStorage('currentUser');

  const [location, setLocation] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
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

  useEffect(() => {
    const loadReminder = async () => {
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

        const { default: SyncManager } = await import('@/utils/syncManager');
        const reminders = await SyncManager.getLocalReminders(userId);

        console.log('Lokale Reminders:', reminders);
        console.log('Gesuchte ID:', id);

        let reminder = null;

        console.log('Suche Reminder mit ID:', id);
        console.log('Verfügbare Reminders:', reminders.map(r => ({
          title: r.title,
          localId: r.localId,
          serverId: r.serverId,
          id: r.id
        })));

        if (typeof id === 'string' && id.startsWith('local_')) {
          reminder = reminders.find(r => r.localId === id);
          console.log('Suche nach localId:', id, 'Gefunden:', !!reminder);
        } else if (!isNaN(parseInt(id))) {
          const numericId = parseInt(id);
          reminder = reminders.find(r =>
            (r.serverId && parseInt(r.serverId) === numericId) ||
            (r.id && parseInt(r.id) === numericId)
          );
          console.log('Suche nach numerischer ID:', numericId, 'Gefunden:', !!reminder);

          if (!reminder && numericId >= 0 && numericId < reminders.length) {
            reminder = reminders[numericId];
            console.log('Fallback auf Array-Index:', numericId, 'Gefunden:', !!reminder);
          }
        } else {
          reminder = reminders.find(r =>
            r.serverId === id ||
            r.id === id ||
            r.localId === id ||
            r.title === decodeURIComponent(id)
          );
          console.log('Suche nach beliebigem Identifier:', id, 'Gefunden:', !!reminder);
        }

        console.log('Gefundener Reminder:', reminder);
        console.log('Alle verfügbaren Reminders für Debug:', reminders.map(r => ({
          title: r.title,
          localId: r.localId,
          serverId: r.serverId,
          id: r.id
        })));

        if (reminder) {
          console.log('Gefundener Reminder:', reminder);
          setData({
            title: reminder.title || '',
            content: reminder.content || '',
            radius: reminder.radius?.toString() || '',
            latitude: reminder.latitude?.toString() || '0.0',
            longitude: reminder.longitude?.toString() || '0.0',
          });
        } else {
          console.error('Erinnerung nicht gefunden für ID:', id);
          console.error('Verfügbare Reminders:', reminders.map(r => ({
            title: r.title,
            localId: r.localId,
            serverId: r.serverId,
            id: r.id
          })));
          setErrorMsg(`Erinnerung mit ID "${id}" nicht gefunden.`);
        }
      } catch (error) {
        console.error('Error loading reminder:', error);
        setErrorMsg(`Fehler beim Laden der Erinnerung: ${error.message}`);
      } finally {
        setIsDataLoading(false);
      }
    };
    loadReminder();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Standortzugriff verweigert.');
          Alert.alert('Berechtigung verweigert', 'Bitte gewähren Sie den Zugriff auf den Standort.');
          setIsMapLoading(false);
          return;
        }
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Platform.OS === 'ios' ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setIsMapLoading(false);
      } catch (error) {
        console.error('Fehler beim Abrufen des Standorts:', error);
        setErrorMsg('Fehler beim Laden des Standorts.');
        setIsMapLoading(false);
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
      Alert.alert('Fehler', 'Die Suche konnte nicht durchgeführt werden.');
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

  const handleSubmit = async () => {
    if (!data.title.trim() || !data.content.trim() || !data.radius.trim() || !data.latitude || !data.longitude) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }
    if (!isPositiveNumber(data.radius)) {
      Alert.alert('Fehler', 'Der Radius muss eine positive Zahl sein.');
      return;
    }
    if (data.latitude === '0.0' || data.longitude === '0.0') {
      Alert.alert('Fehler', 'Bitte setzen Sie einen Pin auf der Karte oder geben Sie gültige Koordinaten ein.');
      return;
    }

    try {
      const user = await getCurrentUser();
      let userId = 'unsigned';

      if (user) {
        try {
          const userData = JSON.parse(user);
          userId = userData.id || 'unsigned';
        } catch (parseError) {
          console.warn('Fehler beim Parsen der Benutzerdaten, verwende unsigned:', parseError);
          userId = 'unsigned';
        }
      }

      const updatedData = {
        title: data.title.trim(),
        content: data.content.trim(),
        radius: parseFloat(data.radius),
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        updated_at: new Date().toISOString(),
        synced: false
      };

      const { default: SyncManager } = await import('@/utils/syncManager');
      await SyncManager.updateLocalReminder(userId, id, updatedData);
      router.back();
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Fehler', 'Ein Fehler ist beim Speichern der Erinnerung aufgetreten.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Erinnerung löschen',
      `Möchten Sie die Erinnerung "${data.title}" wirklich löschen? Gelöschte Erinnerungen können nicht wiederhergestellt werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = await getCurrentUser();
              let userId = 'unsigned';

              if (user) {
                try {
                  const userData = JSON.parse(user);
                  userId = userData.id || 'unsigned';
                } catch (parseError) {
                  console.warn('Fehler beim Parsen der Benutzerdaten, verwende unsigned:', parseError);
                  userId = 'unsigned';
                }
              }

              const { default: SyncManager } = await import('@/utils/syncManager');
              await SyncManager.deleteLocalReminder(userId, id);
              router.back();
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Fehler', 'Ein Fehler ist beim Löschen der Erinnerung aufgetreten. Bitte versuchen Sie es erneut.');
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
      return 'Bitte geben Sie nur Ziffern ein (z.B. 100 oder 50.5).';
    }
    if (!isPositiveNumber(data.radius)) {
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
            {isDataLoading ? (
              <LoadingView message="Daten werden geladen..." />
            ) : errorMsg ? (
              <View className="flex-1 justify-center items-center p-4">
                <Text className="text-red-400 text-base text-center mb-4">{errorMsg}</Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="bg-gray-600 px-4 py-2 rounded-md"
                >
                  <Text className="text-white">Zurück</Text>
                </TouchableOpacity>
              </View>
            ) : (
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
              {isMapLoading || !location ? (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator size="large" color="#33a5f6" />
                  <Text style={styles.mapLoadingText}>Karte wird geladen...</Text>
                </View>
              ) : (
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
                </MapView>
              )}
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
                  width="80%"
                >
                  {!areAllFieldsValid() ? 'Bitte alle Felder ausfüllen' : 'Speichern'}
                </SubmitButton>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Trash/>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  mapPlaceholder: {
    width: '100%',
    height: 300,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
  },
  mapLoadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 0,
    marginBottom: 40,
    width: '100%',
  },
  saveButton: {
    flex: 1,
    height: 64,
    marginRight: 8,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    width: 64,
  },
});

export default EditReminder;