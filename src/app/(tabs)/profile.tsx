import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Heading, Page, palette } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { formatDate } from '@/lib/api';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    try {
      await signOut();
    } catch (cause) {
      Alert.alert('Could not sign out', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Page>
      <Text style={styles.kicker}>YOUR CORNER OF THE COMMUNITY</Text>
      <Heading>Your profile.</Heading>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username.slice(0, 1).toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {!!user?.created_at && (
          <Text style={styles.memberSince}>Joined {formatDate(user.created_at)}</Text>
        )}
      </View>
      <View style={styles.note}>
        <Text style={styles.noteTitle}>Keep showing up.</Text>
        <Text style={styles.noteText}>Every post adds another voice to the conversation.</Text>
      </View>
      <Button title="Sign out" onPress={() => void logout()} secondary loading={signingOut} />
    </Page>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: palette.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 7,
  },
  profileCard: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 22,
    padding: 23,
    alignItems: 'center',
    marginTop: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: palette.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: palette.green, fontSize: 29, fontWeight: '800' },
  username: { color: palette.ink, fontSize: 21, fontWeight: '800' },
  email: { color: palette.muted, fontSize: 14, marginTop: 5 },
  memberSince: { color: palette.muted, fontSize: 12, marginTop: 13 },
  note: {
    backgroundColor: palette.greenSoft,
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    marginBottom: 20,
  },
  noteTitle: { color: palette.green, fontSize: 16, fontWeight: '700', marginBottom: 5 },
  noteText: { color: palette.green, fontSize: 14, lineHeight: 21 },
});
