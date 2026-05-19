import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/features/auth/api/authApi';
import type { AuthUser } from '@/features/auth/types';
import { UserRole } from '@/features/auth/types';
import { AUTH_EXPIRED_EVENT } from '@/services/authEvents';
import { tokenStorage, type StoredUserSnapshot } from '@/services/tokenStorage';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isManagerOrAbove: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const toSnapshot = (u: AuthUser): StoredUserSnapshot => ({
  id: u.id,
  email: u.email,
  userName: u.userName,
  fullName: u.fullName,
  role: u.role,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const access = tokenStorage.getAccessToken();
    const snapshot = tokenStorage.getUserSnapshot();

    if (!access) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await authApi.me();
      setUser(me);
      tokenStorage.setUserSnapshot(toSnapshot(me));
    } catch {
      const rt = tokenStorage.getRefreshToken();
      if (!rt) {
        tokenStorage.clearTokens();
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const result = await authApi.refresh(rt);
        tokenStorage.setTokens(
          result.tokens.accessToken,
          result.tokens.refreshToken,
          result.tokens.accessTokenExpiresAt,
          result.tokens.refreshTokenExpiresAt,
        );
        tokenStorage.setUserSnapshot(toSnapshot(result.user));
        setUser(result.user);
      } catch {
        tokenStorage.clearTokens();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (login: string, password: string) => {
    const result = await authApi.login(login, password);
    tokenStorage.setTokens(
      result.tokens.accessToken,
      result.tokens.refreshToken,
      result.tokens.accessTokenExpiresAt,
      result.tokens.refreshTokenExpiresAt,
    );
    tokenStorage.setUserSnapshot(toSnapshot(result.user));
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    const rt = tokenStorage.getRefreshToken();
    if (rt) {
      try {
        await authApi.logout(rt);
      } catch {
        /* ignore */
      }
    }
    tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    tokenStorage.setUserSnapshot(toSnapshot(me));
  }, []);

  const isAdmin = user?.role === UserRole.Admin;
  const isManagerOrAbove = user?.role === UserRole.Admin || user?.role === UserRole.Manager;

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
      isAdmin,
      isManagerOrAbove,
    }),
    [user, loading, login, logout, refreshUser, isAdmin, isManagerOrAbove],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
