import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Page() {
  return (
    <View className="flex w-full h-full items-center justify-center">
      <Text>Hello Expo</Text>
    </View>
  );
}
