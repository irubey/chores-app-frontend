// src/hooks/households/useHouseholds.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  householdApi,
  householdKeys,
} from "@/lib/api/services/householdService";
import { logger } from "@/lib/api/logger";
import type {
  HouseholdWithMembers,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  HouseholdMember,
  AddMemberDTO,
} from "@shared/types";
import type { ApiRequestOptions } from "@/lib/api/utils/apiUtils";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { useAuthUser, useIsAuthenticated } from "@/contexts/UserContext";

// Types
interface UpdateHouseholdVars {
  householdId: string;
  data: UpdateHouseholdDTO;
}

interface RemoveMemberVars {
  householdId: string;
  memberId: string;
}

interface AddMemberVars {
  householdId: string;
  data: AddMemberDTO;
}

// List hooks
export const useUserHouseholds = (
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
        logger.debug("User households fetched", {
          count: result.data.length,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch user households", { error });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: isAuthenticated,
    ...options,
  });
};

export const usePendingInvitations = (
  options?: Omit<
    UseQueryOptions<ApiResponse<HouseholdWithMembers[]>>,
    "queryKey" | "queryFn"
  >
) => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: householdKeys.invitations(),
    queryFn: async () => {
      try {
        const result = await householdApi.households.getPendingInvitations();
        logger.debug("Pending invitations fetched", {
          count: result.data.length,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch pending invitations", { error });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: isAuthenticated,
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
): UseMutationResult<
  ApiResponse<HouseholdWithMembers>,
  Error,
  CreateHouseholdDTO
> => {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.userHouseholds(),
      });
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
): UseMutationResult<
  ApiResponse<HouseholdWithMembers>,
  Error,
  UpdateHouseholdVars
> => {
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
): UseMutationResult<ApiResponse<void>, Error, string> => {
  const queryClient = useQueryClient();

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
    onSuccess: (_, householdId) => {
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

// Members hooks
export const useHouseholdMembers = (
  householdId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<HouseholdMember[]>>,
    "queryKey" | "queryFn"
  >
) => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: householdKeys.members(householdId),
    queryFn: async () => {
      try {
        const result = await householdApi.households.getMembers(householdId);
        logger.debug("Household members fetched", {
          householdId,
          totalMembers: result.data.length,
          invitedCount: result.data.filter((m) => m.isInvited).length,
          acceptedCount: result.data.filter((m) => m.isAccepted).length,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch household members", {
          error,
          householdId,
        });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: isAuthenticated && !!householdId,
    ...options,
  });
};

export const useAddMember = (
  options?: Omit<
    UseMutationOptions<ApiResponse<HouseholdMember>, Error, AddMemberVars>,
    "mutationFn"
  >
): UseMutationResult<ApiResponse<HouseholdMember>, Error, AddMemberVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, data }: AddMemberVars) => {
      try {
        const result = await householdApi.households.addMember(
          householdId,
          data
        );
        logger.info("Member added", {
          householdId,
          email: data.email,
        });
        return result;
      } catch (error) {
        logger.error("Error adding member", { error });
        throw error;
      }
    },
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.members(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: householdKeys.detail(householdId),
      });
    },
    ...options,
  });
};

export const useRemoveMember = (
  options?: Omit<
    UseMutationOptions<ApiResponse<void>, Error, RemoveMemberVars>,
    "mutationFn"
  >
): UseMutationResult<ApiResponse<void>, Error, RemoveMemberVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, memberId }: RemoveMemberVars) => {
      try {
        const result = await householdApi.households.removeMember(
          householdId,
          memberId
        );
        logger.info("Member removed", {
          householdId,
          memberId,
        });
        return result;
      } catch (error) {
        logger.error("Error removing member", { error });
        throw error;
      }
    },
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.members(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: householdKeys.detail(householdId),
      });
    },
    ...options,
  });
};

export const useSendInvitation = (
  options?: Omit<
    UseMutationOptions<ApiResponse<void>, Error, AddMemberVars>,
    "mutationFn"
  >
): UseMutationResult<ApiResponse<void>, Error, AddMemberVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, data }: AddMemberVars) => {
      try {
        const result = await householdApi.households.sendInvitation(
          householdId,
          data.email
        );
        logger.info("Invitation sent", {
          householdId,
          email: data.email,
        });
        return result;
      } catch (error) {
        logger.error("Error sending invitation", { error });
        throw error;
      }
    },
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.members(householdId),
      });
    },
    ...options,
  });
};
