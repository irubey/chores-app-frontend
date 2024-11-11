// frontend/src/hooks/useAuth.ts
"use client";
import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  login,
  register,
  logout,
  reset,
  selectAuth,
  initializeAuth,
} from "../store/slices/authSlice";
import { logger } from "../lib/api/logger";
import { ApiError } from "../lib/api/errors";
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

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector<RootState, AuthState>(selectAuth);

  const loginUser = useCallback(
    async (credentials: LoginCredentials): Promise<User> => {
      logger.info("Attempting login", { email: credentials.email });
      try {
        const resultAction = await dispatch(login(credentials)).unwrap();
        logger.info("Login successful", { userId: resultAction.id });
        return resultAction;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Login failed", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Login failed with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const registerUser = useCallback(
    async (data: RegisterData): Promise<User> => {
      logger.info("Attempting registration", { email: data.email });
      try {
        const resultAction = await dispatch(register(data)).unwrap();
        logger.info("Registration successful", { userId: resultAction.id });
        return resultAction;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Registration failed", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Registration failed with unknown error", { error });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const logoutUser = useCallback(async (): Promise<void> => {
    logger.info("Logging out");
    try {
      await dispatch(logout()).unwrap();
      logger.info("Logout successful");
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error("Logout failed", {
          type: error.type,
          message: error.message,
          status: error.status,
        });
      } else {
        logger.error("Logout failed with unknown error", { error });
      }
      throw error;
    }
  }, [dispatch]);

  const initAuth = useCallback(async (): Promise<User | null> => {
    logger.info("Initializing auth");
    try {
      const resultAction = await dispatch(initializeAuth()).unwrap();
      logger.info("Auth initialization complete", {
        authenticated: !!resultAction,
      });
      return resultAction;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          logger.info("Auth initialization - user not authenticated");
          return null;
        }
        logger.error("Auth initialization failed", {
          type: error.type,
          message: error.message,
          status: error.status,
        });
      } else {
        logger.error("Auth initialization failed with unknown error", {
          error,
        });
      }
      throw error;
    }
  }, [dispatch]);

  const resetAuth = useCallback(() => {
    logger.debug("Resetting auth state");
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
    initAuth,
    resetAuth,
  };
};
