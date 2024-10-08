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
  LoginResponse,
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
  GetUserHouseholdsResponse,
  ExtendedAxiosRequestConfig,
  RegisterResponse,
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
  ChoreResponse,
  ReceiptResponse,
  GetAttachmentResponse,
  DeleteTransactionResponse,
  DeleteMessageResponse,
  RemoveMemberResponse,
} from "../types/api";
import { User } from "../types/user";
import { Household, HouseholdMember } from "../types/household";
import { Attachment } from "../types/attachment";
import { UploadResponse } from "../types/upload";
import { Event, EventStatus } from "../types/event";
import { Message, CreateMessageDTO, UpdateMessageDTO } from "../types/message";
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
import {
  initializeAuth,
  logout as logoutAction,
  refreshAuth,
} from "../store/slices/authSlice";

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
  private authStateUpdateCallbacks: AuthStateUpdateCallback[] = [];

  // Add variables for refresh queue handling
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: void) => void> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
      withCredentials: true, // Ensures cookies are sent with every request
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
        const response = await this.axiosInstance.get<ApiResponse<User>>(
          "/auth/me"
        );
        return this.extractData(response);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },

    refreshToken: async (): Promise<void> => {
      await this.axiosInstance.post("/auth/refresh-token");
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

    events: {
      getEvents: async (householdId: string): Promise<Event[]> => {
        const response =
          await this.axiosInstance.get<GetHouseholdEventsResponse>(
            `/households/${householdId}/events`
          );
        return this.extractData(response);
      },

      createEvent: async (
        householdId: string,
        eventData: Partial<Event>
      ): Promise<Event> => {
        const response = await this.axiosInstance.post<CreateEventResponse>(
          `/households/${householdId}/events`,
          eventData
        );
        return this.extractData(response);
      },

      getEventDetails: async (
        householdId: string,
        eventId: string
      ): Promise<Event> => {
        const response = await this.axiosInstance.get<ApiResponse<Event>>(
          `/households/${householdId}/events/${eventId}`
        );
        return this.extractData(response);
      },

      updateEvent: async (
        householdId: string,
        eventId: string,
        eventData: Partial<Event>
      ): Promise<Event> => {
        const response = await this.axiosInstance.patch<UpdateEventResponse>(
          `/households/${householdId}/events/${eventId}`,
          eventData
        );
        return this.extractData(response);
      },

      deleteEvent: async (
        householdId: string,
        eventId: string
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/events/${eventId}`
        );
      },

      updateEventStatus: async (
        householdId: string,
        eventId: string,
        status: EventStatus
      ): Promise<Event> => {
        const response = await this.axiosInstance.patch<ApiResponse<Event>>(
          `/households/${householdId}/events/${eventId}/status`,
          { status }
        );
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
      file: File
    ): Promise<Receipt> => {
      const formData = new FormData();
      formData.append("receipt", file);
      const response = await this.axiosInstance.post<ReceiptResponse>(
        `/households/${householdId}/receipts`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return this.extractData(response);
    },

    getReceipts: async (householdId: string): Promise<Receipt[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Receipt[]>>(
        `/households/${householdId}/receipts`
      );
      return this.extractData(response);
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
      description?: string;
    }): Promise<Household> => {
      const response = await this.axiosInstance.post<CreateHouseholdResponse>(
        "/households",
        data
      );
      return this.extractData(response);
    },

    getHouseholdDetails: async (householdId: string): Promise<Household> => {
      const response =
        await this.axiosInstance.get<GetHouseholdDetailsResponse>(
          `/households/${householdId}`
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

    members: {
      inviteMember: async (
        householdId: string,
        email: string
      ): Promise<HouseholdMember> => {
        const response = await this.axiosInstance.post<InviteMemberResponse>(
          `/households/${householdId}/members/invite`,
          { email }
        );
        return this.extractData(response);
      },

      acceptInvitation: async (invitationToken: string): Promise<Household> => {
        const response =
          await this.axiosInstance.post<AcceptInvitationResponse>(
            `/households/invitations/accept`,
            { token: invitationToken }
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
            `/households/${householdId}/members/${memberId}`,
            { role }
          );
        return this.extractData(response);
      },
    },
  };

  messages = {
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

    getMessages: async (
      householdId: string,
      threadId: string
    ): Promise<Message[]> => {
      const response = await this.axiosInstance.get<GetMessagesResponse>(
        `/households/${householdId}/threads/${threadId}/messages`
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

  utils = {
    uploadAttachment: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await this.axiosInstance.post<UploadResponse>(
        "/utils/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },

    getAttachment: async (attachmentId: string): Promise<Attachment> => {
      const response = await this.axiosInstance.get<GetAttachmentResponse>(
        `/utils/attachments/${attachmentId}`
      );
      return this.extractData(response);
    },

    deleteAttachment: async (attachmentId: string): Promise<void> => {
      await this.axiosInstance.delete(`/utils/attachments/${attachmentId}`);
    },
  };
}

export const apiClient = new ApiClient();
