import Header from "@/components/Header";
import "../global.css";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Text, View, Dimensions, Platform } from "react-native";

export default function Layout() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#ffffff',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit/index"
        options={{
          presentation: "modal",
          title: "Bearbeiten",
          headerTitle: () => (
            <View style={{ alignItems: 'center', width: screenWidth - 100 }}>
              <Header title="Bearbeiten" subtitle="Bearbeite deine Erinnerung" />
            </View>
          ),
          headerRight: () =>
            Platform.OS === 'ios' ? (
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={{ color: '#007AFF', fontSize: 17, marginRight: 10 }}>
                  Abbrechen
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
    </Stack>
  );
}