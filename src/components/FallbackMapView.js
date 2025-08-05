import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

/**
 * Fallback Map-Komponente für Builds ohne react-native-maps
 * Zeigt Erinnerungen in einer Liste mit Koordinaten an
 */
const FallbackMapView = ({
  reminderData = [],
  style,
  showsUserLocation = true,
  region = null
}) => {
  const formatCoordinate = (coord) => {
    return typeof coord === 'number' ? coord.toFixed(6) : 'N/A';
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'N/A';

    const R = 6371; // Radius der Erde in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Erinnerungen (Karten-Ansicht)</Text>
        <Text style={styles.headerSubtitle}>
          Karte nicht verfügbar - Listenansicht aktiv
        </Text>
        {region && (
          <Text style={styles.locationInfo}>
            📍 Aktuelle Position: {formatCoordinate(region.latitude)}, {formatCoordinate(region.longitude)}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {reminderData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Keine Erinnerungen vorhanden</Text>
            <Text style={styles.emptyText}>
              Erstellen Sie Ihre erste Erinnerung im "Erstellen"-Tab
            </Text>
          </View>
        ) : (
          reminderData.map((reminder, index) => (
            <View key={reminder.localId || reminder.id || index} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <Text style={styles.reminderTitle}>
                  {reminder.title || `Erinnerung ${index + 1}`}
                </Text>
                {region && reminder.latitude && reminder.longitude && (
                  <Text style={styles.distanceText}>
                    {calculateDistance(
                      region.latitude,
                      region.longitude,
                      reminder.latitude,
                      reminder.longitude
                    )}
                  </Text>
                )}
              </View>

              {reminder.content && (
                <Text style={styles.reminderContent}>{reminder.content}</Text>
              )}

              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>📌 Koordinaten:</Text>
                <Text style={styles.coordinateText}>
                  {formatCoordinate(reminder.latitude)}, {formatCoordinate(reminder.longitude)}
                </Text>
              </View>

              {reminder.radius && (
                <View style={styles.radiusRow}>
                  <Text style={styles.radiusLabel}>🔄 Radius:</Text>
                  <Text style={styles.radiusText}>{reminder.radius}m</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // Hier könnte eine externe Karten-App geöffnet werden
                  console.log('Öffne externe Karte für:', reminder.title);
                }}
              >
                <Text style={styles.actionButtonText}>📱 In externer App öffnen</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationInfo: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'monospace',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  reminderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  reminderContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#999',
  },
  coordinateText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  radiusLabel: {
    fontSize: 12,
    color: '#999',
  },
  radiusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
  },
});

export default FallbackMapView;
