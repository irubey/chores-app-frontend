// frontend/src/hooks/useAuth.ts
'use client'
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { login, register, logout, reset, updateAuthState } from '../store/slices/authSlice';

const useAuth = () => {
  const dispatch: AppDispatch = useDispatch();
  const { user, isLoading, isError, message, isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  const loginUser = async (email: string, password: string): Promise<void> => {
    await dispatch(login({ email, password }));
  };

  const registerUser = async (email: string, password: string, name: string): Promise<void> => {
    await dispatch(register({ email, password, name }));
  };

  const logoutUser = async (): Promise<void> => {
    await dispatch(logout());
  };

  const resetAuth = () => {
    dispatch(reset());
  };

  const updateAuthFlags = (isAuthenticated: boolean, isInitialized: boolean) => {
    dispatch(updateAuthState({ isAuthenticated, isInitialized }));
  };

  const clearError = () => {
    dispatch(reset());
  };

  return {
    user,
    isLoading,
    isError,
    message,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    reset: resetAuth,
    updateAuthState: updateAuthFlags,
    clearError,
    isAuthenticated,
    isInitialized,
  };
};

export default useAuth;