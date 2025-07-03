import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import "../global.css";
import Logo from '../assets/logo.svg'; // Adjust path if necessary

const ReminderListItem = ({ item, onPress }) => {
  return (
    <View className='flex-row items-center p-2.5 border-b border-white'>
        <View className='mr-4'>
          <Logo width={28} height={28} />
        </View>
        <View className="flex-1">
            <Text className="text-white text-lg font-bold" numberOfLines={1} ellipsizeMode='true'>{item.title}</Text>
            <Text className="text-white text-base" numberOfLines={1} ellipsizeMode='true'>{item.content}</Text>
        </View>
        <TouchableOpacity onPress={onPress}>
            <MaterialIcons size={28} style={{ margin: -3 }} name="edit" color="white"/>
        </TouchableOpacity>
    </View>
  )
}

export default ReminderListItem