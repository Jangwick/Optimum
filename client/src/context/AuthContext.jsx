import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getMe, login as loginApi, logout as logoutApi } from '../services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const loadUser = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;
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
    const { user: me } = await loginApi(credentials);
    setUser(me);
    return me;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
