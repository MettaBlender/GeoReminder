import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import FormField from './FormField';
import SubmitButton from './SubmitButton';

const LoginRegisterForm = ({
  isLoginMode,
  data,
  onInputChange,
  onSubmit,
  onToggleMode,
  isLoading
}) => {
  const { username, password, confirmPassword } = data;

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
                onChangeText={(value) => onInputChange('username', value)}
              />

              <FormField
                label="Passwort"
                value={password}
                placeholder="Geben Sie Ihr Passwort ein"
                onChangeText={(value) => onInputChange('password', value)}
                secureTextEntry={true}
              />

              {!isLoginMode && (
                <FormField
                  label="Passwort bestätigen"
                  value={confirmPassword}
                  placeholder="Bestätigen Sie Ihr Passwort"
                  onChangeText={(value) => onInputChange('confirmPassword', value)}
                  secureTextEntry={true}
                />
              )}
            </View>

            <View style={styles.buttonContainer}>
              <SubmitButton
                title={isLoginMode ? 'Anmelden' : 'Registrieren'}
                onPress={onSubmit}
                disabled={isLoading}
              >
                {isLoginMode ? 'Anmelden' : 'Registrieren'}
              </SubmitButton>

              <TouchableOpacity onPress={onToggleMode} style={styles.toggleButton}>
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
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
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
  inputContainer: {
    marginBottom: 30,
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
    color: '#33a5f6',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginRegisterForm;
