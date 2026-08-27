import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { AuthUser, LoginCredentials, RegisterCredentials } from '../types';
import { ApiError } from '@/lib/apiClient';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (credentials: RegisterCredentials) => Promise<AuthUser>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_session';

/**
 * Validador seguro de expiración de JWT en el cliente sin llamadas de red
 */
function isTokenExpired(jwtToken: string): boolean {
  try {
    const payloadBase64 = jwtToken.split('.')[1];
    if (!payloadBase64) return true;
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    // Si expira en los próximos 10 segundos, considerarlo expirado
    return decoded.exp * 1000 < Date.now() + 10000;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken || isTokenExpired(savedToken)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return savedToken;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken || isTokenExpired(savedToken)) {
      return null;
    }
    const savedUser = localStorage.getItem(USER_KEY);
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Rehidratación síncrona / Verificación de expiración al montar
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken || isTokenExpired(storedToken)) {
      logout();
    }
  }, [logout]);

  // Sincronización multi-pestaña en el navegador (Multi-Tab Sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (!e.newValue) {
          // Sesión cerrada en otra pestaña
          setToken(null);
          setUser(null);
          window.location.href = '/login';
        } else {
          setToken(e.newValue);
        }
      }
      if (e.key === USER_KEY) {
        if (!e.newValue) {
          setUser(null);
        } else {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(credentials);
      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setToken(response.access_token);
      setUser(response.user);
      return response.user;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    try {
      const newUser = await authApi.register(credentials);
      return newUser;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al registrar usuario';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un <AuthProvider>');
  }
  return context;
}
