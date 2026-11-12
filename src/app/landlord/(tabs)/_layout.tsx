import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '../../../constants/theme';

// Bottom tabs of the landlord area (Expo Router's Tabs = Bottom Tabs Navigator)
export default function LandlordTabsLayout() {
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
          title: 'Mis habitaciones',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={String(color ?? colors.primary)} />,
        }}
      />
      {/* se agrego un mini parche para color */}
    </Tabs>
  );
}