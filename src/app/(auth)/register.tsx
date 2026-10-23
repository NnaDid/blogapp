import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Field, Notice, palette } from '@/components/ui';
import { useAuth } from '@/context/auth-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    if (!username.trim() || !email.trim() || !password) {
      setError('Complete all fields to create your account.');
      return;
    }
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <Text style={styles.brandGlyph}>b.</Text>
        </View>
        <Text style={styles.eyebrow}>YOUR NEXT CHAPTER STARTS HERE</Text>
        <Text style={styles.title}>Join the{'\n'}conversation.</Text>
        <Text style={styles.subtitle}>Make a home for the ideas you want to share.</Text>
        {!!error && <Notice danger>{error}</Notice>}
        <Field
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect={false}
          maxLength={50}
          onChangeText={setUsername}
          placeholder="Username"
          value={username}
        />
        <Field
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          maxLength={120}
          onChangeText={setEmail}
          placeholder="Email address"
          value={email}
        />
        <Field
          autoComplete="new-password"
          maxLength={72}
          onChangeText={setPassword}
          placeholder="Password (at least 8 characters)"
          secureTextEntry
          value={password}
        />
        <Button title="Create account" onPress={submit} loading={submitting} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already a member? </Text>
          <Link href="/(auth)/login" style={styles.link}>Sign in</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 35,
  },
  brandMark: {
    width: 54,
    height: 54,
    backgroundColor: palette.green,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  brandGlyph: { color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  eyebrow: {
    color: palette.orange,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 12,
  },
  title: {
    color: palette.ink,
    fontSize: 42,
    lineHeight: 45,
    fontWeight: '800',
    letterSpacing: -1.4,
    marginBottom: 11,
  },
  subtitle: { color: palette.muted, fontSize: 16, lineHeight: 24, marginBottom: 24 },
  footer: { flexDirection: 'row', alignSelf: 'center', marginTop: 24 },
  footerText: { color: palette.muted, fontSize: 14 },
  link: { color: palette.green, fontWeight: '700', fontSize: 14 },
});
