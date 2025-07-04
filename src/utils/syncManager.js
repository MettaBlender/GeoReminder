import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://geo-reminder-backend.vercel.app';

export class SyncManager {
  constructor() {
    // Prüfe, ob AsyncStorage verfügbar ist
    if (!AsyncStorage) {
      console.error('AsyncStorage ist nicht verfügbar!');
      throw new Error('AsyncStorage ist nicht verfügbar');
    }

    // Verwende AsyncStorage direkt
    this.storage = AsyncStorage;

    // Teste AsyncStorage beim Start
    this.testAsyncStorage();
  }

  async testAsyncStorage() {
    try {
      await this.storage.setItem('test', 'testvalue');
      const value = await this.storage.getItem('test');
      if (value === 'testvalue') {
        console.log('AsyncStorage funktioniert korrekt');
        await this.storage.removeItem('test');
      } else {
        console.error('AsyncStorage Test fehlgeschlagen');
      }
    } catch (error) {
      console.error('AsyncStorage Test Fehler:', error);
    }
  }

  async getCurrentUser() {
    try {
      const user = await this.storage.getItem('currentUser');
      if (!user) return null;

      const userData = JSON.parse(user);
      return {
        id: userData.id || userData.username,
        data: userData
      };
    } catch (error) {
      console.error('Fehler beim Abrufen des aktuellen Users:', error);
      return null;
    }
  }

  async getAuthToken() {
    try {
      return await this.storage.getItem('authToken');
    } catch (error) {
      console.error('Fehler beim Abrufen des Auth-Tokens:', error);
      return null;
    }
  }

  async getLocalReminders(userId) {
    try {
      const value = await this.storage.getItem('reminder');
      const allReminders = value ? JSON.parse(value) : {};

      // Migration von alter Datenstruktur
      if (Array.isArray(allReminders)) {
        const migrated = { 'unsigned': allReminders };
        await this.storage.setItem('reminder', JSON.stringify(migrated));
        return userId === 'unsigned' ? allReminders : [];
      }

      return allReminders[userId] || [];
    } catch (error) {
      console.error('Fehler beim Laden lokaler Reminders:', error);
      return []; // Leeres Array zurückgeben bei Fehler
    }
  }

  async saveLocalReminders(userId, reminders) {
    try {
      const value = await this.storage.getItem('reminder');
      const allReminders = value ? JSON.parse(value) : {};

      // Migration von alter Datenstruktur
      if (Array.isArray(allReminders)) {
        const migrated = { 'unsigned': allReminders };
        await this.storage.setItem('reminder', JSON.stringify(migrated));
      }

      // Füge Timestamps und lokale IDs hinzu falls sie fehlen
      const remindersWithMetadata = reminders.map(reminder => ({
        ...reminder,
        created_at: reminder.created_at || new Date().toISOString(),
        updated_at: reminder.updated_at || new Date().toISOString(),
        localId: reminder.localId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: reminder.synced || false
      }));

      allReminders[userId] = remindersWithMetadata;
      await this.storage.setItem('reminder', JSON.stringify(allReminders));

      console.log('Lokale Reminders gespeichert für User:', userId, 'Anzahl:', remindersWithMetadata.length);
      return remindersWithMetadata;
    } catch (error) {
      console.error('Fehler beim Speichern lokaler Reminders:', error);
      throw error;
    }
  }

  async getLastSyncTime(userId) {
    try {
      const value = await this.storage.getItem('lastSync');
      const syncTimes = value ? JSON.parse(value) : {};
      return syncTimes[userId] || null;
    } catch (error) {
      console.error('Fehler beim Abrufen der letzten Sync-Zeit:', error);
      return null;
    }
  }

  async setLastSyncTime(userId, time) {
    try {
      const value = await this.storage.getItem('lastSync');
      const syncTimes = value ? JSON.parse(value) : {};
      syncTimes[userId] = time;
      await this.storage.setItem('lastSync', JSON.stringify(syncTimes));
    } catch (error) {
      console.error('Fehler beim Speichern der letzten Sync-Zeit:', error);
    }
  }

  async syncWithBackend(userId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('Kein Token verfügbar, Sync übersprungen');
        return { success: false, error: 'Kein Token' };
      }

      const localReminders = await this.getLocalReminders(userId);
      const lastSync = await this.getLastSyncTime(userId);

      console.log('Starte Synchronisation für User:', userId);
      console.log('Lokale Reminders:', localReminders.length);
      console.log('Letzte Sync-Zeit:', lastSync);

      // Formatiere Reminders für Backend
      const formattedReminders = localReminders.map(reminder => ({
        title: reminder.title,
        content: reminder.content,
        latitude: parseFloat(reminder.latitude),
        longitude: parseFloat(reminder.longitude),
        radius: parseFloat(reminder.radius),
        clientUpdatedAt: reminder.updated_at || reminder.created_at,
        isDeleted: reminder.isDeleted || false
      }));

      console.log('Formatierte Reminders für Backend:', formattedReminders);

      // Benutze den optimierten Sync-Endpoint
      const response = await fetch(`${API_BASE_URL}/api/reminders/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reminders: formattedReminders,
          lastSync: lastSync
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend-Sync-Fehler:', response.status, errorText);
        return { success: false, error: `Backend-Fehler: ${response.status}` };
      }

      const result = await response.json();
      const serverReminders = result.data || [];

      console.log('Server-Antwort:', result);
      console.log('Server-Reminders:', serverReminders.length);

      // Aktualisiere lokale Daten mit Server-Daten
      await this.saveLocalReminders(userId, serverReminders);

      // Aktualisiere Sync-Zeit
      await this.setLastSyncTime(userId, result.serverTime);

      console.log('Synchronisation erfolgreich:', serverReminders.length, 'Reminders');

      return {
        success: true,
        data: serverReminders,
        serverTime: result.serverTime
      };
    } catch (error) {
      console.error('Fehler bei der Synchronisation:', error);
      return { success: false, error: error.message };
    }
  }
  async createReminder(userId, reminderData) {
    try {
      const currentTime = new Date().toISOString();

      // Stelle sicher, dass eine lokale ID vorhanden ist
      if (!reminderData.localId) {
        reminderData.localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const newReminder = {
        ...reminderData,
        created_at: currentTime,
        updated_at: currentTime,
        isDeleted: false,
        synced: false
      };

      console.log('Erstelle Reminder für User:', userId);
      console.log('Reminder-Daten:', newReminder);

      // Speichere lokal
      const localReminders = await this.getLocalReminders(userId);
      localReminders.push(newReminder);
      await this.saveLocalReminders(userId, localReminders);

      // Sync mit Backend NUR wenn Benutzer eingeloggt ist
      const user = await this.getCurrentUser();
      const token = await this.getAuthToken();

      if (user && user.id !== 'unsigned' && token) {
        console.log('Benutzer ist eingeloggt - synchronisiere mit Backend');

        // Direkte Backend-Erstellung für sofortiges Feedback
        try {
          const response = await fetch(`${API_BASE_URL}/api/reminders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              reminders: [{
                title: newReminder.title,
                content: newReminder.content,
                latitude: parseFloat(newReminder.latitude),
                longitude: parseFloat(newReminder.longitude),
                radius: parseFloat(newReminder.radius),
                clientUpdatedAt: newReminder.updated_at,
                isDeleted: false
              }]
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Backend-Erstellung erfolgreich:', result);

            // Aktualisiere lokale Daten mit Backend-Antwort und markiere als synchronisiert
            if (result.data && result.data.length > 0) {
              const syncedReminders = result.data.map(serverReminder => ({
                ...serverReminder,
                localId: newReminder.localId, // Behalte lokale ID
                synced: true,
                serverId: serverReminder.id // Speichere Server-ID
              }));

              // Ersetze den lokalen Reminder mit dem synchronisierten
              const updatedReminders = localReminders.map(r =>
                r.localId === newReminder.localId ? syncedReminders[0] : r
              );

              await this.saveLocalReminders(userId, updatedReminders);
              return { success: true, data: syncedReminders[0] };
            }
          } else {
            console.error('Backend-Erstellung fehlgeschlagen:', await response.text());
          }
        } catch (backendError) {
          console.error('Fehler bei Backend-Erstellung:', backendError);
        }
      } else {
        console.log('Benutzer ist nicht eingeloggt - nur lokale Speicherung');
      }

      return { success: true, data: newReminder };
    } catch (error) {
      console.error('Fehler beim Erstellen des Reminders:', error);
      return { success: false, error: error.message };
    }
  }

  async updateReminder(userId, identifier, reminderData) {
    try {
      const currentTime = new Date().toISOString();
      const localReminders = await this.getLocalReminders(userId);

      let index = -1;

      // Suche den Reminder über lokale ID oder Index
      if (typeof identifier === 'string' && identifier.startsWith('local_')) {
        // Suche nach lokaler ID
        index = localReminders.findIndex(r => r.localId === identifier);
      } else if (typeof identifier === 'number') {
        // Behandle als Array-Index (Legacy-Unterstützung)
        index = identifier;
      } else {
        // Suche nach lokaler ID oder anderen Eigenschaften
        index = localReminders.findIndex(r =>
          r.localId === identifier ||
          r.serverId === identifier ||
          r.id === identifier
        );
      }

      if (index === -1 || index >= localReminders.length) {
        throw new Error('Reminder nicht gefunden');
      }

      const updatedReminder = {
        ...localReminders[index],
        ...reminderData,
        updated_at: currentTime,
        synced: false // Markiere als nicht synchronisiert
      };

      localReminders[index] = updatedReminder;
      await this.saveLocalReminders(userId, localReminders);

      console.log('Reminder lokal aktualisiert:', updatedReminder.localId || updatedReminder.title);

      // Sync mit Backend NUR wenn Benutzer eingeloggt ist
      const user = await this.getCurrentUser();
      const token = await this.getAuthToken();

      if (user && user.id !== 'unsigned' && token) {
        console.log('Benutzer ist eingeloggt - synchronisiere mit Backend');
        await this.syncWithBackend(userId);
      } else {
        console.log('Benutzer ist nicht eingeloggt - nur lokale Speicherung');
      }

      return { success: true, data: updatedReminder };
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Reminders:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteReminder(userId, reminder) {
    try {
      const localReminders = await this.getLocalReminders(userId);

      // Suche den Reminder über lokale ID oder andere Eigenschaften
      let index = -1;

      if (reminder.localId) {
        // Suche nach lokaler ID
        index = localReminders.findIndex(r => r.localId === reminder.localId);
      } else {
        // Fallback: Suche nach anderen Eigenschaften
        index = localReminders.findIndex(r =>
          r.title === reminder.title &&
          r.content === reminder.content &&
          r.latitude === reminder.latitude &&
          r.longitude === reminder.longitude
        );
      }

      if (index === -1) {
        throw new Error('Reminder nicht gefunden');
      }

      const deletedReminder = localReminders[index];
      localReminders.splice(index, 1);
      await this.saveLocalReminders(userId, localReminders);

      console.log('Reminder lokal gelöscht:', deletedReminder.localId || deletedReminder.title);

      // Lösche auch vom Backend NUR wenn Benutzer eingeloggt ist
      const user = await this.getCurrentUser();
      const token = await this.getAuthToken();

      if (user && user.id !== 'unsigned' && token && (deletedReminder.serverId || deletedReminder.id)) {
        console.log('Benutzer ist eingeloggt - lösche auch vom Backend');
        try {
          const backendId = deletedReminder.serverId || deletedReminder.id;
          await fetch(`${API_BASE_URL}/api/reminder/${backendId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          console.log('Reminder auch vom Backend gelöscht');
        } catch (backendError) {
          console.error('Fehler beim Löschen vom Backend:', backendError);
          // Synchronisation wird später das Problem lösen
        }
      } else {
        console.log('Benutzer ist nicht eingeloggt - nur lokale Löschung');
      }

      return { success: true, data: localReminders };
    } catch (error) {
      console.error('Fehler beim Löschen des Reminders:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllReminders(userId) {
    try {
      const localReminders = await this.getLocalReminders(userId);

      // Sync mit Backend NUR wenn Benutzer eingeloggt ist
      const user = await this.getCurrentUser();
      const token = await this.getAuthToken();

      if (user && user.id !== 'unsigned' && token) {
        console.log('Benutzer ist eingeloggt - synchronisiere mit Backend');
        const syncResult = await this.syncWithBackend(userId);
        if (syncResult.success) {
          return { success: true, data: syncResult.data };
        }
        // Fallback auf lokale Daten wenn Sync fehlschlägt
        console.log('Backend-Sync fehlgeschlagen, verwende lokale Daten');
      } else {
        console.log('Benutzer ist nicht eingeloggt - verwende nur lokale Daten');
      }

      return { success: true, data: localReminders };
    } catch (error) {
      console.error('Fehler beim Laden der Reminders:', error);
      return { success: false, error: error.message };
    }
  }

  // Hilfsfunktion für Offline-Synchronisation
  async handleOfflineChanges(userId) {
    try {
      console.log('Überprüfe Offline-Änderungen für User:', userId);

      const user = await this.getCurrentUser();
      if (!user || user.id === 'unsigned') {
        return { success: true, message: 'Kein angemeldeter Benutzer' };
      }

      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'Kein Token verfügbar' };
      }

      // Versuche Synchronisation
      const syncResult = await this.syncWithBackend(userId);
      return syncResult;
    } catch (error) {
      console.error('Fehler beim Verarbeiten von Offline-Änderungen:', error);
      return { success: false, error: error.message };
    }
  }

  // Hilfsfunktion um zu prüfen, ob Benutzer eingeloggt ist
  async isUserLoggedIn() {
    try {
      const user = await this.getCurrentUser();
      const token = await this.getAuthToken();

      return user && user.id !== 'unsigned' && token;
    } catch (error) {
      console.error('Fehler beim Überprüfen des Login-Status:', error);
      return false;
    }
  }
}

export default new SyncManager();
