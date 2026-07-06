'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import type {
  AuthUser,
  LoginResponse,
  RegisterResponse,
  UserRole,
} from '@/types/api';

interface LoginParams {
  email: string;
  password: string;
  expectedRole?: UserRole;
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  walletAddress?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (params: LoginParams) => Promise<AuthUser>;
  register: (params: RegisterParams) => Promise<AuthUser>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

type MeResponse = AuthUser | { user: AuthUser };

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'educhain_access_token';
const USER_KEY = 'educhain_user';

function normalizeUser(data: MeResponse): AuthUser {
  if ('user' in data) {
    return data.user;
  }

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveSession = useCallback((accessToken: string, authUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));

    setToken(accessToken);
    setUser(authUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const response = await api.get<MeResponse>('/auth/me');
    const authUser = normalizeUser(response.data);

    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }

    refreshMe()
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clearSession, refreshMe]);

  const login = useCallback(
    async ({ email, password, expectedRole }: LoginParams) => {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      const authUser = response.data.user;

      if (expectedRole && authUser.role !== expectedRole) {
        throw new Error(
          expectedRole === 'ISSUER'
            ? 'บัญชีนี้ไม่ใช่บัญชีมหาวิทยาลัย'
            : 'บัญชีนี้ไม่ใช่บัญชีนักศึกษา',
        );
      }

      saveSession(response.data.accessToken, authUser);

      return authUser;
    },
    [saveSession],
  );

  const register = useCallback(
    async ({ name, email, password, role, walletAddress }: RegisterParams) => {
      const response = await api.post<RegisterResponse>('/auth/register', {
        name,
        email,
        password,
        role,
        walletAddress: walletAddress || undefined,
      });

      saveSession(response.data.accessToken, response.data.user);

      return response.data.user;
    },
    [saveSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout: clearSession,
      refreshMe,
    }),
    [user, token, isLoading, login, register, clearSession, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth ต้องถูกใช้งานภายใน AuthProvider');
  }

  return context;
}