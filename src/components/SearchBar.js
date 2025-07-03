import { View, TextInput, ActivityIndicator } from 'react-native';
import React from 'react';

const SearchBar = ({ searchQuery, setSearchQuery, isSearching }) => {
  return (
    <View className="flex-row items-center mb-2">
      <TextInput
        className="flex-1 bg-white rounded-lg p-3 border border-gray-300 text-black"
        placeholder="Ort suchen (z.B. Bern, Schweiz)"
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {isSearching && (
        <ActivityIndicator
          size="small"
          color="#fff"
          className="ml-2"
        />
      )}
    </View>
  );
};

export default SearchBar;
