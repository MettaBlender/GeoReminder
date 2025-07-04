import { Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import LoadingView from '../../../components/LoadingView';
import ProfileView from '../../../components/ProfileView';
import LoginRegisterForm from '../../../components/LoginRegisterForm';
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
        await setToken(result.token);

        const userData = {
          ...result.user,
          token: result.token,
          createdAt: new Date().toISOString()
        };

        await setCurrentUserStorage(JSON.stringify(userData));
        setCurrentUser(userData);
        setData({ password: '', confirmPassword: '', username: '' });

        router.push('/home');
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
          await setToken(loginResult.token);

          const userData = {
            ...loginResult.user,
            token: loginResult.token,
            createdAt: new Date().toISOString()
          };

          await setCurrentUserStorage(JSON.stringify(userData));
          setCurrentUser(userData);
          setData({ password: '', confirmPassword: '', username: '' });

          router.push('/home');
        } else {
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

      router.push('/home');
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

  if (currentUser) {
    return <ProfileView currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <LoginRegisterForm
      isLoginMode={isLoginMode}
      data={data}
      onInputChange={handleInputChange}
      onSubmit={isLoginMode ? handleLogin : handleRegister}
      onToggleMode={toggleMode}
      isLoading={isLoading}
    />
  );
};

export default LoginIndex;
