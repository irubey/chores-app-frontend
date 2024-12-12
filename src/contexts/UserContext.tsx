"use client";
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { User } from "@shared/types";
import { authApi } from "@/lib/api/services/authService";
import { userApi } from "@/lib/api/services/userService";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";

type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

interface AuthState {
  user: User | null;
  status: AuthStatus;
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
  setActiveHousehold: (householdId: string | null) => Promise<void>;
  updateProfile: (data: {
    name?: string;
    profileImageURL?: string;
  }) => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null,
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

// Static initialization flag
let isGloballyInitialized = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const initializationRef = useRef<{
    isInitializing: boolean;
    abortController: AbortController | null;
    promise: Promise<void> | null;
  }>({
    isInitializing: false,
    abortController: null,
    promise: null,
  });

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => {
      if (
        Object.entries(updates).every(
          ([key, value]) => prev[key as keyof AuthState] === value
        )
      ) {
        return prev;
      }
      const newState = { ...prev, ...updates };
      logger.debug("Auth state changed", {
        status: newState.status,
        hasUser: !!newState.user,
        hasError: !!newState.error,
        activeHouseholdId: newState.user?.activeHouseholdId,
      });
      return newState;
    });
  }, []);

  const refreshAuthState = useCallback(async () => {
    if (
      initializationRef.current.isInitializing &&
      initializationRef.current.promise
    ) {
      return initializationRef.current.promise;
    }

    const initPromise = (async () => {
      try {
        initializationRef.current.isInitializing = true;
        initializationRef.current.abortController = new AbortController();

        updateState({ status: "loading", error: null });
        logger.debug("API Request: Initialize Auth");

        const response = await authApi.auth.initializeAuth({
          signal: initializationRef.current.abortController.signal,
        });

        if (response?.data) {
          updateState({
            user: response.data,
            status: "authenticated",
            error: null,
          });
          logger.info("Auth initialized - user authenticated", {
            userId: response.data.id,
            activeHouseholdId: response.data.activeHouseholdId,
          });
        } else {
          updateState({
            user: null,
            status: "unauthenticated",
            error: null,
          });
          logger.info("Auth initialized - no active session");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          logger.debug("Auth initialization aborted");
          return;
        }

        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          updateState({
            user: null,
            status: "unauthenticated",
            error: null,
          });
          logger.info("Auth initialized - unauthorized");
          return;
        }

        const errorState = getErrorMessage(error);
        updateState({
          status: "error",
          error: errorState,
          user: null,
        });
        logger.error("Auth initialization failed", errorState);
      } finally {
        initializationRef.current.isInitializing = false;
        initializationRef.current.promise = null;
        initializationRef.current.abortController = null;
      }
    })();

    initializationRef.current.promise = initPromise;
    return initPromise;
  }, [updateState]);

  useEffect(() => {
    if (!isGloballyInitialized) {
      isGloballyInitialized = true;
      logger.debug("Auth provider mounted");
      refreshAuthState();
    }

    return () => {
      if (initializationRef.current.abortController) {
        initializationRef.current.abortController.abort();
      }
      logger.debug("Auth provider unmounting");
    };
  }, [refreshAuthState]);

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
        error: null,
      });
    },
    [updateState]
  );

  const setUnauthenticated = useCallback(() => {
    updateState({
      user: null,
      status: "unauthenticated",
      error: null,
    });
  }, [updateState]);

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

  const setActiveHousehold = useCallback(
    async (householdId: string | null) => {
      try {
        setLoading();
        const response = await userApi.users.setActiveHousehold(householdId);
        setAuthenticated(response.data);
        logger.info("Active household updated", {
          userId: response.data.id,
          householdId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setError(error);
        throw error;
      }
    },
    [setLoading, setAuthenticated, setError]
  );

  const updateProfile = useCallback(
    async (data: { name?: string; profileImageURL?: string }) => {
      try {
        setLoading();
        const response = await userApi.users.updateProfile(data);
        setAuthenticated(response.data);
        logger.info("User profile updated", {
          userId: response.data.id,
          updatedFields: Object.keys(data),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setError(error);
        throw error;
      }
    },
    [setLoading, setAuthenticated, setError]
  );

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshAuthState,
      clearError,
      setActiveHousehold,
      updateProfile,
    }),
    [
      state,
      login,
      register,
      logout,
      refreshAuthState,
      clearError,
      setActiveHousehold,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper hooks for auth state
export function useIsAuthenticated() {
  const { status } = useAuth();
  return useMemo(() => status === "authenticated", [status]);
}

export function useIsLoading() {
  const { status } = useAuth();
  return useMemo(() => status === "loading", [status]);
}

export function useAuthUser() {
  const { user } = useAuth();
  return useMemo(() => user, [user]);
}

export function useAuthStatus() {
  const { status, error } = useAuth();
  return useMemo(() => ({ status, error }), [status, error]);
}

export function useAuthActions() {
  const {
    login,
    register,
    logout,
    refreshAuthState,
    clearError,
    setActiveHousehold,
    updateProfile,
  } = useAuth();
  return useMemo(
    () => ({
      login,
      register,
      logout,
      refreshAuthState,
      clearError,
      setActiveHousehold,
      updateProfile,
    }),
    [
      login,
      register,
      logout,
      refreshAuthState,
      clearError,
      setActiveHousehold,
      updateProfile,
    ]
  );
}

export function useActiveHousehold() {
  const { user } = useAuth();
  return useMemo(() => user?.activeHouseholdId, [user?.activeHouseholdId]);
}
