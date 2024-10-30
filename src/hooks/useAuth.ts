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
} from "../store/slices/authSlice";
import { useCallback, useEffect, useState, useRef } from "react";
import { User } from "@shared/types";
import { ApiError } from "@/lib/api/errors";

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  name: string;
};

interface AuthHookReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginUser: (credentials: LoginCredentials) => Promise<void>;
  registerUser: (data: RegisterData) => Promise<void>;
  logoutUser: () => Promise<void>;
  resetAuth: () => void;
  initAuth: () => Promise<void>;
}

export const useAuth = (): AuthHookReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector(selectAuth);
  const [isInitializing, setIsInitializing] = useState(false);
  const initAttempted = useRef(false);

  const initAuth = async (): Promise<void> => {
    if (initAttempted.current) return;

    try {
      initAttempted.current = true;
      setIsInitializing(true);
      await dispatch(initializeAuth()).unwrap();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Handle unauthorized silently for initial auth check
        return;
      }
      console.error("Auth initialization failed:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const isLoading =
    authState.status === "loading" ||
    (isInitializing && authState.status !== "failed");

  return {
    user: authState.user,
    isAuthenticated: !!authState.user,
    isLoading,
    error: authState.error,
    loginUser: async (credentials) => {
      await dispatch(login(credentials)).unwrap();
    },
    registerUser: async (data) => {
      await dispatch(register(data)).unwrap();
    },
    logoutUser: async () => {
      await dispatch(logout()).unwrap();
    },
    resetAuth: () => dispatch(reset()),
    initAuth,
  };
};
