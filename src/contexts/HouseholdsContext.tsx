import React, { createContext, useContext, useState, useEffect } from "react";
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
  getUserHouseholds: () => Promise<void>;
  getSelectedHouseholds: () => Promise<void>;
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

  const setStatus = (
    key: keyof HouseholdsContextState["status"],
    value: "idle" | "loading" | "succeeded" | "failed"
  ) => {
    setState((prev) => ({
      ...prev,
      status: { ...prev.status, [key]: value },
    }));
  };

  const getUserHouseholds = async () => {
    try {
      setStatus("list", "loading");
      const [householdsRes, invitationsRes] = await Promise.all([
        apiClient.households.getUserHouseholds(),
        apiClient.households.invitations.getInvitations(),
      ]);

      logger.debug("Raw pending invitations", {
        count: invitationsRes.data.length,
        invitations: invitationsRes.data.map((inv) => ({
          id: inv.id,
          hasHousehold: !!inv.household,
        })),
      });

      setState((prev) => ({
        ...prev,
        userHouseholds: householdsRes.data,
        pendingInvitations: invitationsRes.data,
        status: { ...prev.status, list: "succeeded" },
      }));
    } catch (error) {
      logger.error("Failed to load households", { error });
      setState((prev) => ({
        ...prev,
        error: error as Error,
        status: { ...prev.status, list: "failed" },
      }));
    }
  };

  const getSelectedHouseholds = async () => {
    try {
      setStatus("list", "loading");
      const response = await apiClient.households.getSelectedHouseholds();
      setState((prev) => ({
        ...prev,
        selectedHouseholds: response.data as unknown as HouseholdWithMembers[],
        status: { ...prev.status, list: "succeeded" },
      }));
    } catch (error) {
      setStatus("list", "failed");
      throw error;
    }
  };

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
      const response = await apiClient.households.invitations.sendInvitation(
        householdId,
        email
      );
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

  const reset = () => {
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
  };

  useEffect(() => {
    getUserHouseholds();
  }, []);

  const value: HouseholdsContextValue = {
    ...state,
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
