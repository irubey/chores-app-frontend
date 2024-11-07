// frontend/src/hooks/useAuth.ts
"use client";
import { useCallback } from "react";
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
import { User } from "@shared/types";

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  name: string;
};

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector(selectAuth);

  // Auth Actions
  const loginUser = useCallback(
    async (credentials: LoginCredentials) => {
      await dispatch(login(credentials)).unwrap();
    },
    [dispatch]
  );

  const registerUser = useCallback(
    async (data: RegisterData) => {
      await dispatch(register(data)).unwrap();
    },
    [dispatch]
  );

  const logoutUser = useCallback(async () => {
    await dispatch(logout()).unwrap();
  }, [dispatch]);

  const initAuth = useCallback(async () => {
    await dispatch(initializeAuth()).unwrap();
  }, [dispatch]);

  const resetAuth = useCallback(() => {
    dispatch(reset());
  }, [dispatch]);

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.status === "loading",
    error: authState.error,

    // Actions
    loginUser,
    registerUser,
    logoutUser,
    resetAuth,
    initAuth,
  };
};
