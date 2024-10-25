// frontend/src/lib/apiClient.ts: Comprehensive API client for Household Management App with strong typing and global error handling

import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from "axios";
import { ApiResponse } from "@shared/interfaces";
import {
  // User types
  User,
  UpdateUserDTO,

  // Household types
  Household,
  HouseholdMember,

  // Event types
  Event,
  CreateEventDTO,
  UpdateEventDTO,
  CreateReminderDTO,

  // Message and Thread types
  Message,
  CreateMessageDTO,
  UpdateMessageDTO,
  Attachment,
  Thread,
  UpdateThreadDTO,

  // Chore types
  Chore,
  CreateChoreDTO,
  UpdateChoreDTO,
  Subtask,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  ChoreSwapRequest,

  // Finance types
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  Transaction,
  CreateTransactionDTO,
  UpdateTransactionDTO,

  // Notification types
  Notification,
  CreateNotificationDTO,
  NotificationSettings,
  UpdateNotificationSettingsDTO,
} from "@shared/types";

import { getAppDispatch } from "../store/storeDispatch";
import { logout as logoutAction, refreshAuth } from "../store/slices/authSlice";

interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

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

    // Skip refresh for specific endpoints
    const skipRefreshEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh-token",
    ];

    if (
      skipRefreshEndpoints.some((endpoint) =>
        originalRequest.url?.includes(endpoint)
      )
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (this.isRefreshing) {
        return new Promise((resolve) => {
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
          this.refreshSubscribers.forEach((callback) => callback());
          this.refreshSubscribers = [];
          return this.axiosInstance(originalRequest);
        } else {
          // Handle failed refresh
          dispatch(logoutAction());
          window.location.href = "/login";
          return Promise.reject(
            new Error("Session expired. Please login again.")
          );
        }
      } catch (refreshError) {
        const dispatch = getAppDispatch();
        await dispatch(logoutAction());
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        this.isRefreshing = false;
        this.refreshSubscribers = [];
      }
    }

    // Enhanced error handling
    if (error.response) {
      const { status, data } = error.response as AxiosResponse<{
        message?: string;
        error?: string;
      }>;

      const errorMessage = data.message || data.error || "An error occurred";

      // Log the error for debugging
      console.error(`API Error: ${status} - ${errorMessage}`, {
        url: originalRequest.url,
        method: originalRequest.method,
        status,
      });

      // Throw a more informative error
      throw new Error(errorMessage);
    } else if (error.request) {
      console.error("Network Error: No response received from server.");
      throw new Error(
        "Unable to connect to the server. Please check your internet connection."
      );
    } else {
      console.error("Request Error:", error.message);
      throw error;
    }
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
      // Clear any local state if needed
    },

    initializeAuth: async (): Promise<User | null> => {
      try {
        const response = await this.axiosInstance.get<ApiResponse<User>>(
          "/users/profile"
        );
        return this.extractData(response);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Try to refresh the token first
          try {
            await this.auth.refreshToken();
            // If refresh successful, try to get profile again
            const response = await this.axiosInstance.get<ApiResponse<User>>(
              "/users/profile"
            );
            return this.extractData(response);
          } catch (refreshError) {
            return null;
          }
        }
        throw error;
      }
    },

    refreshToken: async (): Promise<void> => {
      try {
        await this.axiosInstance.post("/auth/refresh-token");
      } catch (error) {
        if (error.response?.status === 401) {
          // Clear auth state and redirect to login
          this.cleanup();
          throw new Error("Session expired");
        }
        throw error;
      }
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
    // syncCalendar: async (
    //   householdId: string,
    //   data: { provider: string }
    // ): Promise<SyncCalendarResponse["data"]> => {
    //   const response = await this.axiosInstance.post<SyncCalendarResponse>(
    //     `/households/${householdId}/calendar/sync`,
    //     data
    //   );
    //   return this.extractData(response);
    // },

    calendarEvents: {
      getEvents: async (householdId: string): Promise<Event[]> => {
        const response = await this.axiosInstance.get<ApiResponse<Event[]>>(
          `/households/${householdId}/calendar/events`
        );
        return this.extractData(response);
      },

      createEvent: async (
        householdId: string,
        eventData: CreateEventDTO
      ): Promise<Event> => {
        const response = await this.axiosInstance.post<ApiResponse<Event>>(
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
        eventData: UpdateEventDTO
      ): Promise<Event> => {
        const response = await this.axiosInstance.patch<ApiResponse<Event>>(
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
        reminderData: CreateReminderDTO
      ): Promise<Event> => {
        const response = await this.axiosInstance.post<ApiResponse<Event>>(
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
        date: string // ISO date string YYYY-MM-DD
      ): Promise<Event[]> => {
        const response = await this.axiosInstance.get<ApiResponse<Event[]>>(
          `/households/${householdId}/calendar/events/date/${date}`
        );
        return this.extractData(response);
      },
    },

    choreEvents: {
      getChoreEvents: async (
        householdId: string,
        choreId: string
      ): Promise<Event[]> => {
        const response = await this.axiosInstance.get<ApiResponse<Event[]>>(
          `/households/${householdId}/chores/${choreId}/events`
        );
        return this.extractData(response);
      },

      createChoreEvent: async (
        householdId: string,
        choreId: string,
        eventData: CreateEventDTO
      ): Promise<Event> => {
        const response = await this.axiosInstance.post<ApiResponse<Event>>(
          `/households/${householdId}/chores/${choreId}/events`,
          eventData
        );
        return this.extractData(response);
      },

      getChoreEventDetails: async (
        householdId: string,
        choreId: string,
        eventId: string
      ): Promise<Event> => {
        const response = await this.axiosInstance.get<ApiResponse<Event>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`
        );
        return this.extractData(response);
      },

      updateChoreEvent: async (
        householdId: string,
        choreId: string,
        eventId: string,
        eventData: UpdateEventDTO
      ): Promise<Event> => {
        const response = await this.axiosInstance.patch<ApiResponse<Event>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`,
          eventData
        );
        return this.extractData(response);
      },

      deleteChoreEvent: async (
        householdId: string,
        choreId: string,
        eventId: string
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`
        );
      },

      completeChoreEvent: async (
        householdId: string,
        choreId: string,
        eventId: string
      ): Promise<Event> => {
        const response = await this.axiosInstance.post<ApiResponse<Event>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}/complete`
        );
        return this.extractData(response);
      },

      rescheduleChoreEvent: async (
        householdId: string,
        choreId: string,
        eventId: string,
        newDate: string
      ): Promise<Event> => {
        const response = await this.axiosInstance.post<ApiResponse<Event>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}/reschedule`,
          { date: newDate }
        );
        return this.extractData(response);
      },

      getUpcomingChoreEvents: async (
        householdId: string,
        choreId: string
      ): Promise<Event[]> => {
        const response = await this.axiosInstance.get<ApiResponse<Event[]>>(
          `/households/${householdId}/chores/${choreId}/events/upcoming`
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

    getChoreDetails: async (
      householdId: string,
      choreId: string
    ): Promise<Chore> => {
      const response = await this.axiosInstance.get<ApiResponse<Chore>>(
        `/households/${householdId}/chores/${choreId}`
      );
      return this.extractData(response);
    },

    updateChore: async (
      householdId: string,
      choreId: string,
      choreData: UpdateChoreDTO
    ): Promise<Chore> => {
      const response = await this.axiosInstance.patch<ApiResponse<Chore>>(
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
      approved: boolean
    ): Promise<ChoreSwapRequest> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<ChoreSwapRequest>
      >(`/households/${householdId}/chores/${choreId}/swap-approve`, {
        approved,
      });
      return this.extractData(response);
    },

    subtasks: {
      getSubtasks: async (
        householdId: string,
        choreId: string
      ): Promise<Subtask[]> => {
        const response = await this.axiosInstance.get<ApiResponse<Subtask[]>>(
          `/households/${householdId}/chores/${choreId}/subtasks`
        );
        return this.extractData(response);
      },

      addSubtask: async (
        householdId: string,
        choreId: string,
        subtaskData: CreateSubtaskDTO
      ): Promise<Subtask> => {
        const response = await this.axiosInstance.post<ApiResponse<Subtask>>(
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
        const response = await this.axiosInstance.patch<ApiResponse<Subtask>>(
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
        await this.axiosInstance.delete(
          `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`
        );
      },
    },
  };

  finances = {
    expenses: {
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
        const response = await this.axiosInstance.post<ApiResponse<Expense>>(
          `/households/${householdId}/expenses`,
          expenseData
        );
        return this.extractData(response);
      },

      getExpenseDetails: async (
        householdId: string,
        expenseId: string
      ): Promise<Expense> => {
        const response = await this.axiosInstance.get<ApiResponse<Expense>>(
          `/households/${householdId}/expenses/${expenseId}`
        );
        return this.extractData(response);
      },

      updateExpense: async (
        householdId: string,
        expenseId: string,
        expenseData: UpdateExpenseDTO
      ): Promise<Expense> => {
        const response = await this.axiosInstance.patch<ApiResponse<Expense>>(
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

      uploadReceipt: async (
        householdId: string,
        expenseId: string,
        file: File
      ): Promise<Attachment> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await this.axiosInstance.post<ApiResponse<Attachment>>(
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
      ): Promise<Attachment[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<Attachment[]>
        >(`/households/${householdId}/expenses/${expenseId}/receipts`);
        return this.extractData(response);
      },

      getReceiptById: async (
        householdId: string,
        expenseId: string,
        receiptId: string
      ): Promise<Attachment> => {
        const response = await this.axiosInstance.get<ApiResponse<Attachment>>(
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

      updateExpenseSplits: async (
        householdId: string,
        expenseId: string,
        splits: { userId: string; amount: number }[]
      ): Promise<Expense> => {
        const response = await this.axiosInstance.patch<ApiResponse<Expense>>(
          `/households/${householdId}/expenses/${expenseId}/splits`,
          { splits }
        );
        return this.extractData(response);
      },
    },

    transactions: {
      getTransactions: async (householdId: string): Promise<Transaction[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<Transaction[]>
        >(`/households/${householdId}/transactions`);
        return this.extractData(response);
      },

      createTransaction: async (
        householdId: string,
        transactionData: CreateTransactionDTO
      ): Promise<Transaction> => {
        const response = await this.axiosInstance.post<
          ApiResponse<Transaction>
        >(`/households/${householdId}/transactions`, transactionData);
        return this.extractData(response);
      },

      updateTransactionStatus: async (
        householdId: string,
        transactionId: string,
        statusData: UpdateTransactionDTO
      ): Promise<Transaction> => {
        const response = await this.axiosInstance.patch<
          ApiResponse<Transaction>
        >(
          `/households/${householdId}/transactions/${transactionId}`,
          statusData
        );
        return this.extractData(response);
      },

      deleteTransaction: async (
        householdId: string,
        transactionId: string
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/transactions/${transactionId}`
        );
      },
    },
  };

  households = {
    getUserHouseholds: async (): Promise<Household[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Household[]>>(
        "/households"
      );
      return this.extractData(response);
    },

    createHousehold: async (data: {
      name: string;
      description?: string;
    }): Promise<Household> => {
      const response = await this.axiosInstance.post<ApiResponse<Household>>(
        "/households",
        data
      );
      return this.extractData(response);
    },

    getHousehold: async (householdId: string): Promise<Household> => {
      const response = await this.axiosInstance.get<ApiResponse<Household>>(
        `/households/${householdId}`
      );
      return this.extractData(response);
    },

    updateHousehold: async (
      householdId: string,
      data: { name?: string; description?: string }
    ): Promise<Household> => {
      const response = await this.axiosInstance.patch<ApiResponse<Household>>(
        `/households/${householdId}`,
        data
      );
      return this.extractData(response);
    },

    deleteHousehold: async (householdId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}`);
    },

    members: {
      getMembers: async (householdId: string): Promise<HouseholdMember[]> => {
        const response = await this.axiosInstance.get<
          ApiResponse<HouseholdMember[]>
        >(`/households/${householdId}/members`);
        return this.extractData(response);
      },

      addMember: async (
        householdId: string,
        data: { email: string; role: string }
      ): Promise<HouseholdMember> => {
        const response = await this.axiosInstance.post<
          ApiResponse<HouseholdMember>
        >(`/households/${householdId}/members`, data);
        return this.extractData(response);
      },

      removeMember: async (
        householdId: string,
        memberId: string
      ): Promise<void> => {
        await this.axiosInstance.delete(
          `/households/${householdId}/members/${memberId}`
        );
      },

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

      updateMemberRole: async (
        householdId: string,
        memberId: string,
        role: string
      ): Promise<HouseholdMember> => {
        const response = await this.axiosInstance.patch<
          ApiResponse<HouseholdMember>
        >(`/households/${householdId}/members/${memberId}/role`, { role });
        return this.extractData(response);
      },

      updateSelectedHousehold: async (
        householdId: string,
        memberId: string
      ): Promise<HouseholdMember> => {
        const response = await this.axiosInstance.patch<
          ApiResponse<HouseholdMember>
        >(`/households/${householdId}/members/${memberId}/selection`);
        return this.extractData(response);
      },
    },

    getSelectedHousehold: async (): Promise<Household> => {
      const response = await this.axiosInstance.get<ApiResponse<Household>>(
        `/households/selected`
      );
      return this.extractData(response);
    },

    sendInvitation: async (
      householdId: string,
      email: string
    ): Promise<void> => {
      await this.axiosInstance.post(`/households/${householdId}/invitations`, {
        email,
      });
    },
  };

  threads = {
    getThreads: async (householdId: string): Promise<Thread[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Thread[]>>(
        `/households/${householdId}/threads`
      );
      return this.extractData(response);
    },

    createThread: async (
      householdId: string,
      threadData: UpdateThreadDTO
    ): Promise<Thread> => {
      const response = await this.axiosInstance.post<ApiResponse<Thread>>(
        `/households/${householdId}/threads`,
        threadData
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
      threadData: UpdateThreadDTO
    ): Promise<Thread> => {
      const response = await this.axiosInstance.patch<ApiResponse<Thread>>(
        `/households/${householdId}/threads/${threadId}`,
        threadData
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
    ): Promise<Thread> => {
      const response = await this.axiosInstance.post<ApiResponse<Thread>>(
        `/households/${householdId}/threads/${threadId}/invite`,
        { userIds }
      );
      return this.extractData(response);
    },

    messages: {
      getMessages: async (
        householdId: string,
        threadId: string
      ): Promise<Message[]> => {
        const response = await this.axiosInstance.get<ApiResponse<Message[]>>(
          `/households/${householdId}/threads/${threadId}/messages`
        );
        return this.extractData(response);
      },

      createMessage: async (
        householdId: string,
        threadId: string,
        messageData: CreateMessageDTO
      ): Promise<Message> => {
        const response = await this.axiosInstance.post<ApiResponse<Message>>(
          `/households/${householdId}/threads/${threadId}/messages`,
          messageData
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

      updateMessage: async (
        householdId: string,
        threadId: string,
        messageId: string,
        messageData: UpdateMessageDTO
      ): Promise<Message> => {
        const response = await this.axiosInstance.patch<ApiResponse<Message>>(
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
        await this.axiosInstance.delete(
          `/households/${householdId}/threads/${threadId}/messages/${messageId}`
        );
      },

      attachments: {
        addAttachment: async (
          householdId: string,
          threadId: string,
          messageId: string,
          file: File
        ): Promise<Attachment> => {
          const formData = new FormData();
          formData.append("file", file);
          const response = await this.axiosInstance.post<
            ApiResponse<Attachment>
          >(
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

        getAttachmentDetails: async (
          householdId: string,
          threadId: string,
          messageId: string,
          attachmentId: string
        ): Promise<Attachment> => {
          const response = await this.axiosInstance.get<
            ApiResponse<Attachment>
          >(
            `/households/${householdId}/threads/${threadId}/messages/${messageId}/attachments/${attachmentId}`
          );
          return this.extractData(response);
        },

        deleteAttachment: async (
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
    },
  };

  notifications = {
    getNotifications: async (): Promise<Notification[]> => {
      const response = await this.axiosInstance.get<
        ApiResponse<Notification[]>
      >("/notifications");
      return this.extractData(response);
    },

    createNotification: async (
      notificationData: CreateNotificationDTO
    ): Promise<Notification> => {
      const response = await this.axiosInstance.post<ApiResponse<Notification>>(
        "/notifications",
        notificationData
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

    settings: {
      getSettings: async (): Promise<NotificationSettings> => {
        const response = await this.axiosInstance.get<
          ApiResponse<NotificationSettings>
        >("/notifications/settings");
        return this.extractData(response);
      },

      updateSettings: async (
        settingsId: string,
        settingsData: UpdateNotificationSettingsDTO
      ): Promise<NotificationSettings> => {
        const response = await this.axiosInstance.patch<
          ApiResponse<NotificationSettings>
        >(`/notifications/settings/${settingsId}`, settingsData);
        return this.extractData(response);
      },
    },
  };

  public cleanup(): void {
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }
}

export const apiClient = new ApiClient();
