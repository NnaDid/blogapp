import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { User } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  initializationError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(authUser: {
  id: string;
  email?: string;
  created_at: string;
  user_metadata: Record<string, unknown>;
}): User {
  const username = authUser.user_metadata.username;
  return {
    id: authUser.id,
    username: typeof username === 'string' ? username : authUser.email?.split('@')[0] ?? 'user',
    email: authUser.email ?? '',
    created_at: authUser.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => getSupabase())
      .then((supabase) => {
        if (!active) return null;
        const result = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) {
            setUser(session ? toUser(session.user) : null);
            setInitializationError(null);
            setLoading(false);
          }
        });
        unsubscribe = () => result.data.subscription.unsubscribe();
        return supabase.auth.getSession();
      })
      .then((result) => {
        if (!active || !result) return;
        const { data, error } = result;
        if (error) {
          setInitializationError(error.message);
          setUser(null);
        } else {
          setUser(data.session ? toUser(data.session.user) : null);
          setInitializationError(null);
        }
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setInitializationError(
          cause instanceof Error ? cause.message : 'Could not restore your Supabase session.'
        );
        setUser(null);
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw error;
      if (data.session) {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (signOutError) throw signOutError;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({ user, loading, initializationError, signIn, register, signOut }),
    [user, loading, initializationError, signIn, register, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
