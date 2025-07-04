import { useEffect } from 'react';
import { AppState } from 'react-native';
import SyncManager from '@/utils/syncManager';

export const useOfflineSync = () => {
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App wurde aktiv - überprüfe Offline-Synchronisation');

        try {
          const user = await SyncManager.getCurrentUser();
          const token = await SyncManager.getAuthToken();

          if (user && user.id !== 'unsigned' && token) {
            console.log('Benutzer ist eingeloggt - starte Offline-Synchronisation');
            await SyncManager.handleOfflineChanges(user.id);
          } else {
            console.log('Benutzer ist nicht eingeloggt - keine Backend-Synchronisation');
          }
        } catch (error) {
          console.error('Fehler bei der Offline-Synchronisation:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    handleAppStateChange('active');

    return () => {
      subscription?.remove();
    };
  }, []);
};

export default useOfflineSync;
