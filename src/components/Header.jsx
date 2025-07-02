import { View, Text } from 'react-native';
import React from 'react';
import { MaskedView } from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const Header = ({ title }) => {
  // Überprüfe, ob title definiert ist
  if (!title) {
    return (
      <View>
        <Text>Fehler: Titel fehlt</Text>
      </View>
    );
  }

  return (
    <MaskedView
      maskElement={
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          {title}
        </Text>
      }
    >
      <LinearGradient
        colors={['#f43f5e', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', opacity: 0 }}>
          {title}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default Header;