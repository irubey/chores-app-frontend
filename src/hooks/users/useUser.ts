import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, userKeys } from "@/lib/api/services/userService";
import { UpdateUserDTO, User } from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { logger } from "@/lib/api/logger";
import { useAuth } from "@/contexts/UserContext";
import { authKeys } from "@/lib/api/services/authService";
import { ApiError, ApiErrorType } from "@/lib/api/errors/apiErrors";

export function useUser() {
  const { status, user: authUser, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      try {
        const result = await userApi.users.getProfile();
        logger.debug("User profile fetched", {
          userId: result.data.id,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch user profile", { error });
        if (
          error instanceof ApiError &&
          error.type === ApiErrorType.UNAUTHORIZED
        ) {
          queryClient.setQueryData(userKeys.profile(), null);
          queryClient.setQueryData(authKeys.session(), null);
        }
        throw error;
      }
    },
    enabled: status === "authenticated" && !isAuthLoading,
    initialData: authUser
      ? ({ data: authUser } as ApiResponse<User>)
      : undefined,
    staleTime: 30000,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        error.type === ApiErrorType.UNAUTHORIZED
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    gcTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    updateCache: (
      updater: (oldData: ApiResponse<User> | undefined) => ApiResponse<User>
    ) => {
      const newData = updater(queryClient.getQueryData(userKeys.profile()));
      if (newData) {
        queryClient.setQueryData(userKeys.profile(), newData);
        queryClient.setQueryData(authKeys.session(), newData.data);
      }
    },
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<User>, ApiError, UpdateUserDTO>({
    mutationFn: async (data) => {
      try {
        const result = await userApi.users.updateProfile(data);
        logger.info("User profile updated", {
          userId: result.data.id,
          updatedFields: Object.keys(data),
        });
        return result;
      } catch (error) {
        logger.error("Failed to update user profile", { error });
        throw error;
      }
    },
    onSuccess: (response) => {
      // Update both caches
      queryClient.setQueryData(userKeys.profile(), response);
      queryClient.setQueryData(authKeys.session(), response.data);
    },
  });
}

export function useSetActiveHousehold() {
  const queryClient = useQueryClient();
  const { updateCache } = useUser();

  interface MutationContext {
    previousUser: ApiResponse<User> | undefined;
    previousHouseholdId: string | null;
  }

  return useMutation<
    ApiResponse<User>,
    ApiError,
    string | null,
    MutationContext
  >({
    mutationFn: async (householdId) => {
      try {
        // Add retry logic for auth failures
        const maxRetries = 2;
        let retries = 0;
        let lastError: Error | null = null;

        while (retries < maxRetries) {
          try {
            const result = await userApi.users.setActiveHousehold(householdId);
            logger.info("Active household updated", { householdId });
            return result;
          } catch (error) {
            lastError = error as Error;
            if (
              error instanceof ApiError &&
              error.type === ApiErrorType.UNAUTHORIZED &&
              retries < maxRetries - 1
            ) {
              retries++;
              logger.debug("Retrying household update after auth error", {
                attempt: retries,
                householdId,
              });
              await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retry
              continue;
            }
            throw error;
          }
        }

        throw (
          lastError ||
          new Error("Failed to update active household after retries")
        );
      } catch (error) {
        logger.error("Failed to update active household", { error });
        throw error;
      }
    },
    onMutate: async (householdId): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<ApiResponse<User>>(
        userKeys.profile()
      );

      const previousHouseholdId = previousUser?.data?.activeHouseholdId || null;

      // Optimistically update the cache
      if (previousUser) {
        logger.debug("Optimistically updated household", {
          from: previousHouseholdId,
          to: householdId,
        });

        updateCache((old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              activeHouseholdId: householdId,
            },
          };
        });
      }

      return { previousUser, previousHouseholdId };
    },
    onError: (error, _, context) => {
      if (context) {
        logger.debug("Rolling back household change", {
          from: context.previousHouseholdId,
          error: error.message,
        });

        // Revert optimistic update on error
        if (context.previousUser) {
          updateCache(() => context.previousUser!);
        }
      }
    },
    onSettled: () => {
      // Invalidate related queries after settling
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}
