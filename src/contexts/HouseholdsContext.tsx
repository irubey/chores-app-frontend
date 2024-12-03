import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  Household,
  HouseholdMember,
  HouseholdMemberWithUser,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  HouseholdWithMembers,
} from "@shared/types";
import { apiClient } from "@/lib/api/apiClient";
import { ApiError } from "@/lib/api/errors";
import { logger } from "@/lib/api/logger";
import { HouseholdRole } from "@shared/enums";
import { useAuth } from "@/hooks/useAuth";
import { ApiResponse } from "@shared/interfaces";

interface HouseholdState {
  userHouseholds: HouseholdWithMembers[];
  selectedHouseholds: HouseholdWithMembers[];
  selectedMembers: HouseholdMemberWithUser[];
  currentHousehold: HouseholdWithMembers | null;
  members: HouseholdMember[];
  status: {
    list: "idle" | "loading" | "succeeded" | "failed";
    create: "idle" | "loading" | "succeeded" | "failed";
    update: "idle" | "loading" | "succeeded" | "failed";
    delete: "idle" | "loading" | "succeeded" | "failed";
    member: "idle" | "loading" | "succeeded" | "failed";
    invitation: "idle" | "loading" | "succeeded" | "failed";
  };
  error: string | null;
}

type HouseholdAction =
  | { type: "SET_LOADING"; payload: keyof HouseholdState["status"] }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_USER_HOUSEHOLDS"; payload: HouseholdWithMembers[] }
  | { type: "SET_SELECTED_HOUSEHOLDS"; payload: HouseholdMemberWithUser[] }
  | { type: "SET_CURRENT_HOUSEHOLD"; payload: HouseholdWithMembers }
  | { type: "SET_MEMBERS"; payload: HouseholdMember[] }
  | { type: "UPDATE_MEMBER"; payload: HouseholdMember }
  | { type: "ADD_MEMBER"; payload: HouseholdMember }
  | { type: "REMOVE_MEMBER"; payload: string }
  | { type: "RESET_STATE" }
  | {
      type: "INITIALIZE_HOUSEHOLDS";
      payload: {
        userHouseholds: HouseholdWithMembers[];
        selectedHouseholds: HouseholdWithMembers[];
        currentHousehold: HouseholdWithMembers | null;
        selectedMembers: HouseholdMemberWithUser[];
      };
    };

interface HouseholdContextType extends HouseholdState {
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
  acceptInvitation: (
    householdId: string,
    memberId: string,
    accept: boolean
  ) => Promise<void>;
  sendInvitation: (householdId: string, email: string) => Promise<void>;
  getInvitations: () => Promise<void>;
  setCurrentHousehold: (household: HouseholdWithMembers) => void;
  reset: () => void;
}

const initialState: HouseholdState = {
  userHouseholds: [],
  selectedHouseholds: [],
  selectedMembers: [],
  currentHousehold: null,
  members: [],
  status: {
    list: "idle",
    create: "idle",
    update: "idle",
    delete: "idle",
    member: "idle",
    invitation: "idle",
  },
  error: null,
};

const HouseholdsContext = createContext<HouseholdContextType | undefined>(
  undefined
);

function householdReducer(
  state: HouseholdState,
  action: HouseholdAction
): HouseholdState {
  logger.debug("Household state update", {
    actionType: action.type,
    currentState: {
      hasCurrentHousehold: !!state.currentHousehold,
      householdsCount: state.userHouseholds.length,
      selectedCount: state.selectedHouseholds.length,
      membersCount: state.members.length,
      status: state.status,
    },
  });

  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        status: {
          ...state.status,
          [action.payload]: "loading",
        },
        error: null,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "SET_USER_HOUSEHOLDS":
      return {
        ...state,
        userHouseholds: action.payload,
        status: {
          ...state.status,
          list: "succeeded",
        },
        error: null,
      };
    case "SET_SELECTED_HOUSEHOLDS":
      if (
        areArraysEqual(
          action.payload.map((m) => m.household).filter(Boolean),
          state.selectedHouseholds
        )
      ) {
        return state;
      }

      const selectedHouseholds = action.payload
        .map((member) => member.household)
        .filter((household): household is HouseholdWithMembers => !!household);

      return {
        ...state,
        selectedMembers: action.payload,
        selectedHouseholds,
        status: {
          ...state.status,
          list: "succeeded",
        },
        error: null,
      };
    case "SET_CURRENT_HOUSEHOLD":
      if (!action.payload || state.currentHousehold?.id === action.payload.id) {
        return state;
      }

      return {
        ...state,
        currentHousehold: action.payload,
      };
    case "SET_MEMBERS":
      return {
        ...state,
        members: action.payload,
        status: {
          ...state.status,
          member: "succeeded",
        },
        error: null,
      };
    case "UPDATE_MEMBER": {
      const updatedMember = action.payload;
      const updatedMembers = state.members.map((m) =>
        m.id === updatedMember.id ? updatedMember : m
      );

      // Update selected members atomically
      const selectedMembers = updatedMembers.filter((m) => m.isSelected);

      // Find the household for this member
      const household = state.userHouseholds.find((h) =>
        h.members.some((m) => m.id === updatedMember.id)
      );

      // Update selected households based on member selection
      const selectedHouseholds = household
        ? state.selectedHouseholds.filter((h) => h.id !== household.id)
        : state.selectedHouseholds;

      if (updatedMember.isSelected && household) {
        selectedHouseholds.push(household);
      }

      return {
        ...state,
        members: updatedMembers,
        selectedMembers,
        selectedHouseholds,
        currentHousehold:
          updatedMember.isSelected && household
            ? household
            : state.currentHousehold,
        status: {
          ...state.status,
          member: "succeeded",
        },
        error: null,
      };
    }
    case "ADD_MEMBER":
      return {
        ...state,
        members: [...state.members, action.payload],
      };
    case "REMOVE_MEMBER":
      return {
        ...state,
        members: state.members.filter((member) => member.id !== action.payload),
      };
    case "RESET_STATE":
      return initialState;
    case "INITIALIZE_HOUSEHOLDS": {
      const {
        userHouseholds,
        selectedHouseholds,
        currentHousehold,
        selectedMembers,
      } = action.payload;

      logger.debug("Processing INITIALIZE_HOUSEHOLDS action", {
        userHouseholdsCount: userHouseholds.length,
        selectedHouseholdsCount: selectedHouseholds.length,
        hasCurrentHousehold: !!currentHousehold,
        currentState: state,
        selectedHouseholdIds: selectedHouseholds.map((h) => h.id),
        userHouseholdIds: userHouseholds.map((h) => h.id),
        selectedMemberIds: selectedMembers.map((m) => m.id),
      });

      // Only update if we have newer data
      const hasNewerData =
        userHouseholds.length !== state.userHouseholds.length ||
        selectedHouseholds.length !== state.selectedHouseholds.length ||
        currentHousehold?.id !== state.currentHousehold?.id ||
        selectedMembers.length !== state.selectedMembers.length;

      if (!hasNewerData) {
        logger.debug("Skipping redundant household state update");
        return state;
      }

      // Update state with new data
      return {
        ...state,
        userHouseholds,
        selectedHouseholds,
        currentHousehold,
        selectedMembers,
        status: {
          ...state.status,
          list: "succeeded",
          create: "succeeded", // Also update create status
        },
        error: null,
      };
    }
    default:
      return state;
  }
}

export function HouseholdsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(householdReducer, initialState);
  const { status: authStatus, isAuthenticated, error: authError } = useAuth();
  const initializationRef = useRef<Promise<void> | null>(null);
  const requestInProgressRef = useRef<{ [key: string]: Promise<any> }>({});

  // Log state changes
  const dispatchWithLogging = (action: HouseholdAction) => {
    logger.debug("Dispatching household action", {
      type: action.type,
      currentState: {
        householdsCount: state.userHouseholds.length,
        selectedCount: state.selectedHouseholds.length,
        hasCurrentHousehold: !!state.currentHousehold,
        status: state.status,
        authStatus,
        isAuthenticated,
      },
    });
    dispatch(action);
  };

  // Handle auth errors
  useEffect(() => {
    logger.debug("Auth error effect running", {
      hasError: !!authError,
      authStatus,
      isAuthenticated,
      currentHouseholdStatus: state.status,
    });

    if (authError) {
      logger.error("Auth error in HouseholdsContext", {
        authError,
        authStatus,
        isAuthenticated,
        currentHouseholdStatus: state.status,
      });
      dispatchWithLogging({
        type: "SET_ERROR",
        payload: "Auth error: " + authError,
      });
    }
  }, [authError, authStatus, isAuthenticated, state.status]);

  const dedupRequest = useCallback(
    async <T,>(key: string, request: () => Promise<T>): Promise<T> => {
      if (requestInProgressRef.current[key]) {
        logger.debug("Using existing household request", {
          key,
          currentRequests: Object.keys(requestInProgressRef.current),
          authStatus,
          isAuthenticated,
        });
        return requestInProgressRef.current[key];
      }

      logger.debug("Starting new household request", {
        key,
        currentRequests: Object.keys(requestInProgressRef.current),
        authStatus,
        isAuthenticated,
      });
      requestInProgressRef.current[key] = request().finally(() => {
        logger.debug("Household request completed", {
          key,
          remainingRequests: Object.keys(requestInProgressRef.current).filter(
            (k) => k !== key
          ),
        });
        delete requestInProgressRef.current[key];
      });

      return requestInProgressRef.current[key];
    },
    [authStatus, isAuthenticated]
  );

  const getUserHouseholds = useCallback(async () => {
    try {
      logger.debug("Fetching user households");

      const [userHouseholds, selectedMembers] = await Promise.all([
        dedupRequest("households", () =>
          apiClient.households.getUserHouseholds().then((res) => res.data)
        ),
        dedupRequest("selectedHouseholds", () =>
          apiClient.households.getSelectedHouseholds().then((res) => res.data)
        ),
      ]);

      const selectedHouseholds = selectedMembers
        .map((member) => member.household)
        .filter((household): household is HouseholdWithMembers => !!household);

      const currentHousehold = selectedHouseholds[0] || null;

      // Only update state if data has changed
      const hasChanges =
        !areArraysEqual(state.userHouseholds, userHouseholds) ||
        !areArraysEqual(state.selectedHouseholds, selectedHouseholds) ||
        !areArraysEqual(state.selectedMembers, selectedMembers) ||
        state.currentHousehold?.id !== currentHousehold?.id;

      if (hasChanges) {
        dispatch({
          type: "INITIALIZE_HOUSEHOLDS",
          payload: {
            userHouseholds,
            selectedHouseholds,
            currentHousehold,
            selectedMembers,
          },
        });

        logger.info("Successfully loaded households", {
          userHouseholdsCount: userHouseholds.length,
          selectedHouseholdsCount: selectedHouseholds.length,
          hasCurrentHousehold: !!currentHousehold,
        });
      } else {
        logger.debug("Skipping state update - no changes detected", {
          userHouseholdsCount: userHouseholds.length,
          selectedHouseholdsCount: selectedHouseholds.length,
          hasCurrentHousehold: !!currentHousehold,
        });
      }
    } catch (error) {
      logger.error("Failed to load households", { error });
      throw error;
    }
  }, [
    dedupRequest,
    state.userHouseholds,
    state.selectedHouseholds,
    state.selectedMembers,
    state.currentHousehold,
  ]);

  const initialize = useCallback(async () => {
    if (state.status.list === "loading" || !isAuthenticated) {
      logger.debug("Skipping households initialization", {
        status: state.status.list,
        isAuthenticated,
        authStatus,
        hasInitRef: !!initializationRef.current,
      });
      return;
    }

    try {
      // Only dispatch loading if we don't have data yet
      if (state.userHouseholds.length === 0) {
        dispatchWithLogging({ type: "SET_LOADING", payload: "list" });
      }

      await getUserHouseholds();
      logger.info("Households initialized successfully", {
        authStatus,
        isAuthenticated,
        householdsCount: state.userHouseholds.length,
      });
    } catch (error) {
      logger.error("Failed to initialize households", {
        error,
        authStatus,
        isAuthenticated,
        currentStatus: state.status,
      });
      dispatchWithLogging({
        type: "SET_ERROR",
        payload:
          error instanceof ApiError
            ? error.message
            : "Failed to initialize households",
      });
    }
  }, [
    state.status.list,
    state.userHouseholds.length,
    isAuthenticated,
    getUserHouseholds,
    authStatus,
  ]);

  // Initialize households when auth is ready
  useEffect(() => {
    logger.debug("Households initialization effect running", {
      authStatus,
      isAuthenticated,
      hasInitRef: !!initializationRef.current,
      currentStatus: state.status,
      householdsCount: state.userHouseholds.length,
    });

    if (authStatus === "authenticated" && !initializationRef.current) {
      logger.debug("Starting households initialization", {
        authStatus,
        currentStatus: state.status,
      });

      // Store the initialization promise
      const initPromise = initialize().catch((error) => {
        logger.error("Failed to initialize households on mount", {
          error,
          authStatus,
          currentStatus: state.status,
        });
      });

      initializationRef.current = initPromise;

      // Clear the ref when initialization completes
      initPromise.finally(() => {
        if (initializationRef.current === initPromise) {
          initializationRef.current = null;
        }
      });
    }

    if (authStatus !== "authenticated") {
      logger.debug("Resetting households initialization", {
        authStatus,
        previousStatus: state.status,
        hadInitRef: !!initializationRef.current,
      });
      initializationRef.current = null;
      requestInProgressRef.current = {};
      dispatchWithLogging({ type: "RESET_STATE" });
    }

    return () => {
      logger.debug("Households initialization effect cleanup", {
        isHidden: document.hidden,
        hasInitRef: !!initializationRef.current,
        authStatus,
        currentStatus: state.status,
        requestsInProgress: Object.keys(requestInProgressRef.current),
      });
      // Only clear refs if component is unmounting
      if (!document.hidden) {
        initializationRef.current = null;
        requestInProgressRef.current = {};
      }
    };
  }, [authStatus, initialize, state.status, state.userHouseholds.length]);

  const getSelectedHouseholds = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: "list" });
      logger.debug("Fetching selected households");

      const response = await apiClient.households.getSelectedHouseholds();
      dispatch({ type: "SET_SELECTED_HOUSEHOLDS", payload: response.data });

      logger.info("Successfully fetched selected households", {
        count: response.data.length,
      });
    } catch (error) {
      logger.error("Failed to fetch selected households", { error });
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof ApiError
            ? error.message
            : "Failed to fetch selected households",
      });
      throw error;
    }
  }, []);

  const createHousehold = useCallback(
    async (data: CreateHouseholdDTO) => {
      try {
        dispatch({ type: "SET_LOADING", payload: "create" });
        logger.debug("Creating new household", { data });

        const response = await apiClient.households.createHousehold(data);

        // Get updated households and selected households in parallel
        const [userHouseholds, selectedMembers] = await Promise.all([
          apiClient.households.getUserHouseholds().then((res) => res.data),
          apiClient.households.getSelectedHouseholds().then((res) => res.data),
        ]);

        // Get selected households from members
        const selectedHouseholds = selectedMembers
          .map((member) => member.household)
          .filter(
            (household): household is HouseholdWithMembers => !!household
          );

        // Update state atomically with all new data
        dispatch({
          type: "INITIALIZE_HOUSEHOLDS",
          payload: {
            userHouseholds,
            selectedHouseholds,
            currentHousehold: selectedHouseholds[0] || null,
            selectedMembers,
          },
        });

        logger.info("Successfully created household", {
          householdId: response.data.id,
        });
      } catch (error) {
        logger.error("Failed to create household", { error, data });
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof ApiError
              ? error.message
              : "Failed to create household",
        });
        throw error;
      }
    },
    [] // Remove getUserHouseholds from deps since we're not using it anymore
  );

  const updateHousehold = useCallback(
    async (householdId: string, data: UpdateHouseholdDTO) => {
      try {
        dispatch({ type: "SET_LOADING", payload: "update" });
        logger.debug("Updating household", { householdId, data });

        const response = await apiClient.households.updateHousehold(
          householdId,
          data
        );
        await getUserHouseholds(); // Refresh the list after update

        logger.info("Successfully updated household", { householdId });
      } catch (error) {
        logger.error("Failed to update household", {
          error,
          householdId,
          data,
        });
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof ApiError
              ? error.message
              : "Failed to update household",
        });
        throw error;
      }
    },
    [getUserHouseholds]
  );

  const deleteHousehold = useCallback(
    async (householdId: string) => {
      try {
        dispatch({ type: "SET_LOADING", payload: "delete" });
        logger.debug("Deleting household", { householdId });

        await apiClient.households.deleteHousehold(householdId);
        await getUserHouseholds(); // Refresh the list after deletion

        logger.info("Successfully deleted household", { householdId });
      } catch (error) {
        logger.error("Failed to delete household", { error, householdId });
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof ApiError
              ? error.message
              : "Failed to delete household",
        });
        throw error;
      }
    },
    [getUserHouseholds]
  );

  const addMember = useCallback(
    async (householdId: string, data: AddMemberDTO) => {
      try {
        dispatch({ type: "SET_LOADING", payload: "member" });
        logger.debug("Adding member to household", { householdId, data });

        const response = await apiClient.households.members.addMember(
          householdId,
          data
        );
        dispatch({ type: "ADD_MEMBER", payload: response.data });

        logger.info("Successfully added member", {
          householdId,
          memberId: response.data.id,
        });
      } catch (error) {
        logger.error("Failed to add member", { error, householdId, data });
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof ApiError ? error.message : "Failed to add member",
        });
        throw error;
      }
    },
    []
  );

  const removeMember = useCallback(
    async (householdId: string, memberId: string) => {
      try {
        dispatch({ type: "SET_LOADING", payload: "member" });
        logger.debug("Removing member from household", {
          householdId,
          memberId,
        });

        await apiClient.households.members.removeMember(householdId, memberId);
        dispatch({ type: "REMOVE_MEMBER", payload: memberId });

        logger.info("Successfully removed member", { householdId, memberId });
      } catch (error) {
        logger.error("Failed to remove member", {
          error,
          householdId,
          memberId,
        });
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof ApiError
              ? error.message
              : "Failed to remove member",
        });
        throw error;
      }
    },
    []
  );

  const updateMemberRole = useCallback(
    async (householdId: string, memberId: string, role: HouseholdRole) => {
      try {
        dispatch({ type: "SET_LOADING", payload: "member" });
        logger.debug("Updating member role", { householdId, memberId, role });

        const response = await apiClient.households.members.updateMemberRole(
          householdId,
          memberId,
          role
        );
        dispatch({ type: "UPDATE_MEMBER", payload: response.data });

        logger.info("Successfully updated member role", {
          householdId,
          memberId,
          role,
        });
      } catch (error) {
        logger.error("Failed to update member role", {
          error,
          householdId,
          memberId,
          role,
        });
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof ApiError
              ? error.message
              : "Failed to update member role",
        });
        throw error;
      }
    },
    []
  );

  const updateMemberSelection = useCallback(
    async (householdId: string, memberId: string, isSelected: boolean) => {
      try {
        // Find household and member
        const household = state.userHouseholds.find(
          (h) => h.id === householdId
        );
        const member = household?.members?.find((m) => m.userId === memberId);

        if (!household || !member) {
          throw new Error("Household or member not found");
        }

        logger.debug("Updating member selection", {
          householdId,
          memberId,
          isSelected,
          currentState: {
            selectedHouseholdsCount: state.selectedHouseholds.length,
            currentHouseholdId: state.currentHousehold?.id,
          },
        });

        // Prepare single atomic update
        const updatedMember = { ...member, isSelected };
        const updatedSelectedMembers = isSelected
          ? [...state.selectedMembers, { ...member, household }]
          : state.selectedMembers.filter((m) => m.id !== member.id);

        const updatedSelectedHouseholds = updatedSelectedMembers
          .map((member) => member.household)
          .filter((h): h is HouseholdWithMembers => !!h);

        const updatedCurrentHousehold =
          isSelected && !state.currentHousehold
            ? household
            : !isSelected && state.currentHousehold?.id === householdId
            ? updatedSelectedHouseholds[0] || null
            : state.currentHousehold;

        // Apply single atomic update
        dispatch({
          type: "INITIALIZE_HOUSEHOLDS",
          payload: {
            userHouseholds: state.userHouseholds,
            selectedHouseholds: updatedSelectedHouseholds,
            currentHousehold: updatedCurrentHousehold,
            selectedMembers: updatedSelectedMembers,
          },
        });

        // Make API request
        const response = await apiClient.households.members.updateSelection(
          householdId,
          memberId,
          isSelected
        );

        // Verify server state matches our optimistic update
        if (response.data.isSelected !== isSelected) {
          logger.warn("Server state differs from optimistic update", {
            expected: isSelected,
            received: response.data.isSelected,
          });
          await getSelectedHouseholds();
        }

        logger.info("Successfully updated member selection", {
          householdId,
          memberId,
          isSelected,
        });
      } catch (error) {
        logger.error("Failed to update member selection", {
          error,
          householdId,
          memberId,
          isSelected,
        });

        // Revert to server state
        await getSelectedHouseholds();

        const errorMessage =
          error instanceof ApiError
            ? error.message
            : "Failed to update member selection";

        dispatch({ type: "SET_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [
      state.userHouseholds,
      state.selectedMembers,
      state.selectedHouseholds,
      state.currentHousehold,
      getSelectedHouseholds,
    ]
  );

  const acceptInvitation = useCallback(
    async (householdId: string, memberId: string, accept: boolean) => {
      try {
        dispatch({ type: "SET_LOADING", payload: "invitation" });
        logger.debug("Processing invitation response", {
          householdId,
          memberId,
          accept,
        });

        const response =
          await apiClient.households.invitations.updateMemberInvitationStatus(
            householdId,
            memberId,
            accept
          );
        dispatch({ type: "UPDATE_MEMBER", payload: response.data });
        await getUserHouseholds(); // Refresh households list

        logger.info("Successfully processed invitation", {
          householdId,
          memberId,
          accept,
        });
      } catch (error) {
        logger.error("Failed to process invitation", {
          error,
          householdId,
          memberId,
          accept,
        });
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof ApiError
              ? error.message
              : "Failed to process invitation",
        });
        throw error;
      }
    },
    [getUserHouseholds]
  );

  const sendInvitation = useCallback(
    async (householdId: string, email: string) => {
      try {
        dispatch({ type: "SET_LOADING", payload: "invitation" });
        logger.debug("Sending invitation", { householdId, email });

        await apiClient.households.invitations.sendInvitation(
          householdId,
          email
        );

        logger.info("Successfully sent invitation", { householdId, email });
      } catch (error) {
        logger.error("Failed to send invitation", {
          error,
          householdId,
          email,
        });
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof ApiError
              ? error.message
              : "Failed to send invitation",
        });
        throw error;
      }
    },
    []
  );

  const getInvitations = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: "invitation" });
      logger.debug("Fetching invitations");

      const response = await apiClient.households.invitations.getInvitations();
      dispatch({ type: "SET_MEMBERS", payload: response.data });

      logger.info("Successfully fetched invitations", {
        count: response.data.length,
      });
    } catch (error) {
      logger.error("Failed to fetch invitations", { error });
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof ApiError
            ? error.message
            : "Failed to fetch invitations",
      });
      throw error;
    }
  }, []);

  const setCurrentHousehold = useCallback((household: HouseholdWithMembers) => {
    logger.debug("Setting current household", { householdId: household.id });
    dispatch({ type: "SET_CURRENT_HOUSEHOLD", payload: household });
  }, []);

  const reset = useCallback(() => {
    logger.debug("Resetting households state");
    dispatch({ type: "RESET_STATE" });
  }, []);

  const value = useMemo(
    () => ({
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
      acceptInvitation,
      sendInvitation,
      getInvitations,
      setCurrentHousehold,
      reset,
    }),
    [
      state,
      getUserHouseholds,
      getSelectedHouseholds,
      createHousehold,
      updateHousehold,
      deleteHousehold,
      addMember,
      removeMember,
      updateMemberRole,
      updateMemberSelection,
      acceptInvitation,
      sendInvitation,
      getInvitations,
      setCurrentHousehold,
      reset,
    ]
  );

  return (
    <HouseholdsContext.Provider value={value}>
      {children}
    </HouseholdsContext.Provider>
  );
}

export function useHouseholds() {
  const context = useContext(HouseholdsContext);
  if (context === undefined) {
    throw new Error("useHouseholds must be used within a HouseholdsProvider");
  }
  return context;
}

function areArraysEqual<T extends { id: string }>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const bIds = new Set(b.map((item) => item.id));
  return a.every((item) => bIds.has(item.id));
}
