import ReminderListItem from "@/components/ReminderListItem";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, FlatList, StatusBar, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function Page() {
  const router = useRouter();

  const {getItem, setItem} = useAsyncStorage('reminder');
  const { getItem: getToken } = useAsyncStorage('authToken');
  const { getItem: getCurrentUser } = useAsyncStorage('currentUser');

  const [reminderData, setReminderData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  const API_BASE_URL = 'https://geo-reminder-backend.vercel.app';


  const syncWithBackend = async (userId = null) => {
    try {
      const token = await getToken();
      const activeUserId = userId || currentUserId;

      if (!token || !activeUserId) {
        console.log('Kein Token oder User ID gefunden, Backend-Sync übersprungen');
        return;
      }

      const localData = await getItem();
      const allLocalReminders = localData ? JSON.parse(localData) : {};
      const userReminders = allLocalReminders[activeUserId] || [];

      for (const reminder of userReminders) {
        try {
          await fetch(`${API_BASE_URL}/api/reminders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: reminder.title,
              content: reminder.content,
              latitude: reminder.latitude,
              longitude: reminder.longitude,
              radius: reminder.radius,
            }),
          });
        } catch (error) {
          console.error('Fehler beim Backup einer Erinnerung:', error);
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/reminders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const backendReminders = result.data || [];

        if (userReminders.length === 0 && backendReminders.length > 0) {
          const updatedLocalData = { ...allLocalReminders };
          updatedLocalData[activeUserId] = backendReminders;
          await setItem(JSON.stringify(updatedLocalData));
          setReminderData(backendReminders);
          console.log('Backend-Daten als Backup geladen da keine lokalen Daten vorhanden');
        } else {
          console.log('Lokale Daten beibehalten, Backend als Backup gespeichert');
        }
      } else {
        console.error('Fehler beim Abrufen der Backend-Daten:', response.status);
      }
    } catch (error) {
      console.error('Fehler bei Backend-Synchronisation:', error);
    }
  };

  const getData = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();

      const value = await getItem();
      const rawData = value ? JSON.parse(value) : {};

      console.log('Raw storage data:', rawData);

      let allReminders = {};
      if (Array.isArray(rawData)) {
        console.log('Migriere alte Datenstruktur...');
        allReminders['unsigned'] = rawData;
        await setItem(JSON.stringify(allReminders));
        console.log('Migration abgeschlossen:', allReminders);
      } else {
        allReminders = rawData;
      }

      if (!user) {
        console.log('Kein angemeldeter Benutzer gefunden - zeige unsignierte Reminders');
        const unsignedReminders = allReminders['unsigned'] || [];
        console.log('Unsigned reminders:', unsignedReminders);
        setReminderData(unsignedReminders);
        setCurrentUserId(null);
        setIsLoading(false);
        return;
      }

      const userData = JSON.parse(user);
      const userId = userData.id || userData.username;

      if (currentUserId !== userId) {
        setCurrentUserId(userId);

        setReminderData([]);

        const userReminders = allReminders[userId] || [];

        console.log('reminderData für User', userId, ':', userReminders);
        setReminderData(userReminders);

        await syncWithBackend(userId);
      } else if (currentUserId) {
        const userReminders = allReminders[userId] || [];
        console.log('Aktualisiere Daten für bestehenden User', userId, ':', userReminders);
        setReminderData(userReminders);
        await syncWithBackend(userId);
      }
    } catch (error) {
      console.error("Error loading items:", error);
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

  const onPress = (index) => {
    console.log('Navigating to edit with id:', index);
    router.push(`/edit?id=${index.toString()}`);
  };

  const handleDeleteReminder = async (itemToDelete, index) => {
    try {
      console.log('Lösche Item:', itemToDelete, 'an Index:', index);

      const user = await getCurrentUser();
      const value = await getItem();
      const allReminders = value ? JSON.parse(value) : {};

      let userId = 'unsigned';
      if (user) {
        const userData = JSON.parse(user);
        userId = userData.id || userData.username;
      }

      const userReminders = allReminders[userId] || [];

      const itemIndex = userReminders.findIndex(reminder =>
        reminder.title === itemToDelete.title &&
        reminder.content === itemToDelete.content &&
        reminder.latitude === itemToDelete.latitude &&
        reminder.longitude === itemToDelete.longitude
      );

      if (itemIndex === -1) {
        console.error('Item nicht gefunden für Löschung');
        return;
      }

      console.log('Gefundener Index für Löschung:', itemIndex);

      const removedItem = userReminders.splice(itemIndex, 1)[0];
      console.log('Gelöschtes Item:', removedItem);

      allReminders[userId] = userReminders;
      await setItem(JSON.stringify(allReminders));

      setReminderData([...userReminders]);

      if (currentUserId && removedItem?.id) {
        try {
          const token = await getToken();
          if (token) {
            await fetch(`${API_BASE_URL}/api/reminders/${removedItem.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            console.log('Item vom Backend gelöscht');
          }
        } catch (error) {
          console.error('Fehler beim Löschen vom Backend:', error);
        }
      }
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
            onPress={() => onPress(index)}
            onDelete={() => handleDeleteReminder(item, index)}
          />
        )}
        keyExtractor={(item, index) => `${item.title}-${item.latitude}-${item.longitude}-${index}`}
        contentContainerClassName="px-2.5"
        refreshControl={<RefreshControl
          refreshing={isLoading}
          onRefresh={() => getData()}
          colors={["#33a5f6"]}
          tintColor={"#fff"}
        />
      }
      ListEmptyComponent={() => (
        !isLoading && (
          <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 20 }}>
            <Text style={{ color: "white" }}>Noch gibt es Keine Erinnerungen...</Text>
          </View>
        )
      )}
      />
    </View>
  );
}