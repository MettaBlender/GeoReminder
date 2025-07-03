import { TouchableOpacity, Text } from 'react-native';
import React from 'react';

const SubmitButton = ({ onPress, disabled, children }) => {
  const getButtonClass = () => {
    return disabled 
      ? 'bg-gray-600 rounded-lg p-4 my-4'
      : 'bg-green-500 rounded-lg p-4 my-4';
  };

  return (
    <TouchableOpacity
      className={getButtonClass()}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text-white font-bold text-center text-base">
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default SubmitButton;
