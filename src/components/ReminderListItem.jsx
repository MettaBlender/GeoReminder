import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import "../global.css";
import Logo from '../assets/logo.svg';
import { router } from 'expo-router';

const ReminderListItem = ({ item, onPress }) => {
  const handleMapPress = () => {
    router.push(`/map?latitude=${item.latitude}&longitude=${item.longitude}&from=home`);
  };

  return (
    <View className='flex-row items-center p-2.5 border-b border-white'>
        <TouchableOpacity className='mr-4' onPress={handleMapPress}>
          <Logo width={28} height={28} />
        </TouchableOpacity>
        <TouchableOpacity className="flex-1" onPress={handleMapPress}>
            <Text className="text-white text-lg font-bold" numberOfLines={1} ellipsizeMode='true'>{item.title}</Text>
            <Text className="text-white text-base" numberOfLines={1} ellipsizeMode='true'>{item.content}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPress}>
            <MaterialIcons size={28} style={{ margin: -3 }} name="edit" color="white"/>
        </TouchableOpacity>
    </View>
  )
}

export default ReminderListItem