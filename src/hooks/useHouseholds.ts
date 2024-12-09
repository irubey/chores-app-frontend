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

// List hook
export const useHouseholds = (
  params?: PaginationOptions,
  options?: Omit<UseQueryOptions<QueryHouseholdsResult>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: householdKeys.list(params),
    queryFn: async () => {
      const result = await householdApi.households.list({ params });
      logger.debug("Households data fetched", {
        count: result.data.length,
        hasPagination: !!result.pagination,
        params,
      });
      return result;
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
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
      const result = await householdApi.households.get(id);
      logger.debug("Household data fetched", {
        householdId: id,
        memberCount: result.members.length,
      });
      return result;
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
      const result = await householdApi.households.create(data);
      logger.info("Household created", {
        householdId: result.id,
        name: result.name,
        currency: result.currency,
        timezone: result.timezone,
      });
      return result;
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
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateHouseholdVars) => {
      const result = await householdApi.households.update(id, data);
      logger.info("Household updated", {
        householdId: id,
        updatedFields: Object.keys(data),
        newName: data.name,
        newCurrency: data.currency,
        newTimezone: data.timezone,
      });
      return result;
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
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await householdApi.households.delete(id);
      logger.info("Household deleted", {
        householdId: id,
        timestamp: new Date().toISOString(),
      });
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
      const result = await householdApi.members.list(householdId, { params });
      logger.debug("Household members data fetched", {
        householdId,
        totalMembers: result.data.length,
        invitedCount: result.data.filter((m) => m.isInvited).length,
        acceptedCount: result.data.filter((m) => m.isAccepted).length,
        pagination: result.pagination,
      });
      return result;
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
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, memberId, data }: UpdateMemberVars) => {
      const result = await householdApi.members.update(
        householdId,
        memberId,
        data
      );
      logger.info("Household member updated", {
        householdId,
        memberId,
        updatedFields: Object.keys(data),
        newRole: data.role,
        newStatus: {
          isInvited: data.isInvited,
          isAccepted: data.isAccepted,
          isRejected: data.isRejected,
        },
      });
      return result;
    },
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.membersList(householdId),
      });
    },
    ...options,
  });
};

// Invitation hooks
export const useSendHouseholdInvitation = (
  options?: Omit<
    UseMutationOptions<HouseholdMember, Error, SendInvitationVars>,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, email }: SendInvitationVars) => {
      const result = await householdApi.invitations.send(householdId, email);
      logger.info("Household invitation sent", {
        householdId,
        memberId: result.id,
        emailDomain: email.split("@")[1],
        role: result.role,
        timestamp: new Date().toISOString(),
      });
      return result;
    },
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: householdKeys.membersList(householdId),
      });
    },
    ...options,
  });
};
