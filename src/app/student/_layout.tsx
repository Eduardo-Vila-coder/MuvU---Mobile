import { Stack } from 'expo-router';
import { RequireRole } from '@/components/auth/RequireRole';
import { stackScreenOptions } from '@/constants/theme';

// Only students. The tabs are a group; Lote B adds the reserve and rate screens on top
export default function StudentLayout() {
  return (
    <RequireRole allowedRoles={['ESTUDIANTE']}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </RequireRole>
  );
}