import { View, TextInput, Text } from 'react-native';
import React from 'react';

const FormField = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  multiline = false, 
  numberOfLines = 1, 
  keyboardType = 'default',
  hasError = false,
  isRequired = false,
  errorMessage
}) => {
  const getInputClass = () => {
    let baseClass = 'flex-1 bg-white rounded-lg p-3 mr-2 border text-black';
    if (hasError) return `${baseClass} border-red-500 border-2`;
    if (isRequired) return `${baseClass} border-orange-400`;
    return `${baseClass} border-gray-300`;
  };

  return (
    <View>
      <Text className="text-white text-lg font-bold mb-2">{label}</Text>
      <TextInput
        className={getInputClass()}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {errorMessage && (
        <Text className="text-red-400 text-sm text-center mt-1 mb-2">
          {errorMessage}
        </Text>
      )}
    </View>
  );
};

export default FormField;
