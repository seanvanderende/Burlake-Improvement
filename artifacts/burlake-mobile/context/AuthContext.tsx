import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'burlake_portal_password';

/**
 * Module-level ref updated by the AuthProvider whenever the password changes.
 * Used by the API client's setAuthTokenGetter so Bearer tokens are always
 * current without coupling the API client to React state.
 */
let _password: string | null = null;
export const getPortalPassword = (): string | null => _password;

// ---------------------------------------------------------------------------
// Platform-safe secure storage helpers
// expo-secure-store uses the iOS Keychain / Android Keystore on device.
// On web it falls back to localStorage via the same API in v14+.
// ---------------------------------------------------------------------------

async function getStored(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }
  return SecureStore.getItemAsync(STORAGE_KEY);
}

async function setStored(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch {}
    return;
  }
  return SecureStore.setItemAsync(STORAGE_KEY, value);
}

async function removeStored(): Promise<void> {
  if (Platform.OS === 'web') {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    return;
  }
  return SecureStore.deleteItemAsync(STORAGE_KEY);
}

// ---------------------------------------------------------------------------

interface AuthContextValue {
  password: string | null;
  isAuthenticated: boolean;
  /** true while restoring persisted state from secure storage on startup */
  isLoading: boolean;
  /** Verifies the password against the API, stores it, and sets auth state.
   *  Throws with a user-facing message on failure. */
  login: (pw: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  password: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore persisted password on mount
  useEffect(() => {
    getStored().then(pw => {
      _password = pw;
      setPassword(pw);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (pw: string) => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    let res: Response;
    try {
      res = await fetch(`https://${domain}/api/brochures/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
    } catch {
      throw new Error('Unable to connect. Check your network and try again.');
    }
    if (!res.ok) {
      throw new Error('Incorrect password');
    }
    _password = pw;
    setPassword(pw);
    await setStored(pw);
  }, []);

  const logout = useCallback(async () => {
    _password = null;
    setPassword(null);
    await removeStored();
  }, []);

  return (
    <AuthContext.Provider value={{ password, isAuthenticated: !!password, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
