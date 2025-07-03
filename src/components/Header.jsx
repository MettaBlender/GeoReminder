import { View, Text, useWindowDimensions } from 'react-native';
import React from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const Header = ({ title, subtitle }) => {
  // Überprüfe, ob title definiert ist
  if (!title) {
    return (
      <View>
        <Text className='text-white'>Fehler: Titel fehlt</Text>
      </View>
    );
  }

  const {width} = useWindowDimensions();

  return (
    <View className='bg-transparent h-full' style={{ justifyContent: 'start', alignItems: 'center' }}>
      <MaskedView
        style={{ flexDirection: 'row', height: 40, width: width }}
        maskElement={
          <View style={{ width: width, justifyContent: 'start', alignItems: 'center' }}>
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
      <View className='h-[1px] w-full bg-white' style={{marginVertical: 1}} />
      <Text style={{fontSize: 15, color: '#fff'}}>{subtitle}</Text>
    </View>
  );
};

export default Header;