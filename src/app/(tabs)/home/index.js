import ReminderListItem from "@/components/ReminderListItem";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, FlatList, StatusBar, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAsyncStorage } from '@react-native-async-storage/async-storage';

export default function Page() {
  const onPress = () => {
    const router = useRouter();
    router.push('../edit');
  }

  const {getItem, setItem} = useAsyncStorage('reminder');  
  
  const [reminderData, setReminderData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const getData = () => {
    setIsLoading(true);
    getItem().then((value) => {
      if (value) {   
        console.log('reminderData:', JSON.parse(value));             
        setReminderData(JSON.parse(value))
      }
    }).catch(error => {
        console.error("Error loading items:", error)
    }).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {    
    return getData;
  }, []);

  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 w-full h-full bg-black" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar barStyle="light-content"/>
      <FlatList
        data={reminderData}
        renderItem={({ item, index }) => <ReminderListItem item={item} onPress={onPress}/>}
        keyExtractor={(_, index) => index.toString()}
        contentContainerClassName="px-2.5"
        refreshControl={<RefreshControl
          refreshing={isLoading}
          onRefresh={() => getData()}            
          colors={["#fff"]}
          tintColor={"#fff"}
        />}
      />
    </View>
  );
}
