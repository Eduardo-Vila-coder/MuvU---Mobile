import { Stack } from 'expo-router';
import { RequireRole } from '../../components/auth/RequireRole';
import { stackScreenOptions } from '../../constants/theme';

// Only landlords. The tabs are a group; the forms open on top of them
export default function LandlordLayout() {
  return (
    <RequireRole allowedRoles={['ARRENDADOR']}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="rooms/new" options={{ title: 'Publicar habitación' }} />
        <Stack.Screen name="rooms/[id]/edit" options={{ title: 'Editar habitación' }} />
        <Stack.Screen name="rooms/[id]/images" options={{ title: 'Imágenes' }} />
      </Stack>
    </RequireRole>
  );
}