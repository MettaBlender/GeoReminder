import { View, ActivityIndicator, Text } from 'react-native';
import React from 'react';

const LoadingView = ({ message = "Wird geladen..." }) => {
  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="#ffffff" />
      <Text className="text-white text-base text-center">{message}</Text>
    </View>
  );
};

export default LoadingView;
