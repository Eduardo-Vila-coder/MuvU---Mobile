import { Stack } from 'expo-router';
import { RequireRole } from '@/components/auth/RequireRole';
import { stackScreenOptions } from '@/constants/theme';

// Only students. The tabs are a group; the forms open on top of them
export default function StudentLayout() {
  return (
    <RequireRole allowedRoles={['ESTUDIANTE']}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reserve/[roomId]" options={{ title: 'Reservar habitación' }} />
        <Stack.Screen name="rate/[reservationId]" options={{ title: 'Calificar estadía' }} />
        <Stack.Screen name="reviews" options={{ title: 'Mis reseñas' }} />
      </Stack>
    </RequireRole>
  );
}