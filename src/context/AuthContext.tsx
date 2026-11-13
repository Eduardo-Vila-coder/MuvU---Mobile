import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { refreshAccessToken, setSessionExpiredHandler } from '@/api/client';
import { getErrorStatus } from '@/api/errors';
import { tokenStorage } from '@/api/tokenStorage';
import type { AuthResponse, AuthUser } from '@/types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  signIn: (response: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const signIn = useCallback(async (response: AuthResponse) => {
    await tokenStorage.saveSession(response.token, response.refreshToken);
    setUser({ id: response.id, role: response.rol });
  }, []);

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  // If the interceptor can't renew the token, log the user out
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  // App start: if SecureStore has a refresh token, get a new access token (EP 005)
  useEffect(() => {
    let active = true;

    tokenStorage.getRefreshToken()
      .then((refreshToken) => (refreshToken ? refreshAccessToken() : null))
      .then(async (response) => {
        if (!response) return;
        if (response.rol === 'ADMIN') {
          await tokenStorage.clear(); // admin accounts are only used from the web
        } else if (active) {
          setUser({ id: response.id, role: response.rol });
        }
      })
      .catch(async (err) => {
        // Server rejected the token -> delete it. No internet -> keep it for next time
        if (getErrorStatus(err) !== null) await tokenStorage.clear();
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isRestoring, signIn, signOut }),
    [user, isRestoring, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
