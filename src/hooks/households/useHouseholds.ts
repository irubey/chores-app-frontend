// src/hooks/households/useHouseholds.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  householdApi,
  householdKeys,
} from "@/lib/api/services/householdService";
import { logger } from "@/lib/api/logger";
import type {
  HouseholdWithMembers,
  HouseholdMember,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { useIsAuthenticated } from "@/contexts/UserContext";
import { HouseholdRole } from "@shared/enums";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { useSetActiveHousehold, useUser } from "@/hooks/users/useUser";

// Types
interface UpdateHouseholdVars {
  householdId: string;
  data: UpdateHouseholdDTO;
}

// Utility function to get members from household data
export const getHouseholdMembers = (
  householdsData: ApiResponse<HouseholdWithMembers[]> | undefined,
  householdId: string
): HouseholdMember[] | undefined => {
  const household = householdsData?.data.find((h) => h.id === householdId);
  return household?.members;
};

// List hook
export const useHouseholds = (
  options?: Omit<
    UseQueryOptions<ApiResponse<HouseholdWithMembers[]>>,
    "queryKey" | "queryFn"
  >
) => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: householdKeys.userHouseholds(),
    queryFn: async () => {
      try {
        const result = await householdApi.households.getUserHouseholds();
        logger.debug("Households fetched", {
          count: result.data.length,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch households", { error });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: isAuthenticated,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options,
  });
};

// Detail hook
export const useHousehold = (
  householdId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<HouseholdWithMembers>>,
    "queryKey" | "queryFn"
  >
) => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: householdKeys.detail(householdId),
    queryFn: async () => {
      try {
        const result = await householdApi.households.getHouseholdById(
          householdId
        );
        logger.debug("Household data fetched", {
          householdId,
          memberCount: result.data.members?.length ?? 0,
        });
        return result;
      } catch (error) {
        logger.error("Error fetching household data", { error });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: isAuthenticated && !!householdId,
    ...options,
  });
};

// Mutation hooks
export const useCreateHousehold = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<HouseholdWithMembers>,
      Error,
      CreateHouseholdDTO
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  const setActiveHouseholdMutation = useSetActiveHousehold();

  return useMutation({
    mutationFn: async (data: CreateHouseholdDTO) => {
      try {
        const result = await householdApi.households.createHousehold(data);
        logger.info("Household created", {
          householdId: result.data.id,
          name: result.data.name,
        });
        return result;
      } catch (error) {
        logger.error("Error creating household", { error });
        throw error;
      }
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.userHouseholds(),
      });
      // Set as active household after creation using the mutation
      await setActiveHouseholdMutation.mutateAsync(response.data.id);
    },
    ...options,
  });
};

export const useUpdateHousehold = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<HouseholdWithMembers>,
      Error,
      UpdateHouseholdVars
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, data }: UpdateHouseholdVars) => {
      try {
        const result = await householdApi.households.updateHousehold(
          householdId,
          data
        );
        logger.info("Household updated", {
          householdId,
          updatedFields: Object.keys(data),
        });
        return result;
      } catch (error) {
        logger.error("Error updating household", { error });
        throw error;
      }
    },
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.detail(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: householdKeys.userHouseholds(),
      });
    },
    ...options,
  });
};

export const useDeleteHousehold = (
  options?: Omit<
    UseMutationOptions<ApiResponse<void>, Error, string>,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  const { data: userData } = useUser();
  const setActiveHouseholdMutation = useSetActiveHousehold();

  return useMutation({
    mutationFn: async (householdId: string) => {
      try {
        const result = await householdApi.households.deleteHousehold(
          householdId
        );
        logger.info("Household deleted", {
          householdId,
          timestamp: new Date().toISOString(),
        });
        return result;
      } catch (error) {
        logger.error("Failed to delete household", { error, householdId });
        throw error;
      }
    },
    onSuccess: async (_, householdId) => {
      // If deleted household was active, clear active household
      if (userData?.data?.activeHouseholdId === householdId) {
        await setActiveHouseholdMutation.mutateAsync(null);
      }
      queryClient.removeQueries({
        queryKey: householdKeys.detail(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: householdKeys.userHouseholds(),
      });
    },
    ...options,
  });
};

// Member mutations
export const useUpdateHouseholdMember = (
  householdId: string,
  options?: Omit<
    UseMutationOptions<
      ApiResponse<void>,
      Error,
      {
        memberId: string;
        data: {
          role?: HouseholdRole;
          leftAt?: Date;
          nickname?: string;
          isSelected?: boolean;
        };
      }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, data }) => {
      try {
        const result = await householdApi.households.updateMember(
          householdId,
          memberId,
          data
        );
        logger.info("Member updated", {
          householdId,
          memberId,
          updatedFields: Object.keys(data),
        });
        return result;
      } catch (error) {
        logger.error("Failed to update member", { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.detail(householdId),
      });
    },
    ...options,
  });
};

export const useSendHouseholdInvitation = (
  householdId: string,
  options?: Omit<
    UseMutationOptions<ApiResponse<void>, Error, { email: string }>,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email }) => {
      try {
        const result = await householdApi.households.sendInvitation(
          householdId,
          email
        );
        logger.info("Invitation sent", {
          householdId,
          email,
        });
        return result;
      } catch (error) {
        logger.error("Failed to send invitation", { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.detail(householdId),
      });
    },
    ...options,
  });
};
