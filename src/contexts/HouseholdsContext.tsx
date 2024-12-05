import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  PropsWithChildren,
} from "react";
import {
  HouseholdWithMembers,
  HouseholdMember,
  HouseholdMemberWithUser,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { apiClient } from "@/lib/api/apiClient";
import { logger } from "@/lib/api/logger";
import { useAuth } from "@/hooks/useAuth";
import { requestManager } from "@/lib/api/requestManager";

interface HouseholdsContextState {
  userHouseholds: HouseholdWithMembers[];
  selectedHouseholds: HouseholdWithMembers[];
  selectedMembers: HouseholdMemberWithUser[];
  currentHousehold: HouseholdWithMembers | null;
  members: HouseholdMember[];
  pendingInvitations: HouseholdMemberWithUser[];
  error: Error | null;
  status: {
    list: "idle" | "loading" | "succeeded" | "failed";
    create: "idle" | "loading" | "succeeded" | "failed";
    update: "idle" | "loading" | "succeeded" | "failed";
    delete: "idle" | "loading" | "succeeded" | "failed";
    member: "idle" | "loading" | "succeeded" | "failed";
    invitation: "idle" | "loading" | "succeeded" | "failed";
  };
}

interface HouseholdsContextValue extends HouseholdsContextState {
  isLoading: boolean;
  getUserHouseholds: () => Promise<HouseholdWithMembers[] | undefined>;
  getSelectedHouseholds: () => Promise<HouseholdWithMembers[] | undefined>;
  createHousehold: (data: CreateHouseholdDTO) => Promise<void>;
  updateHousehold: (
    householdId: string,
    data: UpdateHouseholdDTO
  ) => Promise<void>;
  deleteHousehold: (householdId: string) => Promise<void>;
  addMember: (householdId: string, data: AddMemberDTO) => Promise<void>;
  removeMember: (householdId: string, memberId: string) => Promise<void>;
  updateMemberRole: (
    householdId: string,
    memberId: string,
    role: HouseholdRole
  ) => Promise<void>;
  updateMemberSelection: (
    householdId: string,
    memberId: string,
    isSelected: boolean
  ) => Promise<void>;
  handleInvitationResponse: (
    householdId: string,
    memberId: string,
    accept: boolean
  ) => Promise<void>;
  sendInvitation: (
    householdId: string,
    email: string
  ) => Promise<{ isPending: boolean }>;
  getInvitations: () => Promise<void>;
  setCurrentHousehold: (household: HouseholdWithMembers) => void;
  reset: () => void;
}

const HouseholdsContext = createContext<HouseholdsContextValue | undefined>(
  undefined
);

export const HouseholdsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, status: authStatus, user } = useAuth();
  const [state, setState] = useState<HouseholdsContextState>({
    userHouseholds: [],
    selectedHouseholds: [],
    selectedMembers: [],
    currentHousehold: null,
    members: [],
    pendingInvitations: [],
    error: null,
    status: {
      list: "idle",
      create: "idle",
      update: "idle",
      delete: "idle",
      member: "idle",
      invitation: "idle",
    },
  });

  const mountIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const isActiveProviderRef = useRef(true);
  const isInitializedRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void>>();

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      userHouseholds: [],
      selectedHouseholds: [],
      selectedMembers: [],
      currentHousehold: null,
      members: [],
      pendingInvitations: [],
      error: null,
      status: {
        list: "idle",
        create: "idle",
        update: "idle",
        delete: "idle",
        member: "idle",
        invitation: "idle",
      },
    }));
    isInitializedRef.current = false;
  }, []);

  const dedupRequest = useCallback(
    async <T,>(key: string, request: () => Promise<T>): Promise<T> => {
      if (!isAuthenticated || authStatus === "loading" || !user) {
        logger.debug("Skipping request - auth not ready", {
          key,
          authStatus,
          isAuthenticated,
          hasUser: !!user,
          mountId: mountIdRef.current,
        });
        return Promise.reject(new Error("Auth not ready"));
      }

      if (!isActiveProviderRef.current) {
        logger.debug("Skipping request - provider not active", {
          key,
          mountId: mountIdRef.current,
        });
        return Promise.reject(new Error("Provider not active"));
      }

      return requestManager.dedupRequest(key, request, {
        requiresAuth: true,
        timeout: 5000,
        retry: {
          retries: 2,
          backoff: true,
        },
      });
    },
    [isAuthenticated, authStatus, user]
  );

  const setStatus = useCallback(
    (
      key: keyof HouseholdsContextState["status"],
      value: "idle" | "loading" | "succeeded" | "failed"
    ) => {
      setState((prev) => ({
        ...prev,
        status: { ...prev.status, [key]: value },
      }));
    },
    []
  );

  const getUserHouseholds = useCallback(async () => {
    return dedupRequest("getUserHouseholds", async () => {
      try {
        setStatus("list", "loading");
        const [householdsRes, invitationsRes] = await Promise.all([
          apiClient.households.getUserHouseholds(),
          apiClient.households.invitations.getInvitations(),
        ]);

        if (!isActiveProviderRef.current) return;

        logger.debug("Raw API response", {
          households: householdsRes.data,
          invitations: invitationsRes.data,
        });

        setState((prev) => ({
          ...prev,
          userHouseholds: householdsRes.data,
          pendingInvitations: invitationsRes.data,
          status: { ...prev.status, list: "succeeded" },
        }));

        return householdsRes.data;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          logger.debug("Households request aborted");
          return;
        }
        logger.error("Failed to load households", { error });

        if (isActiveProviderRef.current) {
          setState((prev) => ({
            ...prev,
            error: error as Error,
            status: { ...prev.status, list: "failed" },
          }));
        }
        throw error;
      }
    });
  }, [dedupRequest, setStatus]);

  const getSelectedHouseholds = useCallback(async () => {
    return dedupRequest("getSelectedHouseholds", async () => {
      try {
        setStatus("list", "loading");
        const response = await apiClient.households.getSelectedHouseholds();

        if (!isActiveProviderRef.current) return;

        logger.debug("Selected households response", {
          data: response.data,
        });

        // Transform selected members into households
        const selectedHouseholds = response.data.reduce(
          (acc: HouseholdWithMembers[], member) => {
            if (!member.isSelected) return acc;

            // Find the household in userHouseholds
            const household = state.userHouseholds.find(
              (h) => h.id === member.householdId
            );
            if (!household) return acc;

            // Check if we already have this household
            const existingIndex = acc.findIndex((h) => h.id === household.id);
            if (existingIndex >= 0) {
              // Add member to existing household
              acc[existingIndex].members.push(member);
            } else {
              // Create new household entry
              acc.push({
                ...household,
                members: [member],
              });
            }

            return acc;
          },
          []
        );

        logger.debug("Transformed selected households", {
          householdCount: selectedHouseholds.length,
          memberCount: response.data.filter((m) => m.isSelected).length,
          households: selectedHouseholds.map((h) => ({
            id: h.id,
            name: h.name,
            memberCount: h.members?.length || 0,
          })),
        });

        setState((prev) => ({
          ...prev,
          selectedHouseholds,
          selectedMembers: response.data.filter((member) => member.isSelected),
          status: { ...prev.status, list: "succeeded" },
        }));

        return selectedHouseholds;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          logger.debug("Selected households request aborted");
          return;
        }
        setStatus("list", "failed");
        throw error;
      }
    });
  }, [dedupRequest, setStatus, state.userHouseholds]);

  // Initialize households data
  useEffect(() => {
    isActiveProviderRef.current = true;

    logger.debug("Households provider mounted", {
      mountId: mountIdRef.current,
      authStatus,
      isAuthenticated,
      hasUser: !!user,
    });

    const initialize = async () => {
      if (!isAuthenticated || authStatus === "loading" || !user) {
        logger.debug("Skipping initialization - auth not ready", {
          mountId: mountIdRef.current,
          authStatus,
          isAuthenticated,
          hasUser: !!user,
        });
        return;
      }

      if (isInitializedRef.current) {
        logger.debug("Skipping initialization - already initialized", {
          mountId: mountIdRef.current,
        });
        return;
      }

      try {
        logger.debug("Starting households initialization", {
          mountId: mountIdRef.current,
        });

        const [households, invitations] = await Promise.all([
          apiClient.households.getUserHouseholds(),
          apiClient.households.invitations.getInvitations(),
        ]);

        if (!isActiveProviderRef.current) {
          logger.debug("Initialization aborted - provider not active", {
            mountId: mountIdRef.current,
          });
          return;
        }

        setState((prev) => ({
          ...prev,
          userHouseholds: households.data,
          pendingInvitations: invitations.data,
          status: { ...prev.status, list: "succeeded" },
        }));

        const selectedResponse =
          await apiClient.households.getSelectedHouseholds();

        if (!isActiveProviderRef.current) {
          logger.debug(
            "Selected households request aborted - provider not active",
            {
              mountId: mountIdRef.current,
            }
          );
          return;
        }

        const selectedHouseholds = selectedResponse.data.reduce(
          (acc: HouseholdWithMembers[], member) => {
            if (!member.isSelected) return acc;
            const household = households.data.find(
              (h) => h.id === member.householdId
            );
            if (!household) return acc;
            const existingIndex = acc.findIndex((h) => h.id === household.id);
            if (existingIndex >= 0) {
              acc[existingIndex].members.push(member);
            } else {
              acc.push({ ...household, members: [member] });
            }
            return acc;
          },
          []
        );

        setState((prev) => ({
          ...prev,
          selectedHouseholds,
          selectedMembers: selectedResponse.data.filter(
            (member) => member.isSelected
          ),
        }));

        isInitializedRef.current = true;
        logger.debug("Households initialization complete", {
          mountId: mountIdRef.current,
          householdsCount: households.data.length,
          selectedCount: selectedHouseholds.length,
        });
      } catch (error) {
        if (!isActiveProviderRef.current) return;

        logger.error("Failed to initialize households", {
          error,
          mountId: mountIdRef.current,
        });

        setState((prev) => ({
          ...prev,
          error: error as Error,
          status: { ...prev.status, list: "failed" },
        }));
      }
    };

    initialize();

    return () => {
      logger.debug("Cleaning up households context", {
        mountId: mountIdRef.current,
      });
      isActiveProviderRef.current = false;
      requestManager.abortAll();
    };
  }, [isAuthenticated, authStatus, user]);

  // Handle auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      logger.debug("Resetting households state - auth changed", {
        mountId: mountIdRef.current,
      });
      reset();
      requestManager.abortAll();
    }
  }, [isAuthenticated, reset]);

  const createHousehold = async (data: CreateHouseholdDTO) => {
    try {
      setStatus("create", "loading");
      await apiClient.households.createHousehold(data);
      await getUserHouseholds();
      setStatus("create", "succeeded");
    } catch (error) {
      setStatus("create", "failed");
      throw error;
    }
  };

  const updateHousehold = async (
    householdId: string,
    data: UpdateHouseholdDTO
  ) => {
    try {
      setStatus("update", "loading");
      await apiClient.households.updateHousehold(householdId, data);
      await getUserHouseholds();
      setStatus("update", "succeeded");
    } catch (error) {
      setStatus("update", "failed");
      throw error;
    }
  };

  const deleteHousehold = async (householdId: string) => {
    try {
      setStatus("delete", "loading");
      await apiClient.households.deleteHousehold(householdId);
      await getUserHouseholds();
      setStatus("delete", "succeeded");
    } catch (error) {
      setStatus("delete", "failed");
      throw error;
    }
  };

  const addMember = async (householdId: string, data: AddMemberDTO) => {
    try {
      setStatus("member", "loading");
      await apiClient.households.members.addMember(householdId, data);
      await getUserHouseholds();
      setStatus("member", "succeeded");
    } catch (error) {
      setStatus("member", "failed");
      throw error;
    }
  };

  const removeMember = async (householdId: string, memberId: string) => {
    try {
      setStatus("member", "loading");
      await apiClient.households.members.removeMember(householdId, memberId);
      await getUserHouseholds();
      setStatus("member", "succeeded");
    } catch (error) {
      setStatus("member", "failed");
      throw error;
    }
  };

  const updateMemberRole = async (
    householdId: string,
    memberId: string,
    role: HouseholdRole
  ) => {
    try {
      setStatus("member", "loading");
      await apiClient.households.members.updateMemberRole(
        householdId,
        memberId,
        role
      );
      await getUserHouseholds();
      setStatus("member", "succeeded");
    } catch (error) {
      setStatus("member", "failed");
      throw error;
    }
  };

  const updateMemberSelection = async (
    householdId: string,
    memberId: string,
    isSelected: boolean
  ) => {
    try {
      setStatus("member", "loading");
      await apiClient.households.members.updateSelection(
        householdId,
        memberId,
        isSelected
      );
      await getUserHouseholds();
      setStatus("member", "succeeded");
    } catch (error) {
      setStatus("member", "failed");
      throw error;
    }
  };

  const handleInvitationResponse = async (
    householdId: string,
    memberId: string,
    accept: boolean
  ) => {
    try {
      setStatus("invitation", "loading");
      await apiClient.households.invitations.updateMemberInvitationStatus(
        householdId,
        memberId,
        accept
      );
      await getUserHouseholds();
      setStatus("invitation", "succeeded");
    } catch (error) {
      setStatus("invitation", "failed");
      throw error;
    }
  };

  const sendInvitation = async (
    householdId: string,
    email: string
  ): Promise<{ isPending: boolean }> => {
    try {
      setStatus("invitation", "loading");
      await apiClient.households.invitations.sendInvitation(householdId, email);
      await getUserHouseholds();
      setStatus("invitation", "succeeded");
      return { isPending: true };
    } catch (error) {
      setStatus("invitation", "failed");
      throw error;
    }
  };

  const getInvitations = async () => {
    try {
      setStatus("invitation", "loading");
      const response = await apiClient.households.invitations.getInvitations();
      setState((prev) => ({
        ...prev,
        pendingInvitations: response.data as HouseholdMemberWithUser[],
        status: { ...prev.status, invitation: "succeeded" },
      }));
    } catch (error) {
      setStatus("invitation", "failed");
      throw error;
    }
  };

  const setCurrentHousehold = (household: HouseholdWithMembers) => {
    setState((prev) => ({ ...prev, currentHousehold: household }));
  };

  const value: HouseholdsContextValue = {
    ...state,
    isLoading:
      state.status.list === "loading" ||
      state.status.create === "loading" ||
      state.status.update === "loading" ||
      state.status.delete === "loading" ||
      state.status.member === "loading" ||
      state.status.invitation === "loading",
    getUserHouseholds,
    getSelectedHouseholds,
    createHousehold,
    updateHousehold,
    deleteHousehold,
    addMember,
    removeMember,
    updateMemberRole,
    updateMemberSelection,
    handleInvitationResponse,
    sendInvitation,
    getInvitations,
    setCurrentHousehold,
    reset,
  };

  return (
    <HouseholdsContext.Provider value={value}>
      {children}
    </HouseholdsContext.Provider>
  );
};

export const useHouseholds = () => {
  const context = useContext(HouseholdsContext);
  if (context === undefined) {
    throw new Error("useHouseholds must be used within a HouseholdsProvider");
  }
  return context;
};
