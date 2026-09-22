import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { apiService } from '../services/apiService.js';

const AuthContext = createContext(null);

const SESSION_KEY = 'quickmart_session';
const TOKEN_KEY = 'quickmart_token';
const REFRESH_KEY = 'quickmart_refresh';

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(user, token, refreshToken) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (!user && !token) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

function extractUser(res) {
  const body = res?.data ?? res;
  const user = body?.user ?? body?.data?.user ?? null;
  return {
    token: body?.token ?? body?.data?.token ?? null,
    refreshToken: body?.refreshToken ?? body?.data?.refreshToken ?? null,
    user: user && (user.id || user._id) ? { ...user, id: user.id || user._id } : user,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !user) return;
    let active = true;
    apiService
      .getProfile()
      .then((res) => {
        if (!active) return;
        const fresh = res?.data?.data ?? res?.data ?? null;
        if (fresh) setUser((prev) => ({ ...prev, ...fresh, id: fresh.id || fresh._id || prev?.id }));
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        persistSession(null, null, null);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await apiService.login({ email, password });
    const { token, refreshToken, user: loggedIn } = extractUser(res);
    if (!loggedIn) throw new Error('Login failed');
    setUser(loggedIn);
    persistSession(loggedIn, token, refreshToken);
    return loggedIn;
  }, []);

  const register = useCallback(async ({ name, email, phone, password }) => {
    const res = await apiService.register({ name, email, phone, password });
    const { token, refreshToken, user: created } = extractUser(res);
    if (!created) throw new Error('Registration failed');
    setUser(created);
    persistSession(created, token, refreshToken);
    return created;
  }, []);

  const socialLogin = useCallback(async (credential) => {
    const res = await apiService.googleSignIn(credential);
    const { token, refreshToken, user: loggedIn } = extractUser(res);
    if (!loggedIn) throw new Error('Google sign-in failed');
    setUser(loggedIn);
    persistSession(loggedIn, token, refreshToken);
    return loggedIn;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    persistSession(null, null, null);
    try {
      apiService.logout();
    } catch {
      /* noop */
    }
  }, []);

  const updateProfile = useCallback(async (patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      persistSession(updated, null, null);
      return updated;
    });
    try {
      const res = await apiService.updateProfile(patch);
      const fresh = res?.data?.data ?? res?.data ?? null;
      if (fresh) {
        setUser((prev) => {
          const updated = { ...prev, ...fresh, id: fresh.id || fresh._id || prev?.id };
          persistSession(updated, null, null);
          return updated;
        });
      }
    } catch {
      /* keep optimistic update */
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, register, socialLogin, logout, updateProfile }),
    [user, login, register, socialLogin, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}