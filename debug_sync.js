// Debug-Script für SyncManager
import SyncManager from './src/utils/syncManager.js';

console.log('SyncManager importiert:', SyncManager);
console.log('SyncManager Methoden:', Object.getOwnPropertyNames(SyncManager));
console.log('SyncManager constructor:', SyncManager.constructor.name);

// Test AsyncStorage
console.log('SyncManager storage:', SyncManager.storage);

// Test getCurrentUser
try {
  const user = await SyncManager.getCurrentUser();
  console.log('getCurrentUser result:', user);
} catch (error) {
  console.error('getCurrentUser Fehler:', error);
}
