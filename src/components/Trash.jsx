import { View, Text } from 'react-native'
import React from 'react'
import Ionicons from "@expo/vector-icons/MaterialIcons"

const Trash = () => {
  return (
    <View className='w-100 justify-end items-end'>
        <View className=' w-16 h-16 rounded-lg bg-red-500 justify-center items-center'>
            <Ionicons
                size={40}
                style={{ marginBottom: -3 }}
                name="delete"
                color="black"
            />   
        </View>
    </View>
  )
}

export default Trash