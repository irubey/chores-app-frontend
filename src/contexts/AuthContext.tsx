'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthContextType } from '../hooks/useAuth';
import { api } from '../utils/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    if (IS_DEVELOPMENT) {
      console.warn('Development mode: Using mock user data');
      setUser({
        id: 'dev-user-id',
        name: 'Dev User',
        email: 'dev@example.com',
        oauth_provider: 'GOOGLE',
        role: 'MEMBER',
        created_at: new Date(),
        updated_at: new Date(),
      });
      setIsLoading(false);
      return;
    }

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

  const login = async (provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE' | 'DEV', idToken?: string) => {
    if (IS_DEVELOPMENT && provider === 'DEV') {
      console.warn('Development mode: Using dev login');
      try {
        const response = await api.post('/api/auth/dev-login', {});
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        router.push('/dashboard');
      } catch (error) {
        console.error('Dev login error:', error);
        throw error;
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { provider, idToken });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (IS_DEVELOPMENT) {
      console.warn('Development mode: Simulating logout');
      setUser(null);
      router.push('/login');
      return;
    }

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

  const updateUserProfile = async (data: { name: string }) => {
    try {
      const updatedUser = await api.put('/api/users/profile', data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
