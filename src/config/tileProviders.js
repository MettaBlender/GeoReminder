/**
 * Konfiguration für kostenlose und app-freundliche Map Tile Provider
 *
 * Diese Tile-Server sind kostenlos und erlauben die Nutzung in mobilen Apps:
 * - CartoDB: Kostenlos für alle Anwendungen
 * - Wikimedia: Kostenlos für alle Anwendungen
 * - ESRI: Kostenlos für nicht-kommerzielle Nutzung
 *
 * Wichtig: OpenStreetMap's Standard-Tile-Server (tile.openstreetmap.org)
 * sollten NICHT in produktiven Apps verwendet werden!
 */

export const TILE_PROVIDERS = {
  // Standard - Heller Stil, gut lesbar
  CARTODB_LIGHT: {
    name: 'CartoDB Light',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, © CartoDB'
  },

  // Dunkler Stil für Apps mit Dark Theme
  CARTODB_DARK: {
    name: 'CartoDB Dark',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, © CartoDB'
  },

  // Voyager Stil - Moderne Optik
  CARTODB_VOYAGER: {
    name: 'CartoDB Voyager',
    urlTemplate: 'https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, © CartoDB'
  },

  // Wikimedia Maps - Internationale Variante
  WIKIMEDIA: {
    name: 'Wikimedia Maps',
    urlTemplate: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, © Wikimedia'
  },

  // ESRI World Street Map
  ESRI_WORLD_STREET: {
    name: 'ESRI World Street',
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '© Esri, © OpenStreetMap contributors'
  },

  // ESRI Satellite Imagery
  ESRI_SATELLITE: {
    name: 'ESRI Satellite',
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics'
  }
};

// Standard Tile Provider für die App
export const DEFAULT_TILE_PROVIDER = TILE_PROVIDERS.CARTODB_LIGHT;

// Alternative Tile Provider für verschiedene Themes
export const DARK_THEME_PROVIDER = TILE_PROVIDERS.CARTODB_DARK;
export const SATELLITE_PROVIDER = TILE_PROVIDERS.ESRI_SATELLITE;
