# Lokale Speicherung für nicht eingeloggte Benutzer

## Implementierte Änderungen

### 1. SyncManager Anpassungen

Der SyncManager wurde so angepasst, dass er zwischen eingeloggten und nicht eingeloggten Benutzern unterscheidet:

#### Neue Hilfsfunktion
```javascript
async isUserLoggedIn() {
  const user = await this.getCurrentUser();
  const token = await this.getAuthToken();
  return user && user.id !== 'unsigned' && token;
}
```

#### Angepasste Funktionen

**createReminder():**
- Speichert Reminder immer lokal
- Synchronisiert mit Backend nur wenn Benutzer eingeloggt ist
- Zeigt entsprechende Logs an

**updateReminder():**
- Aktualisiert Reminder lokal
- Synchronisiert mit Backend nur wenn Benutzer eingeloggt ist
- Zeigt entsprechende Logs an

**deleteReminder():**
- Löscht Reminder lokal
- Löscht vom Backend nur wenn Benutzer eingeloggt ist
- Zeigt entsprechende Logs an

**getAllReminders():**
- Lädt lokale Daten
- Synchronisiert mit Backend nur wenn Benutzer eingeloggt ist
- Fallback auf lokale Daten bei Sync-Fehlern

### 2. Offline-Sync Hook Anpassungen

**useOfflineSync():**
- Überprüft sowohl Benutzer als auch Token
- Startet Synchronisation nur für eingeloggte Benutzer
- Zeigt entsprechende Logs an

### 3. Verhalten für verschiedene Benutzertypen

#### Nicht eingeloggte Benutzer (userId: 'unsigned')
- **Erstellen**: Nur lokale Speicherung
- **Bearbeiten**: Nur lokale Aktualisierung
- **Löschen**: Nur lokale Löschung
- **Laden**: Nur lokale Daten
- **Synchronisation**: Keine Backend-Kommunikation

#### Eingeloggte Benutzer (userId: user.id, Token vorhanden)
- **Erstellen**: Lokale Speicherung + Backend-Synchronisation
- **Bearbeiten**: Lokale Aktualisierung + Backend-Synchronisation
- **Löschen**: Lokale Löschung + Backend-Löschung
- **Laden**: Lokale Daten + Backend-Synchronisation
- **Synchronisation**: Vollständige bidirektionale Synchronisation

#### Eingeloggte Benutzer ohne Token (abgelaufen/ungültig)
- **Verhalten**: Wie nicht eingeloggte Benutzer
- **Fallback**: Nur lokale Operationen
- **Hinweis**: Token-Refresh sollte implementiert werden

### 4. Logging und Debugging

Alle Funktionen geben jetzt klare Logs aus:
- `"Benutzer ist eingeloggt - synchronisiere mit Backend"`
- `"Benutzer ist nicht eingeloggt - nur lokale Speicherung"`
- `"Benutzer ist nicht eingeloggt - verwende nur lokale Daten"`

### 5. Datenstruktur

Die Datenstruktur bleibt unverändert:
```javascript
{
  "unsigned": [...lokale Reminders für nicht eingeloggte Benutzer],
  "user123": [...Reminders für eingeloggten Benutzer mit ID 123],
  "user456": [...Reminders für eingeloggten Benutzer mit ID 456]
}
```

## Verwendung

### Testen als nicht eingeloggter Benutzer
1. Ausloggen (falls eingeloggt)
2. Reminders erstellen/bearbeiten/löschen
3. Überprüfen der Logs: Sollte "nur lokale Speicherung" anzeigen
4. Keine Backend-Requests sollten gesendet werden

### Testen als eingeloggter Benutzer
1. Einloggen
2. Reminders erstellen/bearbeiten/löschen
3. Überprüfen der Logs: Sollte "synchronisiere mit Backend" anzeigen
4. Backend-Requests sollten gesendet werden

### Wechsel zwischen Modi
1. Als nicht eingeloggter Benutzer Reminders erstellen
2. Einloggen
3. Neue Reminders werden mit Backend synchronisiert
4. Alte lokale Reminders bleiben unter "unsigned" gespeichert
5. Nach dem Einloggen sind beide Datensätze getrennt verfügbar

## Vorteile

1. **Datenschutz**: Lokale Daten bleiben lokal wenn nicht eingeloggt
2. **Offline-Fähigkeit**: Vollständige Funktionalität ohne Account
3. **Nahtloser Übergang**: Einfacher Wechsel zwischen Modi
4. **Getrennte Datensätze**: Keine Vermischung von privaten und öffentlichen Daten
5. **Robustheit**: Fallback auf lokale Daten bei Backend-Problemen

## Hinweise

- Lokale Daten werden nicht automatisch gelöscht
- Beim Wechsel zwischen Benutzern bleiben alle Daten erhalten
- Token-Validation sollte regelmäßig überprüft werden
- Backend-Synchronisation erfolgt nur bei aktiver Internetverbindung
