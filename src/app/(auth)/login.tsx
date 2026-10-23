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

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    if (!login.trim() || !password) {
      setError('Enter your username or email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(login.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
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
        <Text style={styles.eyebrow}>A LITTLE SPACE FOR YOUR THOUGHTS</Text>
        <Text style={styles.title}>Welcome{'\n'}back.</Text>
        <Text style={styles.subtitle}>Sign in to find your people and pick up where you left off.</Text>
        {!!error && <Notice danger>{error}</Notice>}
        <Field
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect={false}
          onChangeText={setLogin}
          onSubmitEditing={submit}
          placeholder="Username or email"
          returnKeyType="next"
          value={login}
        />
        <Field
          autoComplete="current-password"
          onChangeText={setPassword}
          onSubmitEditing={submit}
          placeholder="Password"
          returnKeyType="go"
          secureTextEntry
          value={password}
        />
        <Button title="Sign in" onPress={submit} loading={submitting} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Link href="/(auth)/register" style={styles.link}>Create an account</Link>
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
    fontSize: 48,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: -1.8,
    marginBottom: 12,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 27,
    maxWidth: 320,
  },
  footer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 24,
  },
  footerText: { color: palette.muted, fontSize: 14 },
  link: { color: palette.green, fontWeight: '700', fontSize: 14 },
});
