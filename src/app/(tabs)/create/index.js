import { View,ScrollView ,TextInput, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';


const Index = () => {
  const [location, setLocation] = useState(null);

  const [data, setData] = useState({
    title: "",
    content: "",
    radius: "",
    latitude: '0.0',
    longitude: '0.0'
  });
  const { title, content, radius, latitude, longitude } = data
  const {getItem, setItem} = useAsyncStorage('reminder');


  const handleSubmit = () => {
    console.log('data:', data );
    
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
        <Text className="text-lg text-white  font-bold mb-2 mt-0">Koordinaten:</Text> 
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Radius eingeben"
            readOnly
            value={latitude + " " + longitude}
            onChangeText={ (e) => setData((prev) => ({...prev, latitude: e, longitude: e}))}
          />

        <Text className="text-lg text-white  font-bold mb-2 mt-0">Radius</Text> 
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Radius eingeben"
            value={radius}
            onChangeText={(e) => setData((prev) => ({...prev, radius: e}))}
          />

          
        
          <Text className="text-lg text-white  font-bold mb-2 mt-0">Titel</Text> 
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Titel eingeben"
            value={title}
            onChangeText={(e) => setData((prev) => ({...prev, title: e}))}
          />

          <Text className="text-lg text-white font-bold mb-2 mt-0">Inhalt</Text> 
          <TextInput
            className="border text-black bg-white border-gray-300 rounded-lg p-3 h-40 text-top mb-4"
            placeholder="Inhalt eingeben"
            value={content}
            onChangeText={(e) => setData((prev) => ({...prev, content: e}))}
            multiline={true}
            numberOfLines={6}
          />
          

          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-green-500 rounded-lg p-4 my-4"
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
    marginBottom: 10,
    cornerRadius: 10 ,
  },
});

export default Index;