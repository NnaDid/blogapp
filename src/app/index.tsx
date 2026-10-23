import { Redirect } from 'expo-router';

import { Loading } from '@/components/ui';
import { useAuth } from '@/context/auth-context';

export default function IndexRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Opening your journal…" />;
  return <Redirect href={user ? '/(tabs)' : '/(auth)/login'} />;
}
