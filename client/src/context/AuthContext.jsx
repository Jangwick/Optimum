import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
  updateProfile as updateProfileApi,
} from '../services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { user: me } = await getMe();
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

  const login = async (credentials) => {
    const { token, user: me } = await loginApi(credentials);
    if (token) {
      try {
        localStorage.setItem('token', token);
      } catch {
        // ignore
      }
    }
    setUser(me);
    return me;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const { user: updated } = await updateProfileApi(payload);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
