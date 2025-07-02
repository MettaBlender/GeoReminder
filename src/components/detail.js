import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const PlanetDetailScreen = () => {
    const { detailUrl } = useLocalSearchParams();

    const [planet, setPlanet] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Return Early Pattern: Abbrechen, wenn keine URL vorhanden
        if (!detailUrl) return;

        const loadPlanetDetails = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(detailUrl);
                const data = await response.json();
                setPlanet(data.result?.properties || data); // fallback für Struktur
            } catch (error) {
                console.error('Fehler beim Laden der Planetendaten:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPlanetDetails();
    }, [detailUrl]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1976d2" />
                <Text>Lade Planetendaten…</Text>
            </View>
        );
    }

    if (!planet) {
        return (
            <View style={styles.centered}>
                <Text>Keine Daten zum Planeten gefunden.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.scrollcontainer}>
            <Image
                source={require('../assets/moon.jpg')} style={{ width: 370, height: 200, marginBottom: 20 }} />
            <View style={styles.container}>
                <Text style={styles.title}>{planet.name}</Text>
                <Text>Climate: {planet.climate}</Text>
                <Text>Terrain: {planet.terrain}</Text>
                <Text>Diameter: {planet.diameter} km</Text>
                <Text>Population: {planet.population}</Text>
                <Text>Gravitational pull: {planet.gravity}</Text>
                <Text>Duration of a year: {planet.orbital_period} d</Text>
                <Text>Duration of a day: {planet.rotation_period} h</Text>
                <Text>Water Surface: {planet.surface_water}%</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: 'white',
        flex: 1,
    },
    scrollcontainer: {
        padding: 24,
        backgroundColor: 'white',
        flex: 1
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 16
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default PlanetDetailScreen;
