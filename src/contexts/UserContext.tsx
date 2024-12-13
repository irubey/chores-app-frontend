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
import { authApi, authKeys } from "@/lib/api/services/authService";
import { logger } from "@/lib/api/logger";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { hasAuthSession } from "@/utils/cookieUtils";
import { userKeys } from "@/lib/api/services/userService";

type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

interface AuthState {
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
}

type AuthContextValue = AuthState &
  AuthActions & {
    user: User | null;
    isLoading: boolean;
  };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
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
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(initialState);
  const initRef = useRef(false);
  const [shouldInitialize, setShouldInitialize] = useState(false);

  // Initialize on mount only
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      setShouldInitialize(true);
    }
  }, []);

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
        hasError: !!newState.error,
      });
      return newState;
    });
  }, []);

  // Auth initialization query
  const {
    data: authData,
    error: initError,
    isLoading,
  } = useQuery<User | null, ApiError>({
    queryKey: authKeys.session(),
    queryFn: async () => {
      logger.debug("API Request: Initialize Auth", {
        timestamp: new Date().toISOString(),
        isInitialized: initRef.current,
      });

      try {
        const response = await authApi.auth.initializeAuth();
        const data = response?.data ?? null;

        if (data) {
          logger.debug("Auth initialization succeeded", {
            hasUser: true,
            userId: data.id,
          });
          // Pre-populate user profile cache
          queryClient.setQueryData(userKeys.profile(), response);
        } else {
          logger.debug("Auth initialization - no session");
        }

        setShouldInitialize(false);
        return data;
      } catch (error) {
        logger.error("Auth initialization failed", {
          error: error instanceof Error ? error.message : error,
        });

        // Handle refresh token failure
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          logger.debug("Auth refresh failed, clearing state", {
            errorType: error.type,
            status: error.status,
            data: error.data,
          });

          updateState({
            status: "unauthenticated",
            error: {
              message: "Session expired",
              code: error.data?.code,
              details: error.data,
            },
          });

          queryClient.setQueryData(authKeys.session(), null);
          queryClient.setQueryData(userKeys.profile(), null);
          queryClient.clear();
        }

        setShouldInitialize(false);
        throw error;
      }
    },
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: shouldInitialize,
  });

  // Handle auth state updates
  useEffect(() => {
    if (!shouldInitialize && (authData !== undefined || initError)) {
      if (authData) {
        updateState({
          status: "authenticated",
          error: null,
        });
        logger.info("Auth initialized - user authenticated", {
          userId: authData.id,
        });
      } else {
        updateState({
          status: "unauthenticated",
          error: null,
        });
        logger.info("Auth initialized - no active session");
      }
    }
  }, [authData, initError, shouldInitialize, updateState]);

  // Login mutation
  const loginMutation = useMutation<
    ApiResponse<User>,
    ApiError,
    { email: string; password: string }
  >({
    mutationFn: async ({ email, password }) => {
      updateState({ status: "loading", error: null });
      const response = await authApi.auth.login({ email, password });
      return response;
    },
    onSuccess: (response) => {
      updateState({
        status: "authenticated",
        error: null,
      });
      queryClient.setQueryData(authKeys.session(), response.data);
      logger.info("User authenticated", {
        userId: response.data.id,
        method: "login",
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error: ApiError) => {
      let errorMessage = "An unexpected error occurred";
      let errorCode = "UNKNOWN_ERROR";

      if (error.status === 401) {
        errorMessage = "Invalid email or password";
        errorCode = "INVALID_CREDENTIALS";
      } else if (error.status === 400) {
        errorMessage = "Please check your input";
        errorCode = "VALIDATION_ERROR";
      } else if (error.status === 429) {
        errorMessage = "Too many attempts. Please try again later";
        errorCode = "RATE_LIMIT";
      }

      updateState({
        status: "error",
        error: {
          message: errorMessage,
          code: errorCode,
          details: error.data,
        },
      });

      logger.error("Login failed", {
        status: error.status,
        type: error.type,
        message: errorMessage,
        details: error.data,
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation<
    ApiResponse<User>,
    ApiError,
    { email: string; password: string; name: string }
  >({
    mutationFn: async ({ email, password, name }) => {
      updateState({ status: "loading", error: null });
      const response = await authApi.auth.register({ email, password, name });
      return response;
    },
    onSuccess: (response) => {
      updateState({
        status: "authenticated",
        error: null,
      });
      queryClient.setQueryData(authKeys.session(), response.data);
      logger.info("User registered", {
        userId: response.data.id,
        method: "register",
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 409:
            updateState({
              status: "error",
              error: {
                message: "An account with this email already exists",
                code: "EMAIL_EXISTS",
              },
            });
            break;
          case 400:
            updateState({
              status: "error",
              error: {
                message: "Invalid registration data provided",
                code: "INVALID_DATA",
                details: error.data,
              },
            });
            break;
          default:
            const errorState = getErrorMessage(error);
            updateState({
              status: "error",
              error: errorState,
            });
        }
      } else {
        const errorState = getErrorMessage(error);
        updateState({
          status: "error",
          error: errorState,
        });
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      updateState({ status: "loading", error: null });
      const userId = authData?.id;
      if (userId) {
        logger.info("User logged out", {
          userId,
          timestamp: new Date().toISOString(),
        });
      }
      return authApi.auth.logout();
    },
    onSuccess: () => {
      updateState({
        status: "unauthenticated",
        error: null,
      });
      queryClient.setQueryData(["auth", "session"], null);
      // Clear all queries on logout
      queryClient.clear();
    },
    onError: (error) => {
      const errorState = getErrorMessage(error);
      updateState({
        status: "error",
        error: errorState,
      });
    },
  });

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const value = useMemo(
    () => ({
      ...state,
      user: authData,
      isLoading,
      login: async (email: string, password: string) => {
        try {
          const response = await loginMutation.mutateAsync({ email, password });
          // Update both auth and user profile cache
          queryClient.setQueryData(authKeys.session(), response.data);
          queryClient.setQueryData(userKeys.profile(), response);
        } catch (error) {
          throw error;
        }
      },
      register: async (email: string, password: string, name: string) => {
        const response = await registerMutation.mutateAsync({
          email,
          password,
          name,
        });
        // Update both auth and user profile cache
        queryClient.setQueryData(authKeys.session(), response.data);
        queryClient.setQueryData(userKeys.profile(), response);
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
        // Clear both auth and user profile cache
        queryClient.setQueryData(authKeys.session(), null);
        queryClient.setQueryData(userKeys.profile(), null);
      },
      refreshAuthState: async () => {
        setShouldInitialize(true);
        return queryClient.invalidateQueries({ queryKey: authKeys.session() });
      },
      clearError,
    }),
    [
      state,
      authData,
      isLoading,
      loginMutation.mutateAsync,
      registerMutation.mutateAsync,
      logoutMutation.mutateAsync,
      queryClient,
      clearError,
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

export function useAuthStatus() {
  const { status, error } = useAuth();
  return useMemo(() => ({ status, error }), [status, error]);
}

export function useAuthActions() {
  const { login, register, logout, refreshAuthState, clearError } = useAuth();
  return useMemo(
    () => ({
      login,
      register,
      logout,
      refreshAuthState,
      clearError,
    }),
    [login, register, logout, refreshAuthState, clearError]
  );
}
