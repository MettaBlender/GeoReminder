import { TouchableOpacity, Text, View } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view'

const SubmitButton = ({ onPress, disabled, children }) => {
  const getButtonClass = () => {
    return disabled
      ? 'rounded-lg p-4 my-0'
      : 'rounded-lg p-4 my-0';
  };

  return (
    <LinearGradient
        colors={disabled ? ['#A1B4C2', '#A3B7A5'] : ['#33A5F6', '#4CAF50']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={{ width: '100%', height: 'fit', padding: 0, borderRadius: 8 }}
        className='my-4 mb-8'
    >
      <TouchableOpacity
        className={getButtonClass()}
        onPress={onPress}
        disabled={disabled}
      >
        <Text className="text-white font-bold text-center text-base">
          {children}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default SubmitButton;
