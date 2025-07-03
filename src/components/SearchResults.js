import { FlatList, TouchableOpacity, Text } from 'react-native';
import React from 'react';

const SearchResults = ({ searchResults, handleSelectPlace }) => {
  if (searchResults.length === 0) return null;

  return (
    <FlatList
      data={searchResults}
      keyExtractor={(item) => item.place_id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          className="p-2.5 border-b border-gray-200"
          onPress={() => handleSelectPlace(item)}
        >
          <Text className="text-black text-sm">{item.display_name}</Text>
        </TouchableOpacity>
      )}
      className="bg-white rounded-lg max-h-36 mb-2 border border-gray-300"
    />
  );
};

export default SearchResults;
