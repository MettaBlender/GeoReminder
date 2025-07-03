import { View, TextInput, Text } from 'react-native';
import React from 'react';

const CoordinateInput = ({ latitude, longitude, setData }) => {
  return (
    <View>
      <Text className="text-white text-lg font-bold mb-2">Koordinaten</Text>
      <View className="flex-row mb-4 items-center">
        <TextInput
          className="flex-1 bg-white rounded-lg p-3 mr-2 border border-gray-300 text-black"
          placeholder="Latitude"
          placeholderTextColor="#999"
          value={latitude}
          onChangeText={(text) => setData((prev) => ({ ...prev, latitude: text }))}
          keyboardType="numeric"
        />
        <TextInput
          className="flex-1 bg-white rounded-lg p-3 mr-2 border border-gray-300 text-black"
          placeholder="Longitude"
          placeholderTextColor="#999"
          value={longitude}
          onChangeText={(text) => setData((prev) => ({ ...prev, longitude: text }))}
          keyboardType="numeric"
        />
      </View>
    </View>
  );
};

export default CoordinateInput;
