import { Redirect } from 'expo-router';
import { ScreenLoader } from '../components/ui/ScreenLoader';
import { useAuth } from '../hooks/useAuth';

// "/" decides where each user goes
export default function IndexScreen() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) return <ScreenLoader message="Recuperando tu sesión..." />;
  if (user?.role === 'ESTUDIANTE') return <Redirect href="/student" />;
  if (user?.role === 'ARRENDADOR') return <Redirect href="/landlord" />;
  return <Redirect href="/login" />;
}