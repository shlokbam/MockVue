import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('mockvue_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('mockvue_token', data.access_token);
    localStorage.setItem('mockvue_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('mockvue_token', data.access_token);
    localStorage.setItem('mockvue_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mockvue_token');
    localStorage.removeItem('mockvue_user');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (name, email) => {
    const { data } = await api.put('/auth/profile', { name, email });
    localStorage.setItem('mockvue_user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const changePassword = useCallback(async (current_password, new_password) => {
    await api.put('/auth/password', { current_password, new_password });
  }, []);

  const verifyApiKey = useCallback(async (api_key) => {
    const { data } = await api.post('/auth/verify-api-key', { api_key });
    return data;
  }, []);

  const verifyStoredApiKey = useCallback(async () => {
    const { data } = await api.post('/auth/verify-stored-key');
    return data;
  }, []);

  const saveApiKey = useCallback(async (api_key) => {
    const { data } = await api.put('/auth/api-key', { api_key });
    localStorage.setItem('mockvue_user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, login, register, logout, 
      updateProfile, changePassword, verifyApiKey, verifyStoredApiKey, saveApiKey,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
