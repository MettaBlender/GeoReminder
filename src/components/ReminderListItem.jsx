import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from "@expo/vector-icons/Ionicons"

const ReminderListItem = ({item, onPress}) => {
  return (
    <View className='flex-row items-center bg-grey-900 p-2.5 border-b border-gray700'>
        <View className="" >
            <Ionicons size={28} style={{ margin: -3 }} name={item.icon} color="black"/>
        </View>
        <View className="flex-1">
            <Text className="text-black text-lg font-bold">{item.titel}</Text>
            <Text className="text-black text-base">{item.description}</Text>
        </View>
        <TouchableOpacity onPress={onPress}>
            <Ionicons size={28} style={{ margin: -3 }} name="edit" color="white"/>
        </TouchableOpacity>
    </View>
  )
}

export default ReminderListItem