const testReminder = {
  title: "Test Reminder " + Date.now(),
  content: "Test Content",
  latitude: 47.3769,
  longitude: 8.5417,
  radius: 100
};

console.log('=== REMINDER DEBUG TEST ===');
console.log('Test Reminder:', testReminder);

async function testBackend() {
  console.log('\n=== BACKEND TEST ===');

  const loginResponse = await fetch('https://geo-reminder-backend.vercel.app/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'testuser',
      password: 'testpass'
    }),
  });

  if (!loginResponse.ok) {
    console.error('Login fehlgeschlagen:', await loginResponse.text());
    return;
  }

  const loginData = await loginResponse.json();
  console.log('Login erfolgreich:', loginData);

  const token = loginData.token;

  const createResponse = await fetch('https://geo-reminder-backend.vercel.app/api/reminders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      reminders: [testReminder]
    }),
  });

  if (!createResponse.ok) {
    console.error('Reminder-Erstellung fehlgeschlagen:', await createResponse.text());
    return;
  }

  const createData = await createResponse.json();
  console.log('Reminder-Erstellung erfolgreich:', createData);

  const getResponse = await fetch('https://geo-reminder-backend.vercel.app/api/reminders', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!getResponse.ok) {
    console.error('Reminder-Abruf fehlgeschlagen:', await getResponse.text());
    return;
  }

  const getData = await getResponse.json();
  console.log('Reminder-Abruf erfolgreich:', getData);
}

async function testSyncManager() {
  console.log('\n=== SYNC MANAGER TEST ===');

  const { default: SyncManager } = await import('./src/utils/syncManager.js');

  const result = await SyncManager.createReminder('testuser', testReminder);
  console.log('SyncManager createReminder Ergebnis:', result);
}

testBackend().catch(console.error);
testSyncManager().catch(console.error);
