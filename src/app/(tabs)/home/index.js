import ReminderListItem from "@/components/ReminderListItem";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, FlatList, StatusBar, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function Page() {
  const router = useRouter(); // Moved to top level

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

      // Lokale benutzerspezifische Daten laden
      const localData = await getItem();
      const allLocalReminders = localData ? JSON.parse(localData) : {};
      const userReminders = allLocalReminders[activeUserId] || [];

      // Backup: Lokale Daten an Backend senden (nur falls sie noch nicht existieren)
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

      // Backend-Daten als zusätzliches Backup holen (überschreibt NICHT lokale Daten)
      const response = await fetch(`${API_BASE_URL}/api/reminders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const backendReminders = result.data || [];

        // Nur mergen, wenn lokale Daten leer sind
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
      // Aktuelle Benutzer-ID laden
      const user = await getCurrentUser();

      const value = await getItem();
      const rawData = value ? JSON.parse(value) : {};

      console.log('Raw storage data:', rawData);

      // Migration: Überprüfe ob die Daten im alten Format (Array) gespeichert sind
      let allReminders = {};
      if (Array.isArray(rawData)) {
        console.log('Migriere alte Datenstruktur...');
        // Alte Daten waren ein Array - migriere zu unsigned
        allReminders['unsigned'] = rawData;
        await setItem(JSON.stringify(allReminders));
        console.log('Migration abgeschlossen:', allReminders);
      } else {
        allReminders = rawData;
      }

      if (!user) {
        // Kein angemeldeter Benutzer - zeige unsignierte Reminders
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

      // Nur aktualisieren wenn sich der Benutzer geändert hat
      if (currentUserId !== userId) {
        setCurrentUserId(userId);

        // Sofort leeren, um keine Daten des vorherigen Benutzers anzuzeigen
        setReminderData([]);

        // Benutzerspezifische lokale Daten laden
        const userReminders = allReminders[userId] || [];

        console.log('reminderData für User', userId, ':', userReminders);
        setReminderData(userReminders);

        // Dann mit Backend synchronisieren
        await syncWithBackend(userId);
      } else if (currentUserId) {
        // Wenn derselbe Benutzer, aktualisiere die Daten und sync mit Backend
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

  // Bestehende useEffect für initiale Ladung
  useEffect(() => {
    getData();
  }, []);

  // Neue useFocusEffect für Aktualisierung beim Tab-Wechsel
  useFocusEffect(
    useCallback(() => {
      getData();
      return () => {}; // Cleanup-Funktion
    }, [])
  );

  const onPress = (index) => {
    console.log('Navigating to edit with id:', index); // For debugging
    router.push(`/edit?id=${index.toString()}`);
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
            onPress={() => onPress(index)} // Pass a function that calls onPress with index
          />
        )}
        keyExtractor={(_, index) => index.toString()}
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