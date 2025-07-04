import SyncManager from './syncManager';

const testSyncManager = async () => {
  console.log('=== SyncManager Test ===');

  try {
    console.log('Test 1: Erstelle Reminder als unsigned user');
    const testReminder = {
      title: 'Test Reminder',
      content: 'Test Content',
      latitude: '47.3769',
      longitude: '8.5417',
      radius: '100'
    };

    const createResult = await SyncManager.createReminder('unsigned', testReminder);
    console.log('Create Result:', createResult);

    console.log('Test 2: Lade alle Reminders');
    const getAllResult = await SyncManager.getAllReminders('unsigned');
    console.log('GetAll Result:', getAllResult);

    console.log('Test 3: Login-Status');
    const isLoggedIn = await SyncManager.isUserLoggedIn();
    console.log('Is Logged In:', isLoggedIn);

  } catch (error) {
    console.error('Test Fehler:', error);
  }
};

export default testSyncManager;
