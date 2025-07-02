import "@/global.css";
import { Slot, Tabs } from "expo-router";
import { Text } from "react-native";
import BottomnavIcon from "@/components/BottomnavIcon";

export default function Layout() {

  const tabs = [
    {
      name: "home/index",
      title: "Home",
     icon: "home-outline",
    iconFocused: "home"
    },
    {
      name: "create/index",
      title: "Create",
      icon: "add-outline",
    iconFocused: "add"
    },
    {
      name: "map/index",
      title: "Map",
       icon: "map-outline",
    iconFocused: "map"
    },
  ]

  return (
    <>
      <Text className="mt-6">Header</Text>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: '#ffffff',
          tabBarStyle: {
            backgroundColor: '#000000', 
          },
        }}
      >
        {tabs?.map(({name, title, icon, iconFocused}) => {
          return (
            <Tabs.Screen key={name} name={name} options={{
              title,
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
