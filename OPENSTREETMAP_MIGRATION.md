# GeoReminder - OpenStreetMap Integration

## Änderungen - Von Google Maps zu kostenlosen Tile-Servern

### Problem gelöst
- **OpenStreetMap Blockierung**: Die App verwendet jetzt app-freundliche Tile-Server anstatt der blockierten OSM-Volunteer-Server
- **Google Maps entfernt**: Alle Google Maps Abhängigkeiten wurden durch kostenlose Alternativen ersetzt

### Aktualisierte Dateien

#### 1. Map-Komponenten
- `src/components/OpenStreetMapView.js` - Einfache OSM-Alternative
- `src/components/AdvancedOpenStreetMapView.js` - Mit Stil-Auswahl
- `src/components/FreeMapView.js` - Neue wiederverwendbare Komponente
- `src/components/LeafletMapView.js` - WebView-basierte Leaflet-Alternative
- `src/components/MemoizedMapView.js` - Aktualisiert auf CartoDB

#### 2. App-Seiten
- `src/app/(tabs)/map/index.js` - Verwendet jetzt OpenStreetMapView
- `src/app/(tabs)/create/index.js` - CartoDB Tiles hinzugefügt
- `src/app/edit/index.js` - CartoDB Tiles hinzugefügt

#### 3. Konfiguration
- `src/config/tileProviders.js` - Zentrale Tile-Server Konfiguration

### Verwendete kostenlose Tile-Server

1. **CartoDB Light** (Standard)
   - URL: `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png`
   - Kostenlos für alle Anwendungen
   - Gute Lesbarkeit

2. **CartoDB Dark**
   - URL: `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png`
   - Für Dark Theme Apps

3. **Wikimedia Maps**
   - URL: `https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png`
   - Kostenlos und zuverlässig

4. **ESRI World Street**
   - URL: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}`
   - Kostenlos für nicht-kommerzielle Nutzung

### Features beibehalten
- ✅ Geofencing funktioniert weiterhin
- ✅ Marker und Kreise werden angezeigt
- ✅ Benutzerstandort wird angezeigt
- ✅ Alle Touch-Interaktionen funktionieren
- ✅ Reminder-Daten werden korrekt geladen

### Vorteile der neuen Lösung
- 🚫 Keine Google Maps API Keys erforderlich
- 💰 Vollständig kostenlos
- 🚀 Keine Nutzungslimits
- 🔧 Einfach wartbar durch zentrale Konfiguration
- 🎨 Verschiedene Stile verfügbar

### Nutzung

#### Einfache Map (empfohlen):
```javascript
import OpenStreetMapView from '../../../components/OpenStreetMapView';

<OpenStreetMapView
  region={region}
  reminderData={reminderData}
  showsUserLocation={true}
/>
```

#### Mit Stil-Auswahl:
```javascript
import AdvancedOpenStreetMapView from '../../../components/AdvancedOpenStreetMapView';

<AdvancedOpenStreetMapView
  region={region}
  reminderData={reminderData}
  showTileSelector={true}
/>
```

#### Wiederverwendbare Komponente:
```javascript
import FreeMapView from '../../../components/FreeMapView';
import { DARK_THEME_PROVIDER } from '../../../config/tileProviders';

<FreeMapView
  region={region}
  reminderData={reminderData}
  tileProvider={DARK_THEME_PROVIDER}
/>
```

### Troubleshooting

Falls Tiles nicht laden:
1. Internetverbindung prüfen
2. Alternative Tile-Provider in `tileProviders.js` verwenden
3. Auf physischem Gerät testen (Emulator kann Probleme haben)

### Tile-Server Richtlinien
- ✅ CartoDB: Unbegrenzte Nutzung
- ✅ Wikimedia: Faire Nutzung
- ✅ ESRI: Nicht-kommerzielle Nutzung OK
- ❌ OSM Standard-Server: Nicht für Apps geeignet
