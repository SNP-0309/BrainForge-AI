import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Text, SegmentedButtons, HelperText } from 'react-native-paper';
import { useAuthStore } from '../../../store/authStore';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalButton } from '../../../components/BrutalButton';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email) {
      setErrorMsg('Email is required');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email, role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>BrainForge AI</Text>
          <Text variant="titleMedium" style={styles.subtitle}>Learn Smarter. Learn Faster.</Text>
        </View>

        <BrutalCard bg="#FFFFFF" style={styles.formCard}>
          <Text variant="titleMedium" style={styles.label}>Select Role</Text>
          <SegmentedButtons
            value={role}
            onValueChange={(val: any) => setRole(val)}
            buttons={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'admin', label: 'Admin' },
            ]}
            style={styles.selector}
            theme={{
              colors: {
                outline: '#000000',
                primary: '#000000',
                secondaryContainer: '#FFE600',
              }
            }}
          />

          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineColor="#000000"
            activeOutlineColor="#000000"
            outlineStyle={styles.inputOutline}
            textColor="#000000"
            theme={{
              colors: {
                background: '#FFFFFF',
                primary: '#000000',
                placeholder: '#4B5563',
              }
            }}
          />

          {errorMsg ? (
            <HelperText type="error" visible={!!errorMsg} style={styles.errorText}>
              {errorMsg}
            </HelperText>
          ) : null}

          <BrutalButton
            onPress={handleLogin}
            disabled={loading}
            bg="#FFE600"
            style={styles.button}
          >
            {loading ? 'Logging in...' : 'Enter Sandbox Session'}
          </BrutalButton>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Need a new account?
            </Text>
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Register')}
            >
              Sign Up
            </Text>
          </View>
        </BrutalCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF6', // Light cream
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: '#000000',
    opacity: 0.7,
    marginTop: 8,
    fontWeight: 'bold',
  },
  formCard: {
    padding: 20,
  },
  label: {
    color: '#000000',
    marginBottom: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selector: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 12,
  },
  errorText: {
    marginBottom: 12,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  button: {
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  footerLink: {
    color: '#000000',
    fontWeight: '900',
    textDecorationLine: 'underline',
    marginLeft: 6,
  },
});

