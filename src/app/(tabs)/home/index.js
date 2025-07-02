import ReminderListItem from "@/components/ReminderListItem";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View, FlatList, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const reminderData = [
  { id: '1', icon: 'home', title: 'Meeting at Office', description: 'Discuss project updates at 2 PM' },
  { id: '2', icon: 'home', title: 'Doctor Appointment', description: 'Check-up at 10 AM tomorrow' },
  { id: '3', icon: 'home', title: 'Team Lunch', description: 'Lunch with team at 12 PM' },
  { id: '4', icon: 'home', title: 'Grocery Shopping', description: 'Buy milk and bread' },
  { id: '5', icon: 'home', title: 'Flight Booking', description: 'Book flight for vacation' },
  { id: '6', icon: 'home', title: 'Deadline', description: 'Submit report by 5 PM' },
  { id: '7', icon: 'home', title: 'Dinner Reservation', description: 'Reserve table at 7 PM' },
  { id: '8', icon: 'home', title: 'Pay Rent', description: 'Rent due by end of month' },
];

const onPress = () => {
  const router = useRouter();
  router.push('../edit');
}

export default function Page() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 w-full bg-black" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar barStyle="light-content"/>
      <Text className="text-center text-lg">Hello Expo</Text>
      <FlatList
        data={reminderData}
        renderItem={({ item }) => <ReminderListItem item={item} onPress={onPress}/>}
        keyExtractor={item => item.id}
        contentContainerClassName="px-2.5"
      />
    </View>
  );
}
