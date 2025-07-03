import Header from "@/components/Header";
import "../global.css";
import { Stack } from "expo-router";

export default function Layout() {
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
        options={{ presentation: "modal", title: "Modal",
          headerTitle: () => (<Header title="Erinnerung bearbeiten" subtitle="Bearbeite deine Erinnerung"/>)
         }}
      />
    </Stack>
  )
}
