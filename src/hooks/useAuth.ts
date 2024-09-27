// frontend/src/hooks/useAuth.ts
'use client'
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { login, register, logout } from '../store/slices/authSlice';


const useAuth = () => {
  const dispatch: AppDispatch = useDispatch();
  const { user, accessToken, isLoading, isError, message, isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  const loginUser = async (email: string, password: string) => {
    await dispatch(login({ email, password }));
  };

  const registerUser = async (email: string, password: string, name: string) => {
    await dispatch(register({ email, password, name }));
  };

  const logoutUser = async () => {
    await dispatch(logout());
  };

  return {
    user,
    accessToken,
    isLoading,
    isError,
    message,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    isAuthenticated,
    isInitialized,
  };
};

export default useAuth;
