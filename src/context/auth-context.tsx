import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError, apiRequest, type User } from '@/lib/api';
import { clearSession, readSession, writeSession } from '@/lib/session';

type AuthResponse = {
  user: User;
  token: string;
  token_type: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (login: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const stored = await readSession();
        if (!stored) return;
        if (active) {
          setToken(stored.token);
          setUser(stored.user);
        }
        try {
          const response = await apiRequest<{ user: User }>('/me', {}, stored.token);
          if (active) {
            setUser(response.user);
            await writeSession({ token: stored.token, user: response.user });
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await clearSession();
            if (active) {
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch {
        await clearSession();
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);

  const acceptAuth = useCallback(async (response: AuthResponse) => {
    await writeSession({ token: response.token, user: response.user });
    setToken(response.token);
    setUser(response.user);
  }, []);

  const signIn = useCallback(
    async (login: string, password: string) => {
      const response = await apiRequest<AuthResponse>('/login', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      });
      await acceptAuth(response);
    },
    [acceptAuth]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const response = await apiRequest<AuthResponse>('/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      await acceptAuth(response);
    },
    [acceptAuth]
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, signIn, register, signOut }),
    [user, token, loading, signIn, register, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
