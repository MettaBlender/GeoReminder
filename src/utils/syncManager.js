import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://geo-reminder-backend.vercel.app';

export class SyncManager {
  constructor() {
    if (!AsyncStorage) {
      console.error('AsyncStorage ist nicht verfügbar!');
      throw new Error('AsyncStorage ist nicht verfügbar');
    }

    this.storage = AsyncStorage;

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

      if (Array.isArray(allReminders)) {
        const migrated = { 'unsigned': allReminders };
        await this.storage.setItem('reminder', JSON.stringify(migrated));
        return userId === 'unsigned' ? allReminders : [];
      }

      return allReminders[userId] || [];
    } catch (error) {
      console.error('Fehler beim Laden lokaler Reminders:', error);
      return [];
    }
  }

  async saveLocalReminders(userId, reminders) {
    try {
      const value = await this.storage.getItem('reminder');
      const allReminders = value ? JSON.parse(value) : {};

      if (Array.isArray(allReminders)) {
        const migrated = { 'unsigned': allReminders };
        await this.storage.setItem('reminder', JSON.stringify(migrated));
      }

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

      const mergedReminders = await this.mergeServerAndLocalData(userId, serverReminders);
      await this.saveLocalReminders(userId, mergedReminders);

      await this.setLastSyncTime(userId, result.serverTime);

      console.log('Synchronisation erfolgreich:', mergedReminders.length, 'Reminders');

      return {
        success: true,
        data: mergedReminders,
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

      const localReminders = await this.getLocalReminders(userId);
      localReminders.push(newReminder);
      await this.saveLocalReminders(userId, localReminders);

      const user = await this.getCurrentUser();
      const token = await this.getAuthToken();

      if (user && user.id !== 'unsigned' && token) {
        console.log('Benutzer ist eingeloggt - synchronisiere mit Backend');

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

            if (result.data && result.data.length > 0) {
              const syncedReminders = result.data.map(serverReminder => ({
                ...serverReminder,
                localId: newReminder.localId,
                synced: true,
                serverId: serverReminder.id
              }));

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

  async createLocalReminder(userId, reminderData) {
    try {
      const currentTime = new Date().toISOString();

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

      console.log('Erstelle lokalen Reminder für User:', userId);
      console.log('Reminder-Daten:', newReminder);

      const localReminders = await this.getLocalReminders(userId);
      localReminders.push(newReminder);
      await this.saveLocalReminders(userId, localReminders);

      return newReminder;
    } catch (error) {
      console.error('Fehler beim lokalen Erstellen des Reminders:', error);
      throw error;
    }
  }

  async updateReminder(userId, identifier, reminderData) {
    try {
      const currentTime = new Date().toISOString();
      const localReminders = await this.getLocalReminders(userId);

      let index = -1;

      if (typeof identifier === 'string' && identifier.startsWith('local_')) {
        index = localReminders.findIndex(r => r.localId === identifier);
      } else if (typeof identifier === 'number') {
        index = identifier;
      } else {
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
        synced: false
      };

      localReminders[index] = updatedReminder;
      await this.saveLocalReminders(userId, localReminders);

      console.log('Reminder lokal aktualisiert:', updatedReminder.localId || updatedReminder.title);

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

      let index = -1;

      if (reminder.localId) {
        index = localReminders.findIndex(r => r.localId === reminder.localId);
      } else {
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

      const user = await this.getCurrentUser();
      const token = await this.getAuthToken();

      if (user && user.id !== 'unsigned' && token) {
        console.log('Benutzer ist eingeloggt - synchronisiere mit Backend');
        const syncResult = await this.syncWithBackend(userId);
        if (syncResult.success) {
          const updatedLocalReminders = await this.getLocalReminders(userId);
          return { success: true, data: updatedLocalReminders };
        }
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

      const syncResult = await this.syncWithBackend(userId);
      return syncResult;
    } catch (error) {
      console.error('Fehler beim Verarbeiten von Offline-Änderungen:', error);
      return { success: false, error: error.message };
    }
  }

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
  async updateLocalReminder(userId, identifier, updatedData) {
    try {
      const localReminders = await this.getLocalReminders(userId);
      let index = -1;

      if (typeof identifier === 'string' && identifier.startsWith('local_')) {
        index = localReminders.findIndex(r => r.localId === identifier);
      } else if (!isNaN(parseInt(identifier))) {
        const numericId = parseInt(identifier);
        index = localReminders.findIndex(r =>
          (r.serverId && parseInt(r.serverId) === numericId) ||
          (r.id && parseInt(r.id) === numericId) ||
          r.localId === identifier
        );

        if (index === -1 && numericId >= 0 && numericId < localReminders.length) {
          index = numericId;
        }
      } else {
        index = localReminders.findIndex(r =>
          r.localId === identifier ||
          r.serverId === identifier ||
          r.id === identifier
        );
      }

      if (index === -1 || index >= localReminders.length) {
        console.error('Reminder nicht gefunden. Identifier:', identifier);
        console.error('Verfügbare Reminders:', localReminders.map(r => ({
          title: r.title,
          localId: r.localId,
          serverId: r.serverId,
          id: r.id
        })));
        throw new Error('Reminder nicht gefunden');
      }

      const currentTime = new Date().toISOString();
      localReminders[index] = {
        ...localReminders[index],
        ...updatedData,
        updated_at: currentTime,
        synced: false
      };

      await this.saveLocalReminders(userId, localReminders);
      console.log('Reminder lokal aktualisiert:', localReminders[index].localId || localReminders[index].title);

      return localReminders[index];
    } catch (error) {
      console.error('Fehler beim lokalen Update des Reminders:', error);
      throw error;
    }
  }

  async deleteLocalReminder(userId, identifier) {
    try {
      const localReminders = await this.getLocalReminders(userId);
      let index = -1;

      if (typeof identifier === 'string' && identifier.startsWith('local_')) {
        index = localReminders.findIndex(r => r.localId === identifier);
      } else if (!isNaN(parseInt(identifier))) {
        const numericId = parseInt(identifier);
        index = localReminders.findIndex(r =>
          (r.serverId && parseInt(r.serverId) === numericId) ||
          (r.id && parseInt(r.id) === numericId) ||
          r.localId === identifier
        );

        if (index === -1 && numericId >= 0 && numericId < localReminders.length) {
          index = numericId;
        }
      } else {
        index = localReminders.findIndex(r =>
          r.localId === identifier ||
          r.serverId === identifier ||
          r.id === identifier
        );
      }

      if (index === -1 || index >= localReminders.length) {
        console.error('Reminder zum Löschen nicht gefunden. Identifier:', identifier);
        console.error('Verfügbare Reminders:', localReminders.map(r => ({
          title: r.title,
          localId: r.localId,
          serverId: r.serverId,
          id: r.id
        })));
        throw new Error('Reminder nicht gefunden');
      }

      const deletedReminder = localReminders[index];
      localReminders.splice(index, 1);

      await this.saveLocalReminders(userId, localReminders);
      console.log('Reminder lokal gelöscht:', deletedReminder.localId || deletedReminder.title);

      return localReminders;
    } catch (error) {
      console.error('Fehler beim lokalen Löschen des Reminders:', error);
      throw error;
    }
  }

  async mergeServerAndLocalData(userId, serverReminders) {
    try {
      const localReminders = await this.getLocalReminders(userId);
      const mergedReminders = [];

      for (const serverReminder of serverReminders) {
        let localReminder = localReminders.find(lr =>
          lr.title === serverReminder.title ||
          (lr.serverId && lr.serverId === serverReminder.id) ||
          (lr.id && lr.id === serverReminder.id)
        );

        if (localReminder) {
          mergedReminders.push({
            ...serverReminder,
            localId: localReminder.localId,
            serverId: serverReminder.id,
            synced: true
          });
        } else {
          mergedReminders.push({
            ...serverReminder,
            localId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            serverId: serverReminder.id,
            synced: true
          });
        }
      }

      const localOnlyReminders = localReminders.filter(lr =>
        !serverReminders.find(sr =>
          sr.title === lr.title ||
          sr.id === lr.serverId ||
          sr.id === lr.id
        )
      );

      mergedReminders.push(...localOnlyReminders);

      console.log('Merged Reminders:', mergedReminders.length);
      return mergedReminders;
    } catch (error) {
      console.error('Fehler beim Mergen der Daten:', error);
      return serverReminders;
    }
  }
}

export default new SyncManager();
