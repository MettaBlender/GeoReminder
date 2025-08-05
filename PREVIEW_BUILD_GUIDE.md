# Map Crash Fix für Preview Builds

## Das Problem mit Preview-Builds und react-native-maps

Preview-Builds (APK) von Expo können Probleme mit `react-native-maps` haben, weil:

1. **Google Maps API Keys fehlen**
2. **Native Module nicht richtig verlinkt sind**
3. **Hardware-spezifische Probleme auf verschiedenen Geräten**
4. **OpenGL/GPU-Renderer-Inkompatibilität**

## Implementierte Lösungen

### 1. Mehrschichtige Fallback-Strategie

```javascript
// 1. Versuche SafeMapView (mit react-native-maps)
// 2. Bei Fehlern → FallbackMapView (ohne Maps)
// 3. MapErrorBoundary fängt alle Crashes ab
```

### 2. API-Key-unabhängige Tiles

```javascript
// CartoDB Tiles benötigen KEINE API-Keys
urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
mapType="none" // Deaktiviert Google Maps API
```

### 3. Sichere Component-Loading

```javascript
// Dynamischer Import von react-native-maps
let MapView, Marker, Circle, UrlTile;
try {
  const mapComponents = require('react-native-maps');
  MapView = mapComponents.default;
  // ...
} catch (error) {
  console.error('react-native-maps nicht verfügbar');
  MapView = null;
}
```

## API-Keys für Google Maps (Optional)

Falls Sie Google Maps verwenden möchten (nicht empfohlen für kostenlosen Betrieb):

### Android API-Key
1. **Google Cloud Console** öffnen
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **API Key**
4. **Restrict Key** → **Android apps**
5. SHA-1 Fingerprint hinzufügen

### iOS API-Key
1. **Google Cloud Console**
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **API Key**
4. **Restrict Key** → **iOS apps**
5. Bundle Identifier hinzufügen

### app.json Konfiguration
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "IHRE_ANDROID_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "IHRE_IOS_API_KEY"
      }
    }
  }
}
```

## Empfohlene Lösung: KEINE API-Keys verwenden

**Unsere Implementierung benötigt KEINE Google Maps API-Keys**, weil:

✅ Wir verwenden kostenlose CartoDB-Tiles
✅ `mapType="none"` deaktiviert Google Maps
✅ Vollständig OpenSource-basiert
✅ Keine Kosten oder Limits

## Testing für Preview-Builds

### 1. Build-Optimierungen in app.json
```json
{
  "expo": {
    "android": {
      "enableDangerousExperimentalLeanBuilds": true,
      "buildType": "apk"
    }
  }
}
```

### 2. Geräte-spezifische Tests
```bash
# Teste auf verschiedenen Android-Versionen
# Teste mit/ohne Google Play Services
# Teste mit schwachen/starken GPUs
```

### 3. Debug-Build erstellen
```bash
# EAS Build mit Debug-Informationen
npx eas build --profile preview --platform android --local
```

## Fallback-Strategien

### Level 1: SafeMapView
- Verwendet react-native-maps mit CartoDB-Tiles
- Detaillierte Fehlerbehandlung
- Automatischer Fallback bei Problemen

### Level 2: FallbackMapView
- Zeigt Erinnerungen als Liste
- Berechnet Entfernungen
- Koordinaten-Anzeige
- Link zu externer Karten-App

### Level 3: Error-Boundary
- Fängt alle React-Crashes ab
- Retry-Mechanismus
- Benutzerfreundliche Fehlermeldungen

## Performance-Optimierungen für Preview

```javascript
// Reduzierte Zoom-Level
maximumZ={16} // statt 19

// Weniger Features
showsBuildings={false}
showsTraffic={false}
showsCompass={false}
rotateEnabled={false}

// Kleinere Radien
radius={Math.min(reminder.radius, 5000)} // Max 5km
```

## Monitoring und Debugging

### 1. Console-Logs aktivieren
```javascript
console.log('Map-Loading-Status:', isLoading);
console.log('Map-Error:', mapError);
console.log('Fallback-Mode:', usesFallback);
```

### 2. Remote-Logging (optional)
```bash
# Sentry oder Bugsnag für Production
npm install @sentry/react-native
```

### 3. Device-Informationen sammeln
```javascript
import * as Device from 'expo-device';
console.log('Device Info:', {
  brand: Device.brand,
  modelName: Device.modelName,
  osName: Device.osName,
  osVersion: Device.osVersion
});
```

## Häufige Probleme und Lösungen

### Problem: App stürzt beim Map-Laden ab
**Lösung**: Implementierte SafeMapView + FallbackMapView

### Problem: Schwarzer Bildschirm statt Karte
**Lösung**: `mapType="none"` + UrlTile für CartoDB

### Problem: Marker werden nicht angezeigt
**Lösung**: Verbesserte Datenvalidierung

### Problem: Performance-Probleme
**Lösung**: Reduzierte Zoom-Level und Features

### Problem: Nur auf bestimmten Geräten
**Lösung**: GPU-Hardware-Detection + Fallback

## Build-Kommandos

### Lokaler Preview-Build
```bash
npx eas build --profile preview --platform android --local
```

### Cloud Preview-Build
```bash
npx eas build --profile preview --platform android
```

### Development-Build
```bash
npx eas build --profile development --platform android
```

## Erfolgs-Indikatoren

✅ **App startet ohne Crash**
✅ **Map-Tab öffnet sich**
✅ **Erinnerungen werden angezeigt**
✅ **Fallback funktioniert bei Problemen**
✅ **Keine API-Keys erforderlich**
✅ **Funktioniert auf verschiedenen Geräten**

Die App sollte jetzt deutlich stabiler sein und auch auf problematischen Geräten funktionieren!
