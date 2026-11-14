import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

// Bottom tabs of the student area (Expo Router's Tabs = Bottom Tabs Navigator)
export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Habitaciones',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bed-outline" size={size} color={String(color ?? colors.primary)} />
          ),
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: 'Cercanas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate-outline" size={size} color={String(color ?? colors.primary)} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={String(color ?? colors.primary)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mi perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={String(color ?? colors.primary)} />
          ),
        }}
      />
    </Tabs>
  );
}