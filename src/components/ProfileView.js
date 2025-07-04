import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import SubmitButton from './SubmitButton';

const ProfileView = ({ currentUser, onLogout }) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.profileContainer}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Profil</Text>
              <Text style={styles.profileSubtitle}>Willkommen zurück!</Text>
            </View>

            <View style={styles.userInfoContainer}>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Benutzername:</Text>
                <Text style={styles.userInfoValue}>{currentUser.username}</Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Passwort:</Text>
                <Text style={styles.userInfoValue}>••••••••</Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Mitglied seit:</Text>
                <Text style={styles.userInfoValue}>
                  {new Date(currentUser.createdAt).toLocaleDateString('de-DE')}
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <SubmitButton
                title="Abmelden"
                onPress={onLogout}
                style={styles.logoutButton}
              >
                Abmelden
              </SubmitButton>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  profileContainer: {
    flex: 1,
    paddingTop: 40,
  },
  profileHeader: {
    marginBottom: 30,
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  userInfoContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  userInfoLabel: {
    fontSize: 16,
    color: '#cccccc',
    fontWeight: '500',
  },
  userInfoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
});

export default ProfileView;
