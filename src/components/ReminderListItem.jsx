import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import "../global.css";
import Logo from '../assets/logo.svg';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

const ReminderListItem = ({ item, onPress, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteThreshold = screenWidth * 0.25; // 25% der Bildschirmbreite (etwas weniger für bessere UX)
  const isDeleting = useRef(false);

  const handleMapPress = () => {
    router.push(`/map?latitude=${item.latitude}&longitude=${item.longitude}&from=home`);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Nur bei horizontalen Swipes reagieren
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Nur nach rechts swipen erlauben (negative Werte)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isDeleting.current) return; // Verhindere mehrfaches Löschen

        if (gestureState.dx < -deleteThreshold) {
          // Schwellenwert überschritten - Item löschen
          isDeleting.current = true;
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            if (onDelete) {
              onDelete();
            }
          });
        } else {
          // Zurück zur ursprünglichen Position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Roter Hintergrund mit Papierkorb-Icon */}
      <View style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        zIndex: 1,
      }}>
        <MaterialIcons size={28} name="delete" color="white" />
      </View>

      {/* Swipebares Item */}
      <Animated.View
        style={{
          transform: [{ translateX }],
          zIndex: 2,
        }}
        {...panResponder.panHandlers}
      >
        <View className='flex-row items-center p-2.5 border-b border-white bg-black'>
          <TouchableOpacity className='mr-4' onPress={handleMapPress}>
            <Logo width={28} height={28} />
          </TouchableOpacity>
          <TouchableOpacity className="flex-1" onPress={handleMapPress}>
            <Text className="text-white text-lg font-bold" numberOfLines={1} ellipsizeMode='true'>{item.title}</Text>
            <Text className="text-white text-base" numberOfLines={1} ellipsizeMode='true'>{item.content}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPress}>
            <MaterialIcons size={28} style={{ margin: -3, marginLeft: 4 }} name="edit" color="white"/>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default ReminderListItem;