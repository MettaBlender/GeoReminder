import { View, Text, useWindowDimensions } from 'react-native';
import React from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const Header = ({ title, subtitle }) => {
  if (!title) {
    return (
      <View>
        <Text className='text-white'>Fehler: Titel fehlt</Text>
      </View>
    );
  }

  const { width } = useWindowDimensions();

  return (
    <View className='bg-transparent' style={{ justifyContent: 'center', alignItems: 'center' }}>
      <MaskedView
        style={{ flexDirection: 'row', height: 40, width: width * 0.8 }}
        maskElement={
          <View style={{ width: width * 0.8, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{
              fontSize: 30,
              fontWeight: 'bold',
              color: 'black',
              textAlign: 'center',
              backgroundColor: 'transparent'
            }}>
              {title}
            </Text>
          </View>
        }
      >
        <LinearGradient
          colors={['#33A5F6', '#4CAF50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1.3 }}
          style={{ flex: 1 }}
        />
      </MaskedView>
      <Text style={{ fontSize: 15, color: '#fff', marginTop: 4, marginBottom: 6 }}>
        {subtitle}
      </Text>
      <View style={{ height: 1, width: width * 0.8, backgroundColor: '#ffffff' }} />
    </View>
  );
};

export default Header;