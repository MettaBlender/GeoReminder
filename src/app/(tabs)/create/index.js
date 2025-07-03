import Trash from '@/components/Trash';
import { View,ScrollView ,TextInput, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Index = () => {
  const [location, setLocation] = useState(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [radius, setRadius] = useState('');

  const handleSubmit = () => {
    console.log('Titel:', title);
    console.log('Inhalt:', content);
  };

    const dismissKeyboard = () => {
      Keyboard.dismiss();
    };

  

  useEffect(() => {
    (async () => {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung verweigert', 'Bitte erlaube den Zugriff auf den Standort.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} >
    <ScrollView className="flex-1 px-4 bg-black" style={{height: '80%'}}>
      
        {location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
          >
            <Marker
              coordinate={{
                latitude: 20,
                longitude: 20,
              }}
              title="Mein Standort"
              description="Hier bin ich gerade"
              pinColor="blue"
            />
          </MapView>
        )}
        
          <Text className="text-lg text-white  font-bold mb-2 mt-0">Titel</Text> 
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Titel eingeben"
            value={title}
            onChangeText={setTitle}
          />

          <Text className="text-lg text-white font-bold mb-2 mt-0">Inhalt</Text> 
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 h-40 text-top mb-4"
            placeholder="Inhalt eingeben"
            value={content}
            onChangeText={setContent}
            multiline={true}
            numberOfLines={6}
          />
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 h-40 text-top mb-4"
            placeholder="Inhalt eingeben"
            value={content}
            onChangeText={setContent}
            multiline={true}
            numberOfLines={6}
          />
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 h-40 text-top mb-4"
            placeholder="Inhalt eingeben"
            value={content}
            onChangeText={setContent}
            multiline={true}
            numberOfLines={6}
          />
          <Text className="text-lg text-white  font-bold mb-2 mt-0">Radius</Text> 
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Radius eingeben"
            value={radius}
            onChangeText={setRadius}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-green-500 rounded-lg p-4"
          >
          <Text className="text-white text-center font-bold">Absenden</Text>
        </TouchableOpacity>
        
      
    </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    marginTop: 0,
  },
  map: {
    width: '100%',
    height: 300,
    marginTop: 15,
    marginBottom: 5,
    cornerRadius: 10 ,
  },
});

export default Index;