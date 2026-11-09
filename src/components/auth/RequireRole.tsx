import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/auth';
import { ScreenLoader } from '../ui/ScreenLoader';

interface RequireRoleProps {
  allowedRoles: Role[];
  children: ReactNode;
}

// Protected routes: used inside the _layout of each role folder
export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user, isRestoring } = useAuth();

  if (isRestoring) return <ScreenLoader message="Recuperando tu sesión..." />;
  if (!user) return <Redirect href="/login" />;
  if (!allowedRoles.includes(user.role)) return <Redirect href="/" />; // wrong role -> its own home

  return <>{children}</>;
}