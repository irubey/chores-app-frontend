"use client";
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { User } from "@shared/types";
import { authService } from "@/lib/api/services/authService";
import { logger } from "@/lib/api/logger";
import { requestManager } from "@/lib/api/requestManager";

interface UserContextState {
  user: User | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const UserContext = createContext<UserContextState | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<UserContextState["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const initializationRef = useRef<Promise<void> | null>(null);
  const initializationAttempts = useRef(0);
  const MAX_INIT_ATTEMPTS = 3;

  // Log state changes
  const setUserWithLogging = (newUser: User | null) => {
    logger.debug("User state changing", {
      from: user?.id,
      to: newUser?.id,
      currentStatus: status,
    });
    setUser(newUser);
  };

  const setStatusWithLogging = (newStatus: UserContextState["status"]) => {
    logger.debug("Status state changing", {
      from: status,
      to: newStatus,
      hasUser: !!user,
    });
    setStatus(newStatus);
  };

  const setErrorWithLogging = (newError: string | null) => {
    logger.debug("Error state changing", {
      from: error,
      to: newError,
      currentStatus: status,
    });
    setError(newError);
  };

  const initializeAuth = useCallback(async () => {
    try {
      // Prevent multiple concurrent initializations
      if (status === "loading") {
        logger.debug("Skipping auth initialization - already loading", {
          currentStatus: status,
          hasUser: !!user,
          attempts: initializationAttempts.current,
        });
        return;
      }

      // Prevent re-initialization if already authenticated
      if (status === "authenticated" && user) {
        logger.debug("Skipping auth initialization - already authenticated", {
          userId: user.id,
          attempts: initializationAttempts.current,
        });
        return;
      }

      // Track initialization attempts
      initializationAttempts.current++;
      if (initializationAttempts.current > MAX_INIT_ATTEMPTS) {
        logger.error("Max auth initialization attempts exceeded", {
          attempts: initializationAttempts.current,
          currentStatus: status,
          hasUser: !!user,
        });
        setStatusWithLogging("unauthenticated");
        throw new Error("Max initialization attempts exceeded");
      }

      setStatusWithLogging("loading");
      logger.debug("Starting auth initialization", {
        attempt: initializationAttempts.current,
        currentStatus: status,
        hasUser: !!user,
      });

      const response = await requestManager.dedupRequest(
        "initAuth",
        () => authService.initializeAuth(),
        { requiresAuth: false }
      );

      if (response?.data) {
        setUserWithLogging(response.data);
        setStatusWithLogging("authenticated");
        logger.info("Auth initialization successful", {
          userId: response.data.id,
          attempts: initializationAttempts.current,
        });
      } else {
        setUserWithLogging(null);
        setStatusWithLogging("unauthenticated");
        logger.debug("Auth initialization complete - no user found", {
          attempts: initializationAttempts.current,
        });
      }

      setErrorWithLogging(null);
      initializationAttempts.current = 0; // Reset counter on success
    } catch (error: any) {
      logger.error("Auth initialization failed", {
        error,
        attempts: initializationAttempts.current,
        currentStatus: status,
        hasUser: !!user,
      });

      // Handle 401 specifically
      if (error?.status === 401 || error?.response?.status === 401) {
        setUserWithLogging(null);
        setStatusWithLogging("unauthenticated");
        setErrorWithLogging(null);
        logger.info("User not authenticated");
        initializationAttempts.current = 0; // Reset counter on 401
        return;
      }

      setUserWithLogging(null);
      setStatusWithLogging("error");
      setErrorWithLogging("Failed to initialize authentication");
      throw error;
    }
  }, [status, user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setStatusWithLogging("loading");
      setErrorWithLogging(null);
      logger.debug("Starting login process", { email });

      const response = await requestManager.dedupRequest(
        "login",
        () => authService.login({ email, password }),
        { requiresAuth: false }
      );

      setUserWithLogging(response.data);
      setStatusWithLogging("authenticated");
      logger.info("Login successful", { userId: response.data.id });
    } catch (error) {
      logger.error("Login failed", { error });
      setStatusWithLogging("error");
      setErrorWithLogging("Login failed. Please check your credentials.");
      throw error;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setStatusWithLogging("loading");
        setErrorWithLogging(null);
        logger.debug("Starting registration process", { email, name });

        const response = await requestManager.dedupRequest(
          "register",
          () => authService.register({ email, password, name }),
          { requiresAuth: false }
        );

        if (!response?.data) {
          throw new Error("Registration failed - no user data received");
        }

        // Initialize auth state after registration
        await requestManager.dedupRequest(
          "initAuth",
          () => authService.initializeAuth(),
          { requiresAuth: false }
        );

        setUserWithLogging(response.data);
        setStatusWithLogging("authenticated");
        logger.info("Registration successful", { userId: response.data.id });
      } catch (error: any) {
        logger.error("Registration failed", { error, email, name });
        setStatusWithLogging("error");
        setErrorWithLogging(
          error?.response?.data?.message ||
            error?.message ||
            "Registration failed. Please try again."
        );
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      setStatusWithLogging("loading");
      logger.debug("Starting logout process", {
        currentUser: user?.id,
        currentStatus: status,
      });

      await requestManager.dedupRequest("logout", () => authService.logout(), {
        requiresAuth: true,
      });

      setUserWithLogging(null);
      setStatusWithLogging("idle");
      setErrorWithLogging(null);
      logger.info("Logout successful", { previousUserId: user?.id });
    } catch (error) {
      logger.error("Logout failed", {
        error,
        currentUser: user?.id,
        currentStatus: status,
      });
      setStatusWithLogging("error");
      setErrorWithLogging("Logout failed. Please try again.");
      throw error;
    }
  }, [user, status]);

  // Initialize auth on mount
  useEffect(() => {
    if (initializationRef.current) {
      logger.debug("Auth initialization already in progress", {
        currentStatus: status,
        hasUser: !!user,
      });
      return;
    }

    logger.debug("Starting initial auth check", {
      currentStatus: status,
      hasUser: !!user,
    });

    initializationRef.current = initializeAuth()
      .catch((error) => {
        logger.error("Initial auth check failed", { error });
      })
      .finally(() => {
        initializationRef.current = null;
      });
  }, []); // Only run on mount

  // Provide the context value
  const value = {
    user,
    isAuthenticated: status === "authenticated",
    status,
    error,
    login,
    register,
    logout,
    initializeAuth,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
