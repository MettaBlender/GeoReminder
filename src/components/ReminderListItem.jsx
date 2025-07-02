import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from "@expo/vector-icons/MaterialIcons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Link } from 'expo-router';
import "../global.css";

const ReminderListItem = ({item, onPresss}) => {
  return (
    <View className='flex-row items-center p-2.5 border-b border-white'>
        <View className="" >
            <Ionicons size={28} style={{ margin: -3 }} name={item.icon} color="white" className='gradient'/>
        </View>
        <View className="flex-1">
            <Text className="text-white text-lg font-bold">{item.titel}</Text>
            <Text className="text-white text-base">{item.description}</Text>
        </View>
        <Link href="/edit" asChild>
          <TouchableOpacity onPress={onPresss}>
              <MaterialIcons size={28} style={{ margin: -3 }} name="edit" color="white"/>
          </TouchableOpacity>
        </Link>
    </View>
  )
}

export default ReminderListItem