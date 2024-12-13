import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, userKeys } from "@/lib/api/services/userService";
import { UpdateUserDTO, User } from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { logger } from "@/lib/api/logger";
import { useAuth } from "@/contexts/UserContext";
import { authKeys } from "@/lib/api/services/authService";
import { ApiError } from "@/lib/api/errors";

export function useUser() {
  const { status, user: authUser } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
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
        throw error;
      }
    },
    // Only fetch if authenticated and no initial data
    enabled: status === "authenticated" && !authUser,
    // Use auth data as initial data
    initialData: authUser
      ? ({ data: authUser } as ApiResponse<User>)
      : undefined,
    staleTime: 30000, // 30 seconds
  });
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

  interface MutationContext {
    previousUser: ApiResponse<User> | undefined;
  }

  return useMutation<ApiResponse<User>, ApiError, string | null>({
    mutationFn: async (householdId) => {
      try {
        const result = await userApi.users.setActiveHousehold(householdId);
        logger.info("Active household updated", {
          householdId,
        });
        return result;
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

      // Optimistically update both caches
      if (previousUser) {
        const updatedUser = {
          ...previousUser,
          data: {
            ...previousUser.data,
            activeHouseholdId: householdId,
          },
        };
        queryClient.setQueryData(userKeys.profile(), updatedUser);
        queryClient.setQueryData(authKeys.session(), updatedUser.data);
      }

      return { previousUser };
    },
    onError: (_, __, context: MutationContext | undefined) => {
      // Rollback both caches
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.profile(), context.previousUser);
        queryClient.setQueryData(authKeys.session(), context.previousUser.data);
      }
    },
    onSuccess: (response) => {
      // Update both caches
      queryClient.setQueryData(userKeys.profile(), response);
      queryClient.setQueryData(authKeys.session(), response.data);
    },
  });
}
