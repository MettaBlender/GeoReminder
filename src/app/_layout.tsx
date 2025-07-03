import Header from "@/components/Header";
import "../global.css";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
        screenOptions={{
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: '#ffffff',
          tabBarStyle: {
            backgroundColor: '#000000',
            backgroundColor: '#000000',
          },
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#ffffff',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#ffffff',
          headerTitleAlign: 'center',
        }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit/index"
        options={{ presentation: "modal", title: "Modal",
          headerTitle: () => (<Header title="Erinnerung bearbeiten" subtitle="Bearbeite deine Erinnerung"/>)
         }}
      />
    </Stack>
  )
}
