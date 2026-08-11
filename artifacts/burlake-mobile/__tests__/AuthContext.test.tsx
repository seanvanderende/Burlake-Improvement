/**
 * Tests for AuthContext login() and logout() behaviour.
 *
 * Covers:
 *  - Happy path: correct password → resolves, password persisted to SecureStore
 *  - Wrong password: 401 response → throws "Incorrect password"
 *  - Network failure: fetch throws → throws connectivity message
 *  - Logout: clears SecureStore and resets password to null
 */

import React from 'react';
// Note: @testing-library/react-native v14's renderHook is async — always await it.
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock expo-secure-store so no native module is needed.
// jest-expo sets Platform.OS = 'ios' via haste defaultPlatform, so the
// SecureStore code path (not localStorage) is exercised by default.
const mockSecureGetItem = jest.fn<Promise<string | null>, [string]>();
const mockSecureSetItem = jest.fn<Promise<void>, [string, string]>();
const mockSecureDeleteItem = jest.fn<Promise<void>, [string]>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: (key: string) => mockSecureGetItem(key),
  setItemAsync: (key: string, value: string) => mockSecureSetItem(key, value),
  deleteItemAsync: (key: string) => mockSecureDeleteItem(key),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { AuthProvider, useAuth } from '../context/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'burlake_portal_password';

// ── Shared wrapper ────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // No password persisted at startup
  mockSecureGetItem.mockResolvedValue(null);
  mockSecureSetItem.mockResolvedValue(undefined);
  mockSecureDeleteItem.mockResolvedValue(undefined);
  // Provide a domain so fetch builds a valid URL
  process.env.EXPO_PUBLIC_DOMAIN = 'portal.example.com';
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('login()', () => {
  it('happy path: resolves and stores the password when the API returns 200', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    // renderHook is async in @testing-library/react-native v14 — must await
    const { result } = await renderHook(() => useAuth(), { wrapper });

    // Wait for the startup storage restore useEffect to finish
    await waitFor(() => expect(result.current).not.toBeNull());
    await waitFor(() => expect(result.current?.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('correct-password');
    });

    expect(result.current.password).toBe('correct-password');
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockSecureSetItem).toHaveBeenCalledWith(STORAGE_KEY, 'correct-password');
  });

  it('wrong password: throws "Incorrect password" when the API returns a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.isLoading).toBe(false));

    let caught: Error | undefined;
    await act(async () => {
      try {
        await result.current.login('wrong-password');
      } catch (e) {
        caught = e as Error;
      }
    });

    expect(caught).toBeDefined();
    expect(caught?.message).toBe('Incorrect password');
    // Auth state must stay cleared
    expect(result.current.password).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    // Password must NOT be written to storage
    expect(mockSecureSetItem).not.toHaveBeenCalled();
  });

  it('network failure: throws a connectivity message (not an auth message) when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.isLoading).toBe(false));

    let caught: Error | undefined;
    await act(async () => {
      try {
        await result.current.login('any-password');
      } catch (e) {
        caught = e as Error;
      }
    });

    expect(caught).toBeDefined();
    expect(caught?.message).toBe('Unable to connect. Check your network and try again.');
    // Must not look like the wrong-password error — network failures are distinct
    expect(caught?.message).not.toContain('Incorrect password');
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockSecureSetItem).not.toHaveBeenCalled();
  });
});

describe('logout()', () => {
  it('clears secure storage and sets password to null', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current?.isLoading).toBe(false));

    // Establish an authenticated session first
    await act(async () => {
      await result.current.login('correct-password');
    });
    expect(result.current.isAuthenticated).toBe(true);

    // Log out
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.password).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockSecureDeleteItem).toHaveBeenCalledWith(STORAGE_KEY);
  });
});
