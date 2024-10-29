// frontend/src/hooks/useAuth.ts
"use client";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  login,
  register,
  logout,
  reset,
  selectAuth,
  initializeAuth,
  refreshAuth,
} from "../store/slices/authSlice";
import { useCallback, useState } from "react";
import { User } from "@shared/types";

interface AuthHookReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginUser: (email: string, password: string) => Promise<any>;
  registerUser: (email: string, password: string, name: string) => Promise<any>;
  logoutUser: () => Promise<void>;
  resetAuth: () => void;
  initAuth: () => Promise<void>;
  refreshUserAuth: () => Promise<void>;
}

export const useAuth = (): AuthHookReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector(selectAuth);
  const [isInitializing, setIsInitializing] = useState(true);

  // Enhanced initialization logic
  const initAuth = useCallback(async () => {
    try {
      setIsInitializing(true);
      await dispatch(initializeAuth()).unwrap();
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setIsInitializing(false);
    }
  }, [dispatch]);

  // Enhanced login with proper error handling
  const loginUser = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await dispatch(login({ email, password })).unwrap();
        return result;
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    [dispatch]
  );

  // Enhanced register with proper error handling
  const registerUser = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const result = await dispatch(
          register({ email, password, name })
        ).unwrap();
        return result;
      } catch (error) {
        console.error("Registration failed:", error);
        throw error;
      }
    },
    [dispatch]
  );

  // Enhanced logout with cleanup
  const logoutUser = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [dispatch]);

  // Add refresh token functionality
  const refreshUserAuth = useCallback(async () => {
    try {
      await dispatch(refreshAuth()).unwrap();
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  }, [dispatch]);

  const resetAuth = useCallback(() => {
    dispatch(reset());
  }, [dispatch]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.status === "loading" || isInitializing,
    error: authState.error,
    loginUser,
    registerUser,
    logoutUser,
    resetAuth,
    initAuth,
    refreshUserAuth,
  };
};
