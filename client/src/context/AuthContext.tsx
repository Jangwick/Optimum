import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
  updateProfile as updateProfileApi,
} from '../services/auth.service.js';

interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: Record<string, unknown>) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  updateProfile: (payload: Record<string, unknown>) => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { user: me } = (await getMe()) as { user: AuthUser };
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials: Record<string, unknown>) => {
    const { user: me } = (await loginApi(credentials)) as { user: AuthUser };
    setUser(me);
    return me;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const updateProfile = async (payload: Record<string, unknown>) => {
    const { user: updated } = (await updateProfileApi(payload)) as { user: AuthUser };
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
