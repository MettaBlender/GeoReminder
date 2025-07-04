import { View, TextInput, Text } from 'react-native';
import React from 'react';

const FormField = ({
  label,
  placeholder,
  value = '',
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  hasError = false,
  isRequired = false,
  errorMessage,
  secureTextEntry = false
}) => {
  const getInputClass = () => {
    let baseClass = 'bg-white rounded-lg p-3 border text-black';
    if (hasError) return `${baseClass} border-red-500 border-2`;
    if (isRequired) return `${baseClass} border-orange-400`;
    return `${baseClass} border-gray-300`;
  };

  const getInputHeight = () => {
    if (multiline) {
      return numberOfLines * 20 + 24; // 20px pro Zeile + padding
    }
    return 48; // Feste Höhe für einzeilige Inputs
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text className="text-white text-lg font-bold mb-2">{label}</Text>
      <View style={{ height: getInputHeight() }}>
        <TextInput
          className={getInputClass()}
          style={{
            height: '100%',
            minHeight: getInputHeight(),
            maxHeight: getInputHeight()
          }}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value || ''}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          textAlignVertical={multiline ? "top" : "center"}
          secureTextEntry={secureTextEntry}
        />
      </View>
      {errorMessage && (
        <Text className="text-red-400 text-sm text-center mt-1">
          {errorMessage}
        </Text>
      )}
    </View>
  );
};

export default FormField;
