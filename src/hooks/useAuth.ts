import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  login: (provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE', idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
