import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, userKeys } from "@/lib/api/services/userService";
import { UpdateUserDTO, User } from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { logger } from "@/lib/api/logger";

export function useUser() {
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
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserDTO) => {
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
      queryClient.setQueryData(userKeys.profile(), response);
    },
  });
}

export function useSetActiveHousehold() {
  const queryClient = useQueryClient();

  interface MutationContext {
    previousUser: ApiResponse<User> | undefined;
  }

  return useMutation({
    mutationFn: async (householdId: string | null) => {
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

      // Optimistically update the user
      if (previousUser) {
        queryClient.setQueryData<ApiResponse<User>>(userKeys.profile(), {
          ...previousUser,
          data: {
            ...previousUser.data,
            activeHouseholdId: householdId,
          },
        });
      }

      return { previousUser };
    },
    onError: (_, __, context: MutationContext | undefined) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.profile(), context.previousUser);
      }
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}
