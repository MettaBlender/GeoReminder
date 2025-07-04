# GeoReminder Datenfluss-Übersicht

Nach den Änderungen:

## Home-Seite (src/app/(tabs)/home/index.js)
- **Laden**: `SyncManager.getAllReminders(userId)` - MACHT BACKEND-SYNCHRONISATION
- **Löschen**: `SyncManager.deleteLocalReminder(userId, id)` - NUR LOKAL

## Create-Seite (src/app/(tabs)/create/index.js)
- **Erstellen**: `SyncManager.createLocalReminder(userId, reminder)` - NUR LOKAL

## Edit-Seite (src/app/edit/index.js)
- **Laden**: `SyncManager.getLocalReminders(userId)` - NUR LOKAL
- **Aktualisieren**: `SyncManager.updateLocalReminder(userId, id, data)` - NUR LOKAL
- **Löschen**: `SyncManager.deleteLocalReminder(userId, id)` - NUR LOKAL

## Map-Seite (src/app/(tabs)/map/index.js)
- **Laden**: `SyncManager.getLocalReminders(userId)` - NUR LOKAL

## SyncManager neue Methoden:
- `createLocalReminder()` - Erstellt Reminder nur lokal
- `updateLocalReminder()` - Aktualisiert Reminder nur lokal
- `deleteLocalReminder()` - Löscht Reminder nur lokal
- `getLocalReminders()` - Lädt nur lokale Daten
- `getAllReminders()` - Lädt und synchronisiert mit Backend (nur auf Home-Seite verwendet)

## Synchronisation:
- Backend-Sync findet NUR beim Laden der Home-Seite statt
- Alle anderen Operationen (Create, Edit, Delete) arbeiten nur mit lokalen Daten
- Lokale Änderungen werden beim nächsten Home-Seite-Besuch mit dem Backend synchronisiert
