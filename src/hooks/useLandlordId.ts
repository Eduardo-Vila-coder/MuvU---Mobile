import { useAuth } from './useAuth';

// Landlord screens live under RequireRole, so the user is always there
export function useLandlordId(): number {
  const { user } = useAuth();
  if (!user) throw new Error('useLandlordId must be used inside the landlord area');
  return user.id;
}