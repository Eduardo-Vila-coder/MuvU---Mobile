import { Redirect, Stack } from 'expo-router';
import { ScreenLoader } from '../../components/ui/ScreenLoader';
import { stackScreenOptions } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

// Public screens: if you're already logged in, go home
export default function AuthLayout() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) return <ScreenLoader message="Recuperando tu sesión..." />;
  if (user) return <Redirect href="/" />;

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
      <Stack.Screen name="register" options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Recuperar contraseña' }} />
    </Stack>
  );
}