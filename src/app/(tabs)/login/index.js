import { View, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, Alert, Text, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import FormField from '../../../components/FormField';
import SubmitButton from '../../../components/SubmitButton';
import LoadingView from '../../../components/LoadingView';
import { router } from 'expo-router';

const LoginIndex = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState({
    password: '',
    confirmPassword: '',
    username: ''
  });
  const { password, confirmPassword, username } = data;
  const { getItem: getUsers, setItem: setUsers } = useAsyncStorage('users');
  const { getItem: getCurrentUserStorage, setItem: setCurrentUserStorage } = useAsyncStorage('currentUser');
  const { getItem: getToken, setItem: setToken } = useAsyncStorage('authToken');

  const API_BASE_URL = 'https://geo-reminder-backend.vercel.app';

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUserStorage();
      if (user) {
        setCurrentUser(JSON.parse(user));
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!username || !password) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 6 Zeichen lang sein.');
      return false;
    }

    if (!isLoginMode) {
      if (password !== confirmPassword) {
        Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein.');
        return false;
      }
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Token speichern
        await setToken(result.token);

        // Benutzerdaten speichern
        const userData = {
          ...result.user,
          token: result.token,
          createdAt: new Date().toISOString()
        };

        await setCurrentUserStorage(JSON.stringify(userData));
        setCurrentUser(userData);
        setData({ password: '', confirmPassword: '', username: '' });

        // Zur Home-Seite navigieren, damit die Reminder-Liste aktualisiert wird
        router.push('/home');

        Alert.alert('Erfolgreich', `Willkommen zurück, ${result.user.username}!`);
      } else {
        Alert.alert('Fehler', result.error || 'Ungültiger Benutzername oder Passwort.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Fehler', 'Ein Fehler ist beim Anmelden aufgetreten. Bitte prüfen Sie Ihre Internetverbindung.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Nach erfolgreicher Registrierung automatisch einloggen
        const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        });

        const loginResult = await loginResponse.json();

        if (loginResponse.ok) {
          // Token speichern
          await setToken(loginResult.token);

          // Benutzerdaten speichern
          const userData = {
            ...loginResult.user,
            token: loginResult.token,
            createdAt: new Date().toISOString()
          };

          await setCurrentUserStorage(JSON.stringify(userData));
          setCurrentUser(userData);
          setData({ password: '', confirmPassword: '', username: '' });

          // Zur Home-Seite navigieren, damit die Reminder-Liste aktualisiert wird
          router.push('/home');

          Alert.alert('Erfolgreich', `Willkommen, ${username}! Ihr Konto wurde erstellt und Sie sind jetzt angemeldet.`);
        } else {
          Alert.alert('Registrierung erfolgreich', 'Bitte melden Sie sich jetzt an.');
          setIsLoginMode(true);
        }
      } else {
        Alert.alert('Fehler', result.error || 'Ein Fehler ist bei der Registrierung aufgetreten.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Fehler', 'Ein Fehler ist bei der Registrierung aufgetreten. Bitte prüfen Sie Ihre Internetverbindung.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await setToken('');
      await setCurrentUserStorage('');
      setCurrentUser(null);
      setData({ password: '', confirmPassword: '', username: '' });

      // Zur Home-Seite navigieren, damit die Reminder-Liste geleert wird
      router.push('/home');

      Alert.alert('Erfolgreich', 'Sie wurden abgemeldet.');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Fehler', 'Ein Fehler ist beim Abmelden aufgetreten.');
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setData({ password: '', confirmPassword: '', username: '' });
  };

  if (isLoading) {
    return <LoadingView />;
  }

  // If user is logged in, show profile view
  if (currentUser) {
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
                  onPress={handleLogout}
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
  }

  // Login/Register form
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>
                {isLoginMode ? 'Anmelden' : 'Registrieren'}
              </Text>
              <Text style={styles.subtitle}>
                {isLoginMode
                  ? 'Melden Sie sich in Ihrem Konto an'
                  : 'Erstellen Sie ein neues Konto'
                }
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <FormField
                label="Benutzername"
                value={username}
                placeholder="Geben Sie Ihren Benutzernamen ein"
                onChangeText={(value) => handleInputChange('username', value)}
              />

              <FormField
                label="Passwort"
                value={password}
                placeholder="Geben Sie Ihr Passwort ein"
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                keyboardType='password'
              />

              {!isLoginMode && (
                <FormField
                  label="Passwort bestätigen"
                  value={confirmPassword}
                  placeholder="Bestätigen Sie Ihr Passwort"
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry
                />
              )}
            </View>

            <View style={styles.buttonContainer}>
              <SubmitButton
                title={isLoginMode ? 'Anmelden' : 'Registrieren'}
                onPress={isLoginMode ? handleLogin : handleRegister}
                disabled={isLoading}
              >{isLoginMode ? 'Anmelden' : 'Reistrieren'}</SubmitButton>

              <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
                <Text style={styles.toggleButtonText}>
                  {isLoginMode
                    ? 'Noch kein Konto? Jetzt registrieren'
                    : 'Bereits ein Konto? Jetzt anmelden'
                  }
                </Text>
              </TouchableOpacity>
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
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  profileContainer: {
    flex: 1,
    paddingTop: 40,
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  profileHeader: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
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
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
});

export default LoginIndex;
