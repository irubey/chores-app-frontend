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

interface UserContextState {
  user: User | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "authenticated" | "error";
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
  const requestInProgressRef = useRef<{ [key: string]: Promise<any> }>({});
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

  const dedupRequest = useCallback(
    async <T,>(key: string, request: () => Promise<T>): Promise<T> => {
      if (requestInProgressRef.current[key]) {
        logger.debug("Using existing request", {
          key,
          currentRequests: Object.keys(requestInProgressRef.current),
        });
        return requestInProgressRef.current[key];
      }

      logger.debug("Starting new request", {
        key,
        currentRequests: Object.keys(requestInProgressRef.current),
      });
      requestInProgressRef.current[key] = request().finally(() => {
        logger.debug("Request completed", {
          key,
          remainingRequests: Object.keys(requestInProgressRef.current).filter(
            (k) => k !== key
          ),
        });
        delete requestInProgressRef.current[key];
      });

      return requestInProgressRef.current[key];
    },
    []
  );

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
        throw new Error("Max initialization attempts exceeded");
      }

      setStatusWithLogging("loading");
      logger.debug("Starting auth initialization", {
        attempt: initializationAttempts.current,
        currentStatus: status,
        hasUser: !!user,
      });

      // Use dedupRequest to prevent duplicate API calls
      const response = await dedupRequest("initAuth", () =>
        authService.initializeAuth()
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
        setStatusWithLogging("idle");
        logger.debug("Auth initialization complete - no user found", {
          attempts: initializationAttempts.current,
        });
      }

      setErrorWithLogging(null);
      initializationAttempts.current = 0; // Reset counter on success
    } catch (error) {
      logger.error("Auth initialization failed", {
        error,
        attempts: initializationAttempts.current,
        currentStatus: status,
        hasUser: !!user,
      });
      setUserWithLogging(null);
      setStatusWithLogging("error");
      setErrorWithLogging("Failed to initialize authentication");
      throw error;
    }
  }, [status, user, dedupRequest]);

  // Initialize auth on mount
  useEffect(() => {
    logger.debug("Auth initialization effect running", {
      hasInitRef: !!initializationRef.current,
      currentStatus: status,
      hasUser: !!user,
      attempts: initializationAttempts.current,
    });

    if (!initializationRef.current) {
      logger.debug("Starting initial auth initialization");
      initializationRef.current = initializeAuth().catch((error) => {
        logger.error("Failed to initialize auth on mount", {
          error,
          attempts: initializationAttempts.current,
        });
      });
    }

    return () => {
      logger.debug("Auth initialization effect cleanup", {
        isHidden: document.hidden,
        hasInitRef: !!initializationRef.current,
        attempts: initializationAttempts.current,
        requestsInProgress: Object.keys(requestInProgressRef.current),
      });
      // Only clear refs if component is unmounting
      if (!document.hidden) {
        initializationRef.current = null;
        initializationAttempts.current = 0;
        requestInProgressRef.current = {};
      }
    };
  }, [initializeAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setStatus("loading");
        setError(null);
        logger.debug("Starting login process", { email });

        const response = await dedupRequest("login", () =>
          authService.login({ email, password })
        );
        setUser(response.data);
        setStatus("authenticated");
        logger.info("Login successful", { userId: response.data.id });
      } catch (error) {
        logger.error("Login failed", { error });
        setStatus("error");
        setError("Login failed. Please check your credentials.");
        throw error;
      }
    },
    [dedupRequest]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setStatus("loading");
        setError(null);
        logger.debug("Starting registration process", { email, name });

        const response = await authService.register({ email, password, name });
        setUser(response.data);
        setStatus("authenticated");
        logger.info("Registration successful", { userId: response.data.id });
      } catch (error) {
        logger.error("Registration failed", { error, email, name });
        setStatus("error");
        setError("Registration failed. Please try again.");
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      setStatus("loading");
      logger.debug("Starting logout process", {
        currentUser: user?.id,
        currentStatus: status,
      });

      await authService.logout();
      setUser(null);
      setStatus("idle");
      setError(null);
      logger.info("Logout successful", { previousUserId: user?.id });
    } catch (error) {
      logger.error("Logout failed", {
        error,
        currentUser: user?.id,
        currentStatus: status,
      });
      setStatus("error");
      setError("Logout failed. Please try again.");
      throw error;
    }
  }, [user, status]);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: status === "authenticated",
        status,
        error,
        login,
        register,
        logout,
        initializeAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
