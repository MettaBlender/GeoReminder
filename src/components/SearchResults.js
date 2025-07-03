import { ScrollView, TouchableOpacity, Text } from 'react-native';
import React from 'react';

const SearchResults = ({ searchResults, handleSelectPlace }) => {
  if (searchResults.length === 0) return null;

  return (
    <ScrollView 
      className="bg-white rounded-lg max-h-36 mb-2 border border-gray-300"
      nestedScrollEnabled={true}
    >
      {searchResults.map((item) => (
        <TouchableOpacity
          key={item.place_id}
          className="p-2.5 border-b border-gray-200"
          onPress={() => handleSelectPlace(item)}
        >
          <Text className="text-black text-sm">{item.display_name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default SearchResults;
