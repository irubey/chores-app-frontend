// frontend/src/hooks/useAuth.ts
"use client";
import { useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { User } from "@shared/types";
import { logger } from "@/lib/api/logger";

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<User | null>;
  resetAuth: () => void;
}

export function useAuth(): UseAuthReturn {
  const {
    user,
    isAuthenticated,
    status,
    error,
    login: contextLogin,
    register: contextRegister,
    logout: contextLogout,
    initializeAuth,
  } = useUser();

  const login = useCallback(
    async (email: string, password: string) => {
      logger.debug("useAuth: Initiating login", { email });
      try {
        await contextLogin(email, password);
        logger.info("useAuth: Login successful");
      } catch (error) {
        logger.error("useAuth: Login failed", { error });
        throw error;
      }
    },
    [contextLogin]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      logger.debug("useAuth: Initiating registration", { email, name });
      try {
        await contextRegister(email, password, name);
        logger.info("useAuth: Registration successful");
      } catch (error) {
        logger.error("useAuth: Registration failed", { error });
        throw error;
      }
    },
    [contextRegister]
  );

  const logout = useCallback(async () => {
    logger.debug("useAuth: Initiating logout");
    try {
      await contextLogout();
      logger.info("useAuth: Logout successful");
    } catch (error) {
      logger.error("useAuth: Logout failed", { error });
      throw error;
    }
  }, [contextLogout]);

  const initAuth = useCallback(async () => {
    logger.debug("useAuth: Initiating auth initialization");
    try {
      await initializeAuth();
      logger.info("useAuth: Auth initialization completed", {
        isAuthenticated,
        hasUser: !!user,
      });
      return user;
    } catch (error) {
      logger.error("useAuth: Auth initialization failed", { error });
      throw error;
    }
  }, [initializeAuth, isAuthenticated, user]);

  const resetAuth = useCallback(() => {
    logger.debug("useAuth: Resetting auth state");
    logout().catch((error) => {
      logger.error("useAuth: Reset auth failed", { error });
    });
  }, [logout]);

  return {
    user,
    isAuthenticated,
    isLoading: status === "loading",
    error,
    status,
    login,
    register,
    logout,
    initAuth,
    resetAuth,
  };
}
