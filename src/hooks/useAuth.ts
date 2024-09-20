import { useContext, useMemo, useCallback } from 'react';
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

// Define specific error types if applicable
export interface AuthError {
  message: string;
  code: string;
}

// Update AuthContextType to handle errors
export interface AuthContextType {
  user: User | null;
  login: (provider: OAuthProvider, idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: AuthError | null;
  updateUserProfile: (data: { name: string }) => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const memoizedLogin = useCallback(context.login, [context.login]);
  const memoizedLogout = useCallback(context.logout, [context.logout]);
  const memoizedUpdateUserProfile = useCallback(context.updateUserProfile, [context.updateUserProfile]);

  return useMemo(
    () => ({
      user: context.user,
      login: memoizedLogin,
      logout: memoizedLogout,
      isLoading: context.isLoading,
      error: context.error,
      updateUserProfile: memoizedUpdateUserProfile,
    }),
    [context, memoizedLogin, memoizedLogout, memoizedUpdateUserProfile]
  );
};
