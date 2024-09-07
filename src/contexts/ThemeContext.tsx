'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
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

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const themeValues: ThemeContextType = {
    theme,
    toggleTheme,
    primaryColor: theme === 'light' ? 'primary-DEFAULT' : 'primary-light',
    secondaryColor: theme === 'light' ? 'secondary-DEFAULT' : 'secondary-light',
    accentColor: theme === 'light' ? 'accent-DEFAULT' : 'accent-light',
    backgroundColor: theme === 'light' ? 'neutral-100' : 'neutral-800',
    textColor: theme === 'light' ? 'neutral-900' : 'neutral-100',
  };

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
