# GeoReminder - Verbesserte Synchronisation

## Überblick der Änderungen

### Backend-Verbesserungen (server.js)

1. **Verbesserter DELETE-Endpoint**
   - Unterstützt jetzt sowohl numerische IDs als auch Titel
   - Robustere Fehlerbehandlung
   - Bessere Validierung

### Frontend-Verbesserungen

1. **Neuer SyncManager (src/utils/syncManager.js)**
   - Zentrale Verwaltung aller Synchronisationsfunktionen
   - Intelligente Konfliktauflösung
   - Automatisches Timestamp-Management
   - Offline-Unterstützung

2. **Verbesserte Synchronisation**
   - Nutzt den `/api/reminders/sync` Endpoint für optimierte Synchronisation
   - Bidirektionale Synchronisation zwischen Geräten
   - Timestamp-basierte Konfliktauflösung ("last-write-wins")
   - Automatische Migration alter Datenstrukturen

3. **Offline-Synchronisation (src/hooks/useOfflineSync.js)**
   - Automatische Synchronisation beim App-Start
   - Hintergrund-Synchronisation bei Netzwerkverbindung
   - Robuste Fehlerbehandlung

### Funktionsweise der Synchronisation

#### 1. Lokale Speicherung
- Alle Daten werden lokal in AsyncStorage gespeichert
- Jeder Reminder hat Timestamps (created_at, updated_at)
- Benutzerdaten sind nach User-ID segmentiert

#### 2. Backend-Synchronisation
- Verwendet `/api/reminders/sync` für optimierte Synchronisation
- Sendet lokale Änderungen mit Timestamps
- Empfängt Server-Änderungen seit letztem Sync
- Löst Konflikte basierend auf Timestamps

#### 3. Konfliktauflösung
- **Client gewinnt**: Wenn Client-Timestamp neuer ist
- **Server gewinnt**: Wenn Server-Timestamp neuer ist
- Soft-Delete für gelöschte Einträge

#### 4. Offline-Unterstützung
- Alle Operationen funktionieren offline
- Automatische Synchronisation bei Netzwerkverbindung
- Queue-basierte Synchronisation für Offline-Änderungen

### Verwendung

#### Erstellen eines Reminders
```javascript
const result = await SyncManager.createReminder(userId, reminderData);
if (result.success) {
  console.log('Reminder erstellt:', result.data);
}
```

#### Aktualisieren eines Reminders
```javascript
const result = await SyncManager.updateReminder(userId, index, reminderData);
if (result.success) {
  console.log('Reminder aktualisiert:', result.data);
}
```

#### Löschen eines Reminders
```javascript
const result = await SyncManager.deleteReminder(userId, reminderData);
if (result.success) {
  console.log('Reminder gelöscht');
}
```

#### Alle Reminders abrufen
```javascript
const result = await SyncManager.getAllReminders(userId);
if (result.success) {
  console.log('Alle Reminders:', result.data);
}
```

### Vorteile der neuen Synchronisation

1. **Robustheit**: Funktioniert auch bei schlechter Netzwerkverbindung
2. **Konsistenz**: Gleiche Daten auf allen Geräten
3. **Performance**: Optimierte Synchronisation mit Timestamps
4. **Offline-Fähigkeit**: Vollständige Funktionalität ohne Internet
5. **Konfliktauflösung**: Automatische Behandlung von Konflikten
6. **Skalierbarkeit**: Effiziente Synchronisation auch bei vielen Reminders

### Technische Details

#### Datenstruktur
```javascript
{
  userId: {
    reminders: [
      {
        id: number,
        title: string,
        content: string,
        latitude: number,
        longitude: number,
        radius: number,
        created_at: string,
        updated_at: string,
        is_deleted: boolean
      }
    ]
  }
}
```

#### Sync-Algorithmus
1. Hole lokale Änderungen seit letztem Sync
2. Sende Änderungen an Server
3. Empfange Server-Änderungen
4. Löse Konflikte basierend auf Timestamps
5. Aktualisiere lokale Daten
6. Speichere neuen Sync-Zeitpunkt

### Fehlerbehebung

#### Häufige Probleme
1. **Sync schlägt fehl**: Prüfe Netzwerkverbindung und Auth-Token
2. **Daten nicht aktuell**: Manueller Refresh über Pull-to-Refresh
3. **Konflikte**: Automatische Auflösung, neueste Änderung gewinnt

#### Debugging
```javascript
// Aktiviere Debug-Logs
console.log('Sync-Status:', await SyncManager.getLastSyncTime(userId));
console.log('Lokale Daten:', await SyncManager.getLocalReminders(userId));
```

### Zukünftige Erweiterungen

1. **Real-time Synchronisation**: WebSocket-basierte Live-Updates
2. **Batch-Operationen**: Mehrere Änderungen in einer Anfrage
3. **Kompression**: Optimierte Datenübertragung
4. **Erweiterte Konfliktauflösung**: Benutzerauswahl bei Konflikten
5. **Backup/Restore**: Cloud-basierte Datensicherung
