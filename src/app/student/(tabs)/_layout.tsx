import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

// Bottom tabs of the student area. Lote B adds "Mis reservas" and Lote C "Mi perfil"
export default function StudentTabsLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        // TEMP: sign out until the profile tab exists (Lote C)
        headerRight: () => (
          <TouchableOpacity onPress={() => void signOut()} style={{ marginRight: 16 }} accessibilityLabel="Cerrar sesión">
            <Ionicons name="log-out-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        ),
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
    </Tabs>
  );
}