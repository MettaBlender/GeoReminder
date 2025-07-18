import "@/global.css";
import { Slot, Tabs } from "expo-router";
import { Text, Platform } from "react-native";
import BottomnavIcon from "@/components/BottomnavIcon";
import Header from "@/components/Header";

export default function Layout() {

  const tabs = [
    {
      name: "home/index",
      title: "Home",
      titleTop: "Home",
      subtitle: "Alle deine Erinnerungen",
     icon: "home-outline",
    iconFocused: "home"
    },
    {
      name: "create/index",
      title: "Erstellen",
      titleTop: "Erinnerung erstellen",
      subtitle: "Erstelle eine neue Erinnerung",
      icon: "add-outline",
    iconFocused: "add"
    },
    {
      name: "map/index",
      title: "Karte",
      titleTop: "Karte",
      subtitle: "Alle Erinnerungen auf der Karte",
       icon: "map-outline",
    iconFocused: "map"
    },
    {
      name: "login/index",
      title: "Profil",
      titleTop: "Profil",
      subtitle: "Anmelden oder registrieren",
      icon: "person-outline",
      iconFocused: "person"
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
            height: 90,
            paddingTop: 10,
          },
          headerStyle: { backgroundColor: '#000000', height: Platform.OS === 'ios' ? 120 : 110 },
          headerTintColor: '#ffffff',
          headerTitleAlign: 'center',
        }}
      >
        {tabs?.map(({name, titleTop, title, subtitle, icon, iconFocused}) => {
          return (
            <Tabs.Screen key={name} name={name} options={{
              title: '',
              headerTitle: () => <Header title={titleTop} subtitle={subtitle}/>,
              tabBarIcon: ({ color, focused }) => (
                icon ? <BottomnavIcon name={focused ? iconFocused : icon}/> : null
              ),
              }}
            />
          )
        })}
      </Tabs>
    </>
  )
}
