// src/hooks/households/useHouseholds.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { householdApi, householdKeys } from "@/lib/api";
import { logger } from "@/lib/api/logger";
import type {
  HouseholdWithMembers,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  HouseholdMember,
  HouseholdMemberWithUser,
} from "@shared/types";
import type { PaginationOptions, PaginationMeta } from "@shared/interfaces";
import { CACHE_TIMES, STALE_TIMES } from "@/lib/api/utils/apiUtils";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { useAuthUser } from "@/contexts/UserContext";

// Types
interface QueryHouseholdsResult extends ApiResponse<HouseholdWithMembers[]> {}

interface UpdateHouseholdVars {
  id: string;
  data: UpdateHouseholdDTO;
}

interface UpdateMemberVars {
  householdId: string;
  memberId: string;
  data: Partial<HouseholdMember>;
}

interface SendInvitationVars {
  householdId: string;
  email: string;
}

interface UpdateSelectionVars {
  householdId: string;
  isSelected: boolean;
}

// List hook
export const useHouseholds = (
  params?: PaginationOptions,
  options?: Omit<UseQueryOptions<QueryHouseholdsResult>, "queryKey" | "queryFn">
) => {
  const user = useAuthUser();

  return useQuery({
    queryKey: householdKeys.list(params),
    queryFn: async () => {
      try {
        const result = await householdApi.households.list({ params });
        logger.debug("Households data fetched", {
          count: result.data.length,
          hasPagination: !!result.pagination,
          params,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch households", { error });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: !!user,
    ...options,
  });
};

// Detail hook
export const useHousehold = (
  id: string,
  options?: Omit<UseQueryOptions<HouseholdWithMembers>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: householdKeys.detail(id),
    queryFn: async () => {
      try {
        const result = await householdApi.households.get(id);
        logger.debug("Household data fetched", {
          householdId: id,
          memberCount: result.data.members?.length ?? 0,
        });
        return result.data;
      } catch (error) {
        logger.error("Error fetching household data", { error });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: !!id,
    ...options,
  });
};

// Mutation hooks
export const useCreateHousehold = (
  options?: Omit<
    UseMutationOptions<HouseholdWithMembers, Error, CreateHouseholdDTO>,
    "mutationFn"
  >
): UseMutationResult<HouseholdWithMembers, Error, CreateHouseholdDTO> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHouseholdDTO) => {
      try {
        const result = await householdApi.households.create(data);
        logger.info("Household created", {
          householdId: result.data.id,
          name: result.data.name,
          currency: result.data.currency,
          timezone: result.data.timezone,
        });
        return result.data;
      } catch (error) {
        logger.error("Error creating household", { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
    ...options,
  });
};

export const useUpdateHousehold = (
  options?: Omit<
    UseMutationOptions<HouseholdWithMembers, Error, UpdateHouseholdVars>,
    "mutationFn"
  >
): UseMutationResult<HouseholdWithMembers, Error, UpdateHouseholdVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateHouseholdVars) => {
      try {
        const result = await householdApi.households.update(id, data);
        logger.info("Household updated", {
          householdId: id,
          ...data,
        });
        return result.data;
      } catch (error) {
        logger.error("Error updating household", { error });
        throw error;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: householdKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
    ...options,
  });
};

export const useDeleteHousehold = (
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">
): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await householdApi.households.delete(id);
        logger.info("Household deleted", {
          householdId: id,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error("Failed to delete household", { error, householdId: id });
        throw error;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: householdKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
    ...options,
  });
};

// Members hooks
export const useHouseholdMembers = (
  householdId: string,
  params?: PaginationOptions,
  options?: Omit<
    UseQueryOptions<ApiResponse<HouseholdMember[]>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: householdKeys.membersList(householdId, params),
    queryFn: async () => {
      try {
        const result = await householdApi.members.list(householdId, { params });
        logger.debug("Household members data fetched", {
          householdId,
          totalMembers: result.data.length,
          invitedCount: result.data.filter((m) => m.isInvited).length,
          acceptedCount: result.data.filter((m) => m.isAccepted).length,
          pagination: result.pagination,
        });
        return result;
      } catch (error) {
        logger.error("Failed to fetch household members", {
          error,
          householdId,
          params,
        });
        throw error;
      }
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
    enabled: !!householdId,
    ...options,
  });
};

export const useUpdateHouseholdMember = (
  options?: Omit<
    UseMutationOptions<HouseholdMember, Error, UpdateMemberVars>,
    "mutationFn"
  >
): UseMutationResult<HouseholdMember, Error, UpdateMemberVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, memberId, data }: UpdateMemberVars) => {
      try {
        const result = await householdApi.members.update(
          householdId,
          memberId,
          data
        );
        logger.info("Member updated", {
          householdId,
          memberId,
          ...data,
        });
        return result.data;
      } catch (error) {
        logger.error("Error updating member", { error });
        throw error;
      }
    },
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.detail(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: householdKeys.membersList(householdId),
      });
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
    ...options,
  });
};

export const useSendHouseholdInvitation = (
  options?: Omit<
    UseMutationOptions<HouseholdMemberWithUser, Error, SendInvitationVars>,
    "mutationFn"
  >
): UseMutationResult<HouseholdMemberWithUser, Error, SendInvitationVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, email }: SendInvitationVars) => {
      try {
        const result = await householdApi.invitations.send(
          householdId,
          email,
          {}
        );
        logger.info("Invitation sent", {
          householdId,
          email,
        });
        return result.data;
      } catch (error) {
        logger.error("Error sending invitation", { error });
        throw error;
      }
    },
    onSuccess: (data, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.membersList(householdId),
      });
    },
    ...options,
  });
};

export const useUpdateHouseholdMemberSelection = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<HouseholdMemberWithUser>,
      Error,
      UpdateSelectionVars
    >,
    "mutationFn"
  >
): UseMutationResult<
  ApiResponse<HouseholdMemberWithUser>,
  Error,
  UpdateSelectionVars
> => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, isSelected }: UpdateSelectionVars) => {
      try {
        const result = await householdApi.households.updateHouseholdSelection(
          householdId,
          user?.id || "",
          isSelected,
          {}
        );
        logger.info("Household selection updated", {
          householdId,
          isSelected,
        });
        return result;
      } catch (error) {
        logger.error("Failed to update household selection", {
          error,
          householdId,
          isSelected,
        });
        throw error;
      }
    },
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.detail(householdId),
      });
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
    ...options,
  });
};
