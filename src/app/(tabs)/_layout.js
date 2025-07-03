import "@/global.css";
import { Slot, Tabs } from "expo-router";
import { Text } from "react-native";
import BottomnavIcon from "@/components/BottomnavIcon";
import Header from "@/components/Header";

export default function Layout() {

  const tabs = [
    {
      name: "home/index",
      title: "Home",
      subtitle: "Alle deine Erinnerungen",
     icon: "home-outline",
    iconFocused: "home"
    },
    {
      name: "create/index",
      title: "Erinnerung erstellen",
      subtitle: "Erstelle eine neue Erinnerung",
      icon: "add-outline",
    iconFocused: "add"
    },
    {
      name: "map/index",
      title: "Karte",
      subtitle: "Alle Erinnerungen auf der Karte",
       icon: "map-outline",
    iconFocused: "map"
    },
  ]

  return (
    <>
      <Tabs
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
        {tabs?.map(({name, title, subtitle, icon, iconFocused}) => {
          return (
            <Tabs.Screen key={name} name={name} options={{
              headerTitle: () => <Header title={title} subtitle={subtitle}/>,
              tabBarIcon: ({ color, focused }) => (
                  <BottomnavIcon name={focused ? iconFocused : icon} color={color}/>
                ),
              }}
            />
          )
        })}
      </Tabs>
    </>
  )
}
