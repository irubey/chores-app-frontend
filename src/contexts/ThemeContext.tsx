'use client'

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { api, UserPreferences } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const { user } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (user) {
        try {
          const preferences = await api.get<UserPreferences>('/api/users/preferences');
          if (preferences.theme && (preferences.theme === 'light' || preferences.theme === 'dark')) {
            setTheme(preferences.theme);
          }
        } catch (error) {
          console.error('Failed to fetch user preferences:', error);
          // If the endpoint is not found, we'll use the default theme or the one from localStorage
          const savedTheme = localStorage.getItem('theme') as Theme | null;
          if (savedTheme) {
            setTheme(savedTheme);
          }
        }
      }
    };

    fetchUserPreferences();
  }, [user]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setThemeAndUpdatePreferences = (newTheme: Theme) => {
    setTheme(newTheme);
    api.put('/api/users/preferences', { theme: newTheme })
      .catch(error => console.error('Failed to update user preferences:', error));
    localStorage.setItem('theme', newTheme);
  };

  const themeValues = useMemo(() => ({
    theme,
    setTheme: setThemeAndUpdatePreferences,
    toggleTheme,
    primaryColor: theme === 'light' ? 'primary-DEFAULT' : 'primary-light',
    secondaryColor: theme === 'light' ? 'secondary-DEFAULT' : 'secondary-light',
    accentColor: theme === 'light' ? 'accent-DEFAULT' : 'accent-light',
    backgroundColor: theme === 'light' ? 'neutral-100' : 'neutral-800',
    textColor: theme === 'light' ? 'neutral-900' : 'neutral-100',
  }), [theme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={themeValues}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  } 
  return context;
};
