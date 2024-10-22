// frontend/src/lib/apiClient.ts: Comprehensive API client for Household Management App with strong typing and global error handling

import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from "axios";
import {
  ApiResponse,
  InviteMemberResponse,
  Receipt,
  GetHouseholdsResponse,
  SyncCalendarResponse,
  GetHouseholdEventsResponse,
  CreateEventResponse,
  UpdateEventResponse,
  CreateSubtaskResponse,
  UpdateSubtaskResponse,
  DeleteSubtaskResponse,
  GetTransactionsResponse,
  CreateTransactionResponse,
  UpdateTransactionResponse,
  ExpenseResponse,
  InitializeAuthResponse,
  CreateHouseholdResponse,
  GetHouseholdDetailsResponse,
  UpdateHouseholdResponse,
  AcceptInvitationResponse,
  UpdateMemberRoleResponse,
  GetThreadsResponse,
  CreateThreadResponse,
  GetMessagesResponse,
  SendMessageResponse,
  UpdateMessageResponse,
  GetNotificationsResponse,
  UpdateChoreResponse,
  ReceiptResponse,
  DeleteTransactionResponse,
  DeleteMessageResponse,
  RemoveMemberResponse,
  UpdateThreadResponse,
} from "../types/api";
import { User, UpdateUserDTO } from "../types/user";
import { Household, HouseholdMember } from "../types/household";
import { Event, ChoreEvent } from "../types/event";
import {
  Message,
  CreateMessageDTO,
  UpdateMessageDTO,
  Attachment,
  UpdateThreadDTO,
} from "../types/message";
import {
  Chore,
  CreateChoreDTO,
  UpdateChoreDTO,
  Subtask,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  ChoreSwapRequest,
} from "../types/chore";
import {
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  Transaction,
} from "../types/expense";
import { Notification } from "../types/notification";
import { Thread } from "../types/message";
import { CreateTransactionDTO, UpdateTransactionDTO } from "../types/expense";
import { getAppDispatch } from "../store/storeDispatch";
import { logout as logoutAction, refreshAuth } from "../store/slices/authSlice";

// Add this interface to extend AxiosRequestConfig
interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

type AuthStateUpdateCallback = (state: {
  isAuthenticated: boolean;
  isInitialized: boolean;
}) => void;

class ApiClient {
  private axiosInstance: AxiosInstance;

  // Add variables for refresh queue handling
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<() => void> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => this.handleResponseError(error)
    );
  }

  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as RetryableAxiosRequestConfig;

    // Check if the request is to /auth/me and skip refresh logic
    if (originalRequest.url?.includes("/auth/me")) {
      // Let the initializeAuth handle this 401
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent multiple retries
      originalRequest._retry = true;

      if (this.isRefreshing) {
        // If a refresh is already in progress, queue the request
        return new Promise((resolve, reject) => {
          this.refreshSubscribers.push(() => {
            resolve(this.axiosInstance(originalRequest));
          });
        });
      }

      this.isRefreshing = true;

      try {
        const dispatch = getAppDispatch();
        const result = await dispatch(refreshAuth());

        if (refreshAuth.fulfilled.match(result)) {
          // Notify all subscribers that the token has been refreshed
          this.refreshSubscribers.forEach((callback) => callback());
          this.refreshSubscribers = [];

          // Retry the original request
          return this.axiosInstance(originalRequest);
        } else {
          // Refresh failed, proceed to logout
          await dispatch(logoutAction());
          window.location.href = "/login";
          return Promise.reject(error);
        }
      } catch (refreshError) {
        const dispatch = getAppDispatch();
        await dispatch(logoutAction());
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        this.isRefreshing = false;
      }
    }

    // Existing error handling...
    if (error.response) {
      const { status, data } = error.response as AxiosResponse<{
        message?: string;
        error?: string;
      }>;
      console.error(
        `API Error: ${status} - ${
          data.message || data.error || "Unknown error"
        }`
      );
    } else if (error.request) {
      console.error("API Error: No response received from server.");
    } else {
      console.error("API Error:", error.message);
    }

    return Promise.reject(error);
  }

  private extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
    return response.data.data;
  }

  auth = {
    register: async (data: {
      email: string;
      password: string;
      name: string;
    }): Promise<User> => {
      const response = await this.axiosInstance.post<ApiResponse<User>>(
        "/auth/register",
        data
      );
      return this.extractData(response);
    },

    login: async (credentials: {
      email: string;
      password: string;
    }): Promise<User> => {
      const response = await this.axiosInstance.post<ApiResponse<User>>(
        "/auth/login",
        credentials
      );
      return this.extractData(response);
    },

    logout: async (): Promise<void> => {
      await this.axiosInstance.post("/auth/logout");
    },

    initializeAuth: async (): Promise<User | null> => {
      try {
        const response = await this.axiosInstance.get<InitializeAuthResponse>(
          "/auth/me"
        );
        return this.extractData(response);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Return null for unauthenticated users instead of throwing an error
          return null;
        }
        throw error;
      }
    },

    refreshToken: async (): Promise<void> => {
      await this.axiosInstance.post("/auth/refresh-token");
    },
  };

  user = {
    getProfile: async (): Promise<User> => {
      const response = await this.axiosInstance.get<ApiResponse<User>>(
        "/users/profile"
      );
      return this.extractData(response);
    },

    updateProfile: async (data: UpdateUserDTO): Promise<User> => {
      const response = await this.axiosInstance.post<ApiResponse<User>>(
        "/users/profile",
        data
      );
      return this.extractData(response);
    },
  };

  calendar = {
    syncCalendar: async (
      householdId: string,
      data: { provider: string }
    ): Promise<SyncCalendarResponse["data"]> => {
      const response = await this.axiosInstance.post<SyncCalendarResponse>(
        `/households/${householdId}/calendar/sync`,
        data
      );
      return this.extractData(response);
    },

    calendarEvents: {
      getEvents: async (householdId: string): Promise<Event[]> => {
        const response =
          await this.axiosInstance.get<GetHouseholdEventsResponse>(
            `/households/${householdId}/calendar/events`
          );
        return this.extractData(response);
      },

      createEvent: async (
        householdId: string,
        eventData: Partial<Event>
      ): Promise<Event> => {
        const response = await this.axiosInstance.post<CreateEventResponse>(
          `/households/${householdId}/calendar/events`,
          eventData
        );
        return this.extractData(response);
      },

      getEventDetails: async (
        householdId: string,
        eventId: string
      ): Promise<Event> => {
        const response = await this.axiosInstance.get<ApiResponse<Event>>(
          `/households/${householdId}/calendar/events/${eventId}`
        );
        return this.extractData(response);
      },

      updateEvent: async (
        householdId: string,
        eventId: string,
        eventData: Partial<Event>
      ): Promise<Event> => {
        const response = await this.axiosInstance.patch<UpdateEventResponse>(
          `/households/${householdId}/calendar/events/${eventId}`,
          eventData
        );
        return this.extractData(response);
      },

      deleteEvent: async (
        householdId: string,
        eventId: string
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/calendar/events/${eventId}`
        );
      },

      addReminder: async (
        householdId: string,
        eventId: string,
        reminderData: { time: string; method: string }
      ): Promise<ChoreEvent> => {
        const response = await this.axiosInstance.post<ApiResponse<ChoreEvent>>(
          `/households/${householdId}/calendar/events/${eventId}/reminders`,
          reminderData
        );
        return this.extractData(response);
      },

      removeReminder: async (
        householdId: string,
        eventId: string,
        reminderId: string
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/calendar/events/${eventId}/reminders/${reminderId}`
        );
      },

      getEventsByDate: async (
        householdId: string,
        date: string
      ): Promise<Event[]> => {
        const response = await this.axiosInstance.get<ApiResponse<Event[]>>(
          `/households/${householdId}/calendar/events/date/${date}`
        );
        return this.extractData(response);
      },
    },

    choreEvents: {
      /**
       * Retrieves all events linked to a specific chore.
       * @param householdId - The ID of the household.
       * @param choreId - The ID of the chore.
       * @returns An array of ChoreEvent objects.
       */
      getChoreEvents: async (
        householdId: string,
        choreId: string
      ): Promise<ChoreEvent[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<ChoreEvent[]>
        >(`/households/${householdId}/chores/${choreId}/events`);
        return this.extractData(response);
      },

      /**
       * Creates a new event linked to a chore.
       * @param householdId - The ID of the household.
       * @param choreId - The ID of the chore.
       * @param eventData - Partial data for the new ChoreEvent.
       * @returns The created ChoreEvent object.
       */
      createChoreEvent: async (
        householdId: string,
        choreId: string,
        eventData: Partial<ChoreEvent>
      ): Promise<ChoreEvent> => {
        const response = await this.axiosInstance.post<ApiResponse<ChoreEvent>>(
          `/households/${householdId}/chores/${choreId}/events`,
          eventData
        );
        return this.extractData(response);
      },

      /**
       * Retrieves details of a specific chore-linked event.
       * @param householdId - The ID of the household.
       * @param choreId - The ID of the chore.
       * @param eventId - The ID of the event.
       * @returns The ChoreEvent object.
       */
      getChoreEventDetails: async (
        householdId: string,
        choreId: string,
        eventId: string
      ): Promise<ChoreEvent> => {
        const response = await this.axiosInstance.get<ApiResponse<ChoreEvent>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`
        );
        return this.extractData(response);
      },

      /**
       * Updates an existing chore-linked event.
       * @param householdId - The ID of the household.
       * @param choreId - The ID of the chore.
       * @param eventId - The ID of the event.
       * @param eventData - Partial data to update the ChoreEvent.
       * @returns The updated ChoreEvent object.
       */
      updateChoreEvent: async (
        householdId: string,
        choreId: string,
        eventId: string,
        eventData: Partial<ChoreEvent>
      ): Promise<ChoreEvent> => {
        const response = await this.axiosInstance.patch<
          ApiResponse<ChoreEvent>
        >(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`,
          eventData
        );
        return this.extractData(response);
      },

      /**
       * Deletes a chore-linked event.
       * @param householdId - The ID of the household.
       * @param choreId - The ID of the chore.
       * @param eventId - The ID of the event.
       * @returns Void.
       */
      deleteChoreEvent: async (
        householdId: string,
        choreId: string,
        eventId: string
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`
        );
      },

      /**
       * Marks a chore event as completed.
       * @param householdId - The ID of the household.
       * @param choreId - The ID of the chore.
       * @param eventId - The ID of the event.
       * @returns The updated ChoreEvent object with status marked as completed.
       */
      completeChoreEvent: async (
        householdId: string,
        choreId: string,
        eventId: string
      ): Promise<ChoreEvent> => {
        const response = await this.axiosInstance.post<ApiResponse<ChoreEvent>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}/complete`
        );
        return this.extractData(response);
      },

      /**
       * Reschedules a chore event.
       * @param householdId - The ID of the household.
       * @param choreId - The ID of the chore.
       * @param eventId - The ID of the event.
       * @param newDate - Object containing the new date.
       * @returns The updated ChoreEvent object with the new schedule.
       */
      rescheduleChoreEvent: async (
        householdId: string,
        choreId: string,
        eventId: string,
        newDate: { date: string }
      ): Promise<ChoreEvent> => {
        const response = await this.axiosInstance.post<ApiResponse<ChoreEvent>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}/reschedule`,
          newDate
        );
        return this.extractData(response);
      },

      /**
       * Retrieves upcoming chore-linked events.
       * @param householdId - The ID of the household.
       * @param choreId - The ID of the chore.
       * @returns An array of upcoming ChoreEvent objects.
       */
      getUpcomingChoreEvents: async (
        householdId: string,
        choreId: string
      ): Promise<ChoreEvent[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<ChoreEvent[]>
        >(`/households/${householdId}/chores/${choreId}/events/upcoming`);
        return this.extractData(response);
      },
    },
  };

  chores = {
    getChores: async (householdId: string): Promise<Chore[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Chore[]>>(
        `/households/${householdId}/chores`
      );
      return this.extractData(response);
    },

    createChore: async (
      householdId: string,
      choreData: CreateChoreDTO
    ): Promise<Chore> => {
      const response = await this.axiosInstance.post<ApiResponse<Chore>>(
        `/households/${householdId}/chores`,
        choreData
      );
      return this.extractData(response);
    },

    updateChore: async (
      householdId: string,
      choreId: string,
      choreData: UpdateChoreDTO
    ): Promise<Chore> => {
      const response = await this.axiosInstance.patch<UpdateChoreResponse>(
        `/households/${householdId}/chores/${choreId}`,
        choreData
      );
      return this.extractData(response);
    },

    deleteChore: async (
      householdId: string,
      choreId: string
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/chores/${choreId}`
      );
    },

    requestChoreSwap: async (
      householdId: string,
      choreId: string,
      targetUserId: string
    ): Promise<ChoreSwapRequest> => {
      const response = await this.axiosInstance.post<
        ApiResponse<ChoreSwapRequest>
      >(`/households/${householdId}/chores/${choreId}/swap-request`, {
        targetUserId,
      });
      return this.extractData(response);
    },

    approveChoreSwap: async (
      householdId: string,
      choreId: string,
      swapRequestId: string,
      approved: boolean
    ): Promise<Chore> => {
      const response = await this.axiosInstance.patch<ApiResponse<Chore>>(
        `/households/${householdId}/chores/${choreId}/swap-approve`,
        { swapRequestId, approved }
      );
      return this.extractData(response);
    },

    subtasks: {
      createSubtask: async (
        householdId: string,
        choreId: string,
        subtaskData: CreateSubtaskDTO
      ): Promise<Subtask> => {
        const response = await this.axiosInstance.post<CreateSubtaskResponse>(
          `/households/${householdId}/chores/${choreId}/subtasks`,
          subtaskData
        );
        return this.extractData(response);
      },

      updateSubtask: async (
        householdId: string,
        choreId: string,
        subtaskId: string,
        subtaskData: UpdateSubtaskDTO
      ): Promise<Subtask> => {
        const response = await this.axiosInstance.patch<UpdateSubtaskResponse>(
          `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
          subtaskData
        );
        return this.extractData(response);
      },

      deleteSubtask: async (
        householdId: string,
        choreId: string,
        subtaskId: string
      ): Promise<void> => {
        await this.axiosInstance.delete<DeleteSubtaskResponse>(
          `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`
        );
      },
    },
  };

  finances = {
    getExpenses: async (householdId: string): Promise<Expense[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Expense[]>>(
        `/households/${householdId}/expenses`
      );
      return this.extractData(response);
    },

    createExpense: async (
      householdId: string,
      expenseData: CreateExpenseDTO
    ): Promise<Expense> => {
      const response = await this.axiosInstance.post<ExpenseResponse>(
        `/households/${householdId}/expenses`,
        expenseData
      );
      return this.extractData(response);
    },

    updateExpense: async (
      householdId: string,
      expenseId: string,
      expenseData: UpdateExpenseDTO
    ): Promise<Expense> => {
      const response = await this.axiosInstance.patch<ExpenseResponse>(
        `/households/${householdId}/expenses/${expenseId}`,
        expenseData
      );
      return this.extractData(response);
    },

    deleteExpense: async (
      householdId: string,
      expenseId: string
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/expenses/${expenseId}`
      );
    },

    getTransactions: async (householdId: string): Promise<Transaction[]> => {
      const response = await this.axiosInstance.get<GetTransactionsResponse>(
        `/households/${householdId}/transactions`
      );
      return this.extractData(response);
    },

    createTransaction: async (
      householdId: string,
      transactionData: CreateTransactionDTO
    ): Promise<Transaction> => {
      const response = await this.axiosInstance.post<CreateTransactionResponse>(
        `/households/${householdId}/transactions`,
        transactionData
      );
      return this.extractData(response);
    },

    updateTransaction: async (
      householdId: string,
      transactionId: string,
      transactionData: UpdateTransactionDTO
    ): Promise<Transaction> => {
      const response =
        await this.axiosInstance.patch<UpdateTransactionResponse>(
          `/households/${householdId}/transactions/${transactionId}`,
          transactionData
        );
      return this.extractData(response);
    },

    deleteTransaction: async (
      householdId: string,
      transactionId: string
    ): Promise<void> => {
      await this.axiosInstance.delete<DeleteTransactionResponse>(
        `/households/${householdId}/transactions/${transactionId}`
      );
    },

    uploadReceipt: async (
      householdId: string,
      expenseId: string,
      file: File
    ): Promise<Receipt> => {
      const formData = new FormData();
      formData.append("receipt", file);
      const response = await this.axiosInstance.post<ReceiptResponse>(
        `/households/${householdId}/expenses/${expenseId}/receipts`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return this.extractData(response);
    },

    getReceipts: async (
      householdId: string,
      expenseId: string
    ): Promise<Receipt[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Receipt[]>>(
        `/households/${householdId}/expenses/${expenseId}/receipts`
      );
      return this.extractData(response);
    },

    getReceiptById: async (
      householdId: string,
      expenseId: string,
      receiptId: string
    ): Promise<Receipt> => {
      const response = await this.axiosInstance.get<ApiResponse<Receipt>>(
        `/households/${householdId}/expenses/${expenseId}/receipts/${receiptId}`
      );
      return this.extractData(response);
    },

    deleteReceipt: async (
      householdId: string,
      expenseId: string,
      receiptId: string
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/expenses/${expenseId}/receipts/${receiptId}`
      );
    },
  };

  household = {
    getHouseholds: async (): Promise<Household[]> => {
      const response = await this.axiosInstance.get<GetHouseholdsResponse>(
        "/households"
      );
      return this.extractData(response);
    },

    createHousehold: async (data: {
      name: string;
      currency: string;
    }): Promise<Household> => {
      const response = await this.axiosInstance.post<CreateHouseholdResponse>(
        "/households",
        data
      );
      return this.extractData(response);
    },

    getHouseholdDetails: async (
      householdId: string,
      includeMembers: boolean = false
    ): Promise<Household> => {
      const response =
        await this.axiosInstance.get<GetHouseholdDetailsResponse>(
          `/households/${householdId}`,
          { params: { includeMembers: includeMembers.toString() } }
        );
      return this.extractData(response);
    },

    getHouseholdMembers: async (
      householdId: string
    ): Promise<HouseholdMember[]> => {
      const response = await this.axiosInstance.get<
        ApiResponse<HouseholdMember[]>
      >(`/households/${householdId}/members`);
      return this.extractData(response);
    },

    updateHousehold: async (
      householdId: string,
      data: Partial<Household>
    ): Promise<Household> => {
      const response = await this.axiosInstance.patch<UpdateHouseholdResponse>(
        `/households/${householdId}`,
        data
      );
      return this.extractData(response);
    },

    deleteHousehold: async (householdId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}`);
    },

    /**
     * Updates the status of a household member.
     */
    updateMemberStatus: async (
      householdId: string,
      memberId: string,
      status: "ACCEPTED" | "REJECTED"
    ): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<HouseholdMember>
      >(`/households/${householdId}/members/${memberId}/status`, { status });
      return this.extractData(response);
    },

    /**
     * Retrieves all selected households for the authenticated user.
     */
    getSelectedHouseholds: async (): Promise<Household[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Household[]>>(
        "/households/selected"
      );
      return this.extractData(response);
    },

    /**
     * Toggles the selection state of a household for a member.
     */
    toggleHouseholdSelection: async (
      householdId: string,
      memberId: string,
      isSelected: boolean
    ): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<HouseholdMember>
      >(`/households/${householdId}/members/${memberId}/selection`, {
        isSelected,
      });
      return this.extractData(response);
    },

    invitations: {
      sendInvitation: async (
        householdId: string,
        email: string
      ): Promise<HouseholdMember> => {
        const response = await this.axiosInstance.post<InviteMemberResponse>(
          `/households/${householdId}/invitations`,
          { email }
        );
        return this.extractData(response);
      },

      acceptInvitation: async (invitationToken: string): Promise<Household> => {
        const response =
          await this.axiosInstance.post<AcceptInvitationResponse>(
            `/households/invitations/accept`,
            { invitationToken }
          );
        return this.extractData(response);
      },

      rejectInvitation: async (invitationToken: string): Promise<void> => {
        await this.axiosInstance.post(`/households/invitations/reject`, {
          token: invitationToken,
        });
      },
    },

    members: {
      addMember: async (
        householdId: string,
        data: {
          email: string;
          role?: string;
        }
      ): Promise<HouseholdMember> => {
        const response = await this.axiosInstance.post<InviteMemberResponse>(
          `/households/${householdId}/members`,
          data
        );
        return this.extractData(response);
      },

      removeMember: async (
        householdId: string,
        memberId: string
      ): Promise<void> => {
        await this.axiosInstance.delete<RemoveMemberResponse>(
          `/households/${householdId}/members/${memberId}`
        );
      },

      updateMemberRole: async (
        householdId: string,
        memberId: string,
        role: string
      ): Promise<HouseholdMember> => {
        const response =
          await this.axiosInstance.patch<UpdateMemberRoleResponse>(
            `/households/${householdId}/members/${memberId}/role`,
            { role }
          );
        return this.extractData(response);
      },
    },
  };

  threads = {
    getThreads: async (householdId: string): Promise<Thread[]> => {
      const response = await this.axiosInstance.get<GetThreadsResponse>(
        `/households/${householdId}/threads`
      );
      return this.extractData(response);
    },

    createThread: async (
      householdId: string,
      data: { title: string; participants: string[] }
    ): Promise<Thread> => {
      const response = await this.axiosInstance.post<CreateThreadResponse>(
        `/households/${householdId}/threads`,
        data
      );
      return this.extractData(response);
    },

    getThreadDetails: async (
      householdId: string,
      threadId: string
    ): Promise<Thread> => {
      const response = await this.axiosInstance.get<ApiResponse<Thread>>(
        `/households/${householdId}/threads/${threadId}`
      );
      return this.extractData(response);
    },

    updateThread: async (
      householdId: string,
      threadId: string,
      data: UpdateThreadDTO
    ): Promise<Thread> => {
      const response = await this.axiosInstance.patch<UpdateThreadResponse>(
        `/households/${householdId}/threads/${threadId}`,
        data
      );
      return this.extractData(response);
    },

    deleteThread: async (
      householdId: string,
      threadId: string
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/threads/${threadId}`
      );
    },

    inviteUsers: async (
      householdId: string,
      threadId: string,
      userIds: string[]
    ): Promise<void> => {
      await this.axiosInstance.post(
        `/households/${householdId}/threads/${threadId}/invite`,
        { userIds }
      );
    },

    messages: {
      getMessages: async (
        householdId: string,
        threadId: string
      ): Promise<Message[]> => {
        const response = await this.axiosInstance.get<GetMessagesResponse>(
          `/households/${householdId}/threads/${threadId}/messages`
        );
        return this.extractData(response);
      },

      getMessageDetails: async (
        householdId: string,
        threadId: string,
        messageId: string
      ): Promise<Message> => {
        const response = await this.axiosInstance.get<ApiResponse<Message>>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}`
        );
        return this.extractData(response);
      },

      sendMessage: async (
        householdId: string,
        threadId: string,
        messageData: CreateMessageDTO
      ): Promise<Message> => {
        const response = await this.axiosInstance.post<SendMessageResponse>(
          `/households/${householdId}/threads/${threadId}/messages`,
          messageData
        );
        return this.extractData(response);
      },

      updateMessage: async (
        householdId: string,
        threadId: string,
        messageId: string,
        messageData: UpdateMessageDTO
      ): Promise<Message> => {
        const response = await this.axiosInstance.patch<UpdateMessageResponse>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}`,
          messageData
        );
        return this.extractData(response);
      },

      deleteMessage: async (
        householdId: string,
        threadId: string,
        messageId: string
      ): Promise<void> => {
        await this.axiosInstance.delete<DeleteMessageResponse>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}`
        );
      },

      uploadMessageAttachment: async (
        householdId: string,
        threadId: string,
        messageId: string,
        file: File
      ): Promise<Attachment> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await this.axiosInstance.post<ApiResponse<Attachment>>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return this.extractData(response);
      },

      getMessageAttachment: async (
        householdId: string,
        threadId: string,
        messageId: string,
        attachmentId: string
      ): Promise<Attachment> => {
        const response = await this.axiosInstance.get<ApiResponse<Attachment>>(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`
        );
        return this.extractData(response);
      },

      deleteMessageAttachment: async (
        householdId: string,
        threadId: string,
        messageId: string,
        attachmentId: string
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`
        );
      },
    },
  };

  notifications = {
    getNotifications: async (): Promise<Notification[]> => {
      const response = await this.axiosInstance.get<GetNotificationsResponse>(
        "/notifications"
      );
      return this.extractData(response);
    },

    markNotificationAsRead: async (
      notificationId: string
    ): Promise<Notification> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<Notification>
      >(`/notifications/${notificationId}/read`);
      return this.extractData(response);
    },

    deleteNotification: async (notificationId: string): Promise<void> => {
      await this.axiosInstance.delete(`/notifications/${notificationId}`);
    },
  };
}

export const apiClient = new ApiClient();
