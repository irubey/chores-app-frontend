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
import { userApi } from "@/lib/api/services/userService";
import { logger } from "@/lib/api/logger";
import { ApiError } from "@/lib/api/errors";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { hasAuthSession } from "@/utils/cookieUtils";

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
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(initialState);
  const initializationRef = useRef(false);

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

  // Auth initialization query
  const queryOptions: UseQueryOptions<User | null, ApiError> = {
    queryKey: authKeys.session(),
    queryFn: async () => {
      logger.debug("API Request: Initialize Auth", {
        timestamp: new Date().toISOString(),
      });

      try {
        const response = await authApi.auth.initializeAuth();
        const data = response?.data ?? null;

        if (data) {
          logger.debug("Auth initialization succeeded", {
            hasUser: true,
            userId: data.id,
          });
        } else {
          logger.debug("Auth initialization - no session");
        }

        return data;
      } catch (error) {
        logger.error("Auth initialization failed", {
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }
    },
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !initializationRef.current,
  };

  const { data: authData, error: initError } = useQuery<User | null, ApiError>(
    queryOptions
  );

  // Handle auth state updates
  useEffect(() => {
    if (!initializationRef.current && (authData !== undefined || initError)) {
      initializationRef.current = true;

      if (authData) {
        updateState({
          user: authData,
          status: "authenticated",
          error: null,
        });
        logger.info("Auth initialized - user authenticated", {
          userId: authData.id,
          activeHouseholdId: authData.activeHouseholdId,
        });
      } else {
        updateState({
          user: null,
          status: "unauthenticated",
          error: null,
        });
        logger.info("Auth initialized - no active session");
      }
    }
  }, [authData, initError, updateState]);

  // Login mutation
  const loginMutation = useMutation<
    User,
    ApiError,
    { email: string; password: string }
  >({
    mutationFn: async ({ email, password }) => {
      updateState({ status: "loading", error: null });
      const response = await authApi.auth.login({ email, password });
      return response.data;
    },
    onSuccess: (user) => {
      updateState({
        user,
        status: "authenticated",
        error: null,
      });
      queryClient.setQueryData(["auth", "session"], user);
      logger.info("User authenticated", {
        userId: user.id,
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
        user: null,
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
  const registerMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) => {
      updateState({ status: "loading", error: null });
      const response = await authApi.auth.register({ email, password, name });
      if (!response?.data) {
        throw new Error("Registration failed - no user data received");
      }
      return response.data;
    },
    onSuccess: (user) => {
      updateState({
        user,
        status: "authenticated",
        error: null,
      });
      queryClient.setQueryData(["auth", "session"], user);
      logger.info("User registered", {
        userId: user.id,
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
              user: null,
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
              user: null,
            });
            break;
          default:
            const errorState = getErrorMessage(error);
            updateState({
              status: "error",
              error: errorState,
              user: null,
            });
        }
      } else {
        const errorState = getErrorMessage(error);
        updateState({
          status: "error",
          error: errorState,
          user: null,
        });
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      updateState({ status: "loading", error: null });
      const userId = state.user?.id;
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
        user: null,
        status: "unauthenticated",
        error: null,
      });
      queryClient.setQueryData(["auth", "session"], null);
    },
    onError: (error) => {
      const errorState = getErrorMessage(error);
      updateState({
        status: "error",
        error: errorState,
        user: null,
      });
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; profileImageURL?: string }) => {
      updateState({ status: "loading", error: null });
      const response = await userApi.users.updateProfile(data);
      return response.data;
    },
    onSuccess: (user) => {
      updateState({
        user,
        status: "authenticated",
        error: null,
      });
      queryClient.setQueryData(["auth", "session"], user);
      logger.info("User profile updated", {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error) => {
      const errorState = getErrorMessage(error);
      updateState({
        status: "error",
        error: errorState,
        user: null,
      });
    },
  });

  // Active household mutation
  const setActiveHouseholdMutation = useMutation({
    mutationFn: async (householdId: string | null) => {
      updateState({ status: "loading", error: null });
      const response = await userApi.users.setActiveHousehold(householdId);
      return response.data;
    },
    onSuccess: (user) => {
      updateState({
        user,
        status: "authenticated",
        error: null,
      });
      queryClient.setQueryData(["auth", "session"], user);
      logger.info("Active household updated", {
        userId: user.id,
        householdId: user.activeHouseholdId,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error) => {
      const errorState = getErrorMessage(error);
      updateState({
        status: "error",
        error: errorState,
        user: null,
      });
    },
  });

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const value = useMemo(
    () => ({
      ...state,
      login: async (email: string, password: string) => {
        try {
          await loginMutation.mutateAsync({ email, password });
        } catch (error) {
          // Let the error propagate to the component
          throw error;
        }
      },
      register: async (email: string, password: string, name: string) => {
        await registerMutation.mutateAsync({ email, password, name });
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
      refreshAuthState: () => {
        return queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      },
      clearError,
      setActiveHousehold: async (householdId: string | null) => {
        await setActiveHouseholdMutation.mutateAsync(householdId);
      },
      updateProfile: async (data: {
        name?: string;
        profileImageURL?: string;
      }) => {
        await updateProfileMutation.mutateAsync(data);
      },
    }),
    [
      state,
      loginMutation.mutateAsync,
      registerMutation.mutateAsync,
      logoutMutation.mutateAsync,
      queryClient,
      clearError,
      setActiveHouseholdMutation.mutateAsync,
      updateProfileMutation.mutateAsync,
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
