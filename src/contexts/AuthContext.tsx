'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthContextType } from '../hooks/useAuth';
import { api } from '../utils/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const userData = await api.get('/api/auth/user');
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE', idToken: string) => {
    setIsLoading(true);
    try {
      const userData = await api.post('/api/auth/login', { provider, idToken });
      setUser(userData.user);
      localStorage.setItem('token', userData.token);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/logout', {});
      setUser(null);
      localStorage.removeItem('token');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
