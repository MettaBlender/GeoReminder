import ReminderListItem from "@/components/ReminderListItem";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, FlatList, StatusBar, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import SyncManager from '@/utils/syncManager';

export default function Page() {
  const router = useRouter();
  const { getItem: getCurrentUser } = useAsyncStorage('currentUser');

  const [reminderData, setReminderData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const getData = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      let userId = 'unsigned';

      if (user) {
        try {
          const userData = JSON.parse(user);
          userId = userData.id || userData.username || 'unsigned';
        } catch (parseError) {
          console.warn('Fehler beim Parsen der Benutzerdaten, verwende unsigned:', parseError);
          userId = 'unsigned';
        }
      }

      console.log('Lade Daten für User:', userId);

      if (currentUserId !== userId) {
        setCurrentUserId(userId);
        setReminderData([]);
      }

      const result = await SyncManager.getAllReminders(userId);

      if (result.success) {
        setReminderData(result.data || []);
        console.log('Daten erfolgreich geladen:', (result.data || []).length, 'Reminders');
      } else {
        console.error('Fehler beim Laden der Daten:', result.error);
        setReminderData([]);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Items:", error);
      setReminderData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getData();
      return () => {};
    }, [])
  );

  const onPress = (reminder) => {
    let identifier;

    if (reminder.localId) {
      identifier = reminder.localId;
    } else if (reminder.id) {
      identifier = reminder.id;
    } else {
      identifier = reminder.title;
    }

    console.log('Navigiere zu Edit mit Identifier:', identifier);
    console.log('Reminder:', reminder);
    router.push(`/edit?id=${encodeURIComponent(identifier)}`);
  };

  const handleDeleteReminder = async (itemToDelete, index) => {
    try {
      console.log('Lösche Item:', itemToDelete, 'an Index:', index);

      const user = await getCurrentUser();
      let userId = 'unsigned';

      if (user) {
        try {
          const userData = JSON.parse(user);
          userId = userData.id || userData.username || 'unsigned';
        } catch (parseError) {
          console.warn('Fehler beim Parsen der Benutzerdaten, verwende unsigned:', parseError);
          userId = 'unsigned';
        }
      }

      console.log('Lösche Reminder für User:', userId);

      const updatedReminders = await SyncManager.deleteLocalReminder(userId, itemToDelete.localId || itemToDelete.id);
      setReminderData(updatedReminders);
      console.log('Item lokal gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen der Erinnerung:', error);
    }
  };

  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 w-full h-full bg-black" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar barStyle="light-content"/>
      <FlatList
        data={reminderData}
        renderItem={({ item, index }) => (
          <ReminderListItem
            item={item}
            onPress={() => onPress(item)}
            onDelete={() => handleDeleteReminder(item, index)}
          />
        )}
        keyExtractor={(item, index) => item.localId || `${item.title}-${item.latitude}-${item.longitude}-${index}`}
        contentContainerClassName="px-2.5"
        refreshControl={<RefreshControl
          refreshing={isLoading}
          onRefresh={() => getData()}
          colors={["#33a5f6"]}
          tintColor={"#fff"}
        />}
        ListEmptyComponent={() => (
          !isLoading && (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ color: "white" }}>Noch gibt es keine Erinnerungen...</Text>
            </View>
          )
        )}
      />
    </View>
  );
}