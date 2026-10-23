import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { User } from '@/lib/api';

const SESSION_KEY = 'blog.session';

export type StoredSession = {
  token: string;
  user: User;
};

export async function readSession(): Promise<StoredSession | null> {
  const value =
    Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;

  try {
    const session: unknown = JSON.parse(value);
    if (
      typeof session === 'object' &&
      session !== null &&
      'token' in session &&
      typeof session.token === 'string' &&
      'user' in session &&
      typeof session.user === 'object' &&
      session.user !== null
    ) {
      return session as StoredSession;
    }
  } catch {
    await clearSession();
    return null;
  }

  await clearSession();
  return null;
}

export async function writeSession(session: StoredSession): Promise<void> {
  const value = JSON.stringify(session);
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(SESSION_KEY, value);
  } else {
    await SecureStore.setItemAsync(SESSION_KEY, value);
  }
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(SESSION_KEY);
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}
