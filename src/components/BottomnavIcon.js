import React from 'react'
import { View } from 'react-native'
import Ionicons from "@expo/vector-icons/Ionicons"
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient';


const BottomnavIcon = ({ name, color, focused }) => {
  const size = 28;

  if (focused) {
    return (
      <Ionicons 
        size={size}
        style={{ marginBottom: -3 }}
        name={name}
        color={color}
      />
    );
  }


  return (
    <MaskedView
      maskElement={
        <View style={{ justifyContent: "center", alignItems: "center" }}>

          <Ionicons 
            name={name}
            size={size}
            color="black"
            style={{ marginBottom: -3 }}
          />

        </View>
      }
    >
      <LinearGradient
        colors={['#33A5F6', '#4CAF50']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ width: size, height: size }}
       />

    </MaskedView>
  );
};

export default BottomnavIcon;