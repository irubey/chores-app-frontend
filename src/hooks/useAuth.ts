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
import { logger } from "../lib/api/logger";
import { ApiError } from "../lib/api/errors/apiErrors";

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

  const loginUser = useCallback(
    async (credentials: LoginCredentials) => {
      logger.info("Attempting login", { email: credentials.email });
      try {
        const result = await dispatch(login(credentials)).unwrap();
        logger.info("Login successful", { userId: result.id });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Login failed", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Login failed", { error });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const registerUser = useCallback(
    async (data: RegisterData) => {
      logger.info("Attempting registration", { email: data.email });
      try {
        const result = await dispatch(register(data)).unwrap();
        logger.info("Registration successful", { userId: result.id });
        return result;
      } catch (error) {
        logger.error("Registration failed", { error });
        throw error;
      }
    },
    [dispatch]
  );

  const logoutUser = useCallback(async () => {
    logger.info("Logging out");
    try {
      await dispatch(logout()).unwrap();
      logger.info("Logout successful");
    } catch (error) {
      logger.error("Logout failed", { error });
      throw error;
    }
  }, [dispatch]);

  const initAuth = useCallback(async () => {
    logger.info("Initializing auth");
    try {
      const result = await dispatch(initializeAuth()).unwrap();
      logger.info("Auth initialization complete", {
        authenticated: !!result,
      });
      return result;
    } catch (error) {
      logger.error("Auth initialization failed", { error });
      throw error;
    }
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
    initAuth,
    resetAuth: () => dispatch(reset()),
  };
};
