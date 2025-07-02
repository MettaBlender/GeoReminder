import "../global.css";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit/index"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  )
}
