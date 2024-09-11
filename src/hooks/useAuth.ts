import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export interface User {
  id: string;
  email: string;
  name: string;
  oauth_provider: OAuthProvider;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export type OAuthProvider = 'GOOGLE' | 'FACEBOOK' | 'APPLE';
export type UserRole = 'MEMBER' | 'ADMIN';

export interface AuthContextType {
  user: User | null;
  login: (provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE', idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateUserProfile: (data: { name: string }) => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
