import { Tabs } from 'expo-router';

import { palette } from '@/components/ui';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.green,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          height: 67,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: palette.line,
          backgroundColor: palette.surface,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Feed' }} />
      <Tabs.Screen name="create" options={{ title: 'Write' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen
        name="post/[id]"
        options={{ href: null, title: 'Post' }}
      />
    </Tabs>
  );
}
