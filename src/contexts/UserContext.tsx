"use client";
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { User } from "@shared/types";
import { authApi } from "@/lib/api/services/authService";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  error: {
    message: string;
    code?: string;
    details?: unknown;
  } | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  clearError: () => void;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: "idle",
  error: null,
};

const getErrorMessage = (error: unknown): AuthState["error"] => {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.type,
      details: error.data,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    details: error,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Log state changes
  useEffect(() => {
    logger.debug("Auth state changed", {
      status: state.status,
      isAuthenticated: state.isAuthenticated,
      hasUser: !!state.user,
      hasError: !!state.error,
    });
  }, [state.status, state.isAuthenticated, state.user, state.error]);

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setLoading = useCallback(() => {
    updateState({ status: "loading", error: null });
  }, [updateState]);

  const setError = useCallback(
    (error: unknown) => {
      const errorState = getErrorMessage(error);
      logger.error("Auth error", {
        code: errorState.code,
        message: errorState.message,
      });
      updateState({
        status: "error",
        error: errorState,
        isAuthenticated: false,
        user: null,
      });
    },
    [updateState]
  );

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const setAuthenticated = useCallback(
    (user: User) => {
      updateState({
        user,
        status: "authenticated",
        isAuthenticated: true,
        error: null,
      });
    },
    [updateState]
  );

  const setUnauthenticated = useCallback(() => {
    updateState({
      user: null,
      status: "unauthenticated",
      isAuthenticated: false,
      error: null,
    });
  }, [updateState]);

  const refreshAuthState = useCallback(async () => {
    try {
      setState((currentState) => {
        if (currentState.status === "loading") return currentState;

        setLoading();
        return currentState;
      });

      const response = await authApi.auth.initializeAuth();

      if (response?.data) {
        setAuthenticated(response.data);
        logger.info("Auth refreshed", {
          userId: response.data.id,
          timestamp: new Date().toISOString(),
        });
      } else {
        setUnauthenticated();
        logger.info("No active session", {
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUnauthenticated();
        return;
      }
      setError(error);
      throw error;
    }
  }, [setLoading, setAuthenticated, setUnauthenticated, setError]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading();
        const response = await authApi.auth.login({ email, password });
        setAuthenticated(response.data);
        logger.info("User authenticated", {
          userId: response.data.id,
          method: "login",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setError({
            message: "Invalid email or password",
            code: "INVALID_CREDENTIALS",
          });
        } else {
          setError(error);
        }
        throw error;
      }
    },
    [setLoading, setAuthenticated, setError]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setLoading();
        const response = await authApi.auth.register({ email, password, name });
        if (!response?.data) {
          throw new Error("Registration failed - no user data received");
        }

        setAuthenticated(response.data);
        logger.info("User registered", {
          userId: response.data.id,
          method: "register",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error instanceof ApiError) {
          switch (error.status) {
            case 409:
              setError({
                message: "An account with this email already exists",
                code: "EMAIL_EXISTS",
              });
              break;
            case 400:
              setError({
                message: "Invalid registration data provided",
                code: "INVALID_DATA",
                details: error.data,
              });
              break;
            default:
              setError(error);
          }
        } else {
          setError(error);
        }
        throw error;
      }
    },
    [setLoading, setAuthenticated, setError]
  );

  const logout = useCallback(async () => {
    try {
      setLoading();
      setState((currentState) => {
        const userId = currentState.user?.id;
        if (userId) {
          logger.info("User logged out", {
            userId,
            timestamp: new Date().toISOString(),
          });
        }
        return currentState;
      });

      await authApi.auth.logout();
      setUnauthenticated();
    } catch (error) {
      setError(error);
      throw error;
    }
  }, [setLoading, setUnauthenticated, setError]);

  // Initialize auth state on mount
  useEffect(() => {
    logger.debug("Auth provider mounted");
    refreshAuthState().catch((error) => {
      logger.error("Auth initialization failed", {
        code: error.code,
        message: error.message,
      });
    });

    return () => {
      logger.debug("Auth provider unmounting");
    };
  }, [refreshAuthState]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshAuthState,
      clearError,
    }),
    [state, login, register, logout, refreshAuthState, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook with memoized selector
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Memoized selectors for specific auth state
export function useAuthUser() {
  const { user } = useAuth();
  return useMemo(() => user, [user]);
}

export function useAuthStatus() {
  const { status, error } = useAuth();
  return useMemo(() => ({ status, error }), [status, error]);
}

export function useAuthActions() {
  const { login, register, logout, refreshAuthState, clearError } = useAuth();
  return useMemo(
    () => ({ login, register, logout, refreshAuthState, clearError }),
    [login, register, logout, refreshAuthState, clearError]
  );
}
