import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'muvu.refreshToken';

// Access token: only in memory (it expires quickly)
// Refresh token: encrypted with SecureStore (Keychain on iOS, Keystore on Android)
let accessToken: string | null = null;

export const tokenStorage = {
  getAccessToken: () => accessToken,

  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),

  async saveSession(token: string, refreshToken: string) {
    accessToken = token;
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clear() {
    accessToken = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};