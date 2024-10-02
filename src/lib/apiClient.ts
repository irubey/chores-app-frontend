// frontend/src/lib/apiClient.ts: Comprehensive API client for Household Management App with strong typing and global error handling

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
  SyncCalendarResponse,
  InviteMemberResponse,
  GetHouseholdEventsResponse,
  CreateEventResponse,
  UpdateEventResponse,
  CreateSubtaskResponse,
  UpdateSubtaskResponse,
  DeleteSubtaskResponse,
  GetTransactionsResponse,
  CreateTransactionResponse,
  UpdateTransactionResponse,
  GetUserHouseholdsResponse,
  ExtendedAxiosRequestConfig, 
} from '../types/api'; 
import { User } from '../types/user';
import { Household, HouseholdMember } from '../types/household';
import { Attachment } from '../types/attachment';
import { UploadResponse } from '../types/upload';
import { Event } from '../types/event';
import { Message, CreateMessageDTO, UpdateMessageDTO } from '../types/message';
import { Chore, CreateChoreDTO, UpdateChoreDTO, Subtask, CreateSubtaskDTO, UpdateSubtaskDTO, ChoreSwapRequest } from '../types/chore';
import { Expense, CreateExpenseDTO, UpdateExpenseDTO } from '../types/expense';
import { Notification } from '../types/notification';
import { Thread } from '../types/message';

type AuthStateUpdateCallback = (state: { isAuthenticated: boolean; isInitialized: boolean }) => void;

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing: boolean = false;
  private pendingRequests: Array<() => void> = [];
  private authStateUpdateCallbacks: AuthStateUpdateCallback[] = [];
  private channel: BroadcastChannel;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
      withCredentials: true, // This ensures cookies are sent with every request
    });

    this.channel = new BroadcastChannel('auth');
    this.channel.onmessage = this.handleChannelMessage.bind(this);

    this.setupInterceptors();
  }

  private handleChannelMessage(message: MessageEvent) {
    if (message.data.type === 'REFRESH_TOKEN_SUCCESS') {
      this.pendingRequests.forEach((cb) => cb());
      this.pendingRequests = [];
    } else if (message.data.type === 'REFRESH_TOKEN_FAILURE') {
      this.notifyAuthStateChange({ isAuthenticated: false, isInitialized: true });
      window.location.href = '/login';
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      await this.axiosInstance.post<ApiResponse<{ user: User }>>('/auth/refresh-token');
      this.channel.postMessage({ type: 'REFRESH_TOKEN_SUCCESS' });
    } catch (error) {
      this.channel.postMessage({ type: 'REFRESH_TOKEN_FAILURE' });
      throw error;
    }
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.pendingRequests.push(() => {
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.pendingRequests.forEach((cb) => cb());
            this.pendingRequests = [];
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.notifyAuthStateChange({ isAuthenticated: false, isInitialized: true });
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Existing global error handling
        if (error.response) {
          const { status, data } = error.response as AxiosResponse<{ message?: string; error?: string }>;
          console.error(`API Error: ${status} - ${data.message || data.error || 'Unknown error'}`);
        } else if (error.request) {
          console.error('API Error: No response received from server.');
        } else {
          console.error('API Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Registers a callback to update authentication state in the Redux store.
   * @param callback The function to call with the new auth state.
   */
  registerAuthStateUpdate(callback: AuthStateUpdateCallback) {
    this.authStateUpdateCallbacks.push(callback);
  }

  /**
   * Initializes Axios interceptors or other configurations.
   */
  initializeInterceptors() {
    // Example: You can set up additional interceptors here if needed.
    // Currently, interceptors are set up in the constructor.
    // This method can be expanded based on specific requirements.
    console.log('Axios interceptors have been initialized.');
  }

  /**
   * Call these callbacks to notify about auth state changes.
   */
  private notifyAuthStateChange(state: { isAuthenticated: boolean; isInitialized: boolean }) {
    this.authStateUpdateCallbacks.forEach(callback => callback(state));
  }

  /**
   * Authentication Methods
   */
  auth = {
    register: async (data: { email: string; password: string; name: string }): Promise<User> => {
      const response = await this.axiosInstance.post<ApiResponse<User>>('/auth/register', data);
      this.notifyAuthStateChange({ isAuthenticated: true, isInitialized: true });
      return response.data.data;
    },

    login: async (credentials: { email: string; password: string }): Promise<User> => {
      const response = await this.axiosInstance.post<ApiResponse<User>>('/auth/login', credentials);
      this.notifyAuthStateChange({ isAuthenticated: true, isInitialized: true });
      return response.data.data;
    },

    logout: async (): Promise<void> => {
      await this.axiosInstance.post('/auth/logout');
      this.notifyAuthStateChange({ isAuthenticated: false, isInitialized: true });
    },

    initializeAuth: async (): Promise<User | null> => {
      try {
        const response = await this.axiosInstance.get<ApiResponse<User>>('/auth/me');
        this.notifyAuthStateChange({ isAuthenticated: true, isInitialized: true });
        return response.data.data;
      } catch (error) {
        this.notifyAuthStateChange({ isAuthenticated: false, isInitialized: true });
        return null;
      }
    },
  };

  /**
   * Household Management Methods
   */
  households = {
    getUserHouseholds: async (): Promise<Household[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Household[]>>('/households');
      return response.data.data;
    },

    getHousehold: async (householdId: string): Promise<Household> => {
      const response = await this.axiosInstance.get<ApiResponse<Household>>(`/households/${householdId}`);
      return response.data.data;
    },

    createHousehold: async (data: { name: string }): Promise<Household> => {
      const response = await this.axiosInstance.post<ApiResponse<Household>>('/households', data);
      return response.data.data;
    },

    updateHousehold: async (householdId: string, data: Partial<Household>): Promise<Household> => {
      const response = await this.axiosInstance.patch<ApiResponse<Household>>(`/households/${householdId}`, data);
      return response.data.data;
    },

    deleteHousehold: async (householdId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}`);
    },

    addMember: async (householdId: string, data: { email: string; role?: 'ADMIN' | 'MEMBER' }): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.post<ApiResponse<HouseholdMember>>(`/households/${householdId}/members`, data);
      return response.data.data;
    },

    removeMember: async (householdId: string, memberId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/members/${memberId}`);
    },

    updateMemberStatus: async (householdId: string, memberId: string, status: string): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<ApiResponse<HouseholdMember>>(`/households/${householdId}/members/${memberId}/status`, { status });
      return response.data.data;
    },

    getSelectedHouseholds: async (): Promise<Household[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Household[]>>('/households/selected');
      return response.data.data;
    },

    toggleHouseholdSelection: async (householdId: string, isSelected: boolean): Promise<HouseholdMember> => {
      const response = await this.axiosInstance.patch<ApiResponse<HouseholdMember>>(`/households/${householdId}/members/selection`, { isSelected });
      return response.data.data;
    },

    syncCalendar: async (householdId: string, data: { provider: string; }): Promise<SyncCalendarResponse> => {
      const response = await this.axiosInstance.post<ApiResponse<Event[]>>(`/households/${householdId}/calendar/sync`, data);
      return response.data;
    },

    getHouseholdEvents: async (householdId: string): Promise<GetHouseholdEventsResponse> => {
      const response = await this.axiosInstance.get<GetHouseholdEventsResponse>(`/households/${householdId}/events`);
      return response.data;
    },

    createEvent: async (householdId: string, eventData: Partial<Event>): Promise<CreateEventResponse> => {
      const response = await this.axiosInstance.post<CreateEventResponse>(`/households/${householdId}/events`, eventData);
      return response.data;
    },

    updateEvent: async (householdId: string, eventId: string, eventData: Partial<Event>): Promise<UpdateEventResponse> => {
      const response = await this.axiosInstance.patch<UpdateEventResponse>(`/households/${householdId}/events/${eventId}`, eventData);
      return response.data;
    },

    deleteEvent: async (householdId: string, eventId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/events/${eventId}`);
    },
  };
 
  /**
   * Household Member Management Methods
   */
  householdMembers = {
    getMembers: async (householdId: string): Promise<ApiResponse<HouseholdMember[]>> => {
      const response = await this.axiosInstance.get<ApiResponse<HouseholdMember[]>>(`/households/${householdId}/members`);
      return response.data;
    },

    inviteMember: async (householdId: string, data: { email: string; role?: 'ADMIN' | 'MEMBER' }): Promise<InviteMemberResponse> => {
      const response = await this.axiosInstance.post<ApiResponse<HouseholdMember>>(`/households/${householdId}/invitations`, data);
      return response.data;
    },

    removeMember: async (householdId: string, memberId: string): Promise<ApiResponse<null>> => {
      const response = await this.axiosInstance.delete<ApiResponse<null>>(`/households/${householdId}/members/${memberId}`);
      return response.data;
    },
  };

  /**
   * Utility Methods
   */
  utils = {
    uploadFile: async (file: File): Promise<ApiResponse<UploadResponse>> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await this.axiosInstance.post<ApiResponse<UploadResponse>>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    getAttachment: async (attachmentId: string): Promise<ApiResponse<Attachment>> => {
      const response = await this.axiosInstance.get<ApiResponse<Attachment>>(`/attachments/${attachmentId}`);
      return response.data;
    },
  };

  /**
   * Messaging Methods
   */
  messages = {
    getMessages: async (householdId: string): Promise<Message[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Message[]>>(`/households/${householdId}/messages`);
      return response.data.data;
    },

    createMessage: async (householdId: string, data: CreateMessageDTO): Promise<Message> => {
      const response = await this.axiosInstance.post<ApiResponse<Message>>(`/households/${householdId}/messages`, data);
      return response.data.data;
    },

    updateMessage: async (householdId: string, messageId: string, data: UpdateMessageDTO): Promise<Message> => {
      const response = await this.axiosInstance.patch<ApiResponse<Message>>(`/households/${householdId}/messages/${messageId}`, data);
      return response.data.data;
    },

    deleteMessage: async (householdId: string, messageId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/messages/${messageId}`);
    },

    getThreads: async (householdId: string, messageId: string): Promise<Thread[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Thread[]>>(`/households/${householdId}/messages/${messageId}/threads`);
      return response.data.data;
    },

    createThread: async (householdId: string, messageId: string, data: { content: string }): Promise<Thread> => {
      const response = await this.axiosInstance.post<ApiResponse<Thread>>(`/households/${householdId}/messages/${messageId}/threads`, data);
      return response.data.data;
    },

    uploadAttachment: async (householdId: string, messageId: string, file: File): Promise<Attachment> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await this.axiosInstance.post<ApiResponse<Attachment>>(`/households/${householdId}/messages/${messageId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    },
  };

  /**
   * Chore Management Methods
   */
  chores = {
    getChores: async (householdId: string): Promise<Chore[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Chore[]>>(`/households/${householdId}/chores`);
      return response.data.data;
    },

    createChore: async (householdId: string, choreData: CreateChoreDTO): Promise<Chore> => {
      const response = await this.axiosInstance.post<ApiResponse<Chore>>(`/households/${householdId}/chores`, choreData);
      return response.data.data;
    },

    updateChore: async (householdId: string, choreId: string, choreData: UpdateChoreDTO): Promise<Chore> => {
      const response = await this.axiosInstance.patch<ApiResponse<Chore>>(`/households/${householdId}/chores/${choreId}`, choreData);
      return response.data.data;
    },

    deleteChore: async (householdId: string, choreId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/chores/${choreId}`);
    },

    subtasks: {
      createSubtask: async (householdId: string, choreId: string, subtaskData: CreateSubtaskDTO): Promise<Subtask> => {
        const response = await this.axiosInstance.post<ApiResponse<Subtask>>(
          `/households/${householdId}/chores/${choreId}/subtasks`,
          subtaskData
        );
        return response.data.data;
      },

      updateSubtask: async (householdId: string, choreId: string, subtaskId: string, subtaskData: UpdateSubtaskDTO): Promise<Subtask> => {
        const response = await this.axiosInstance.patch<ApiResponse<Subtask>>(
          `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`,
          subtaskData
        );
        return response.data.data;
      },

      deleteSubtask: async (householdId: string, choreId: string, subtaskId: string): Promise<void> => {
        await this.axiosInstance.delete<ApiResponse<null>>(
          `/households/${householdId}/chores/${choreId}/subtasks/${subtaskId}`
        );
      },
    },

    requestChoreSwap: async (householdId: string, choreId: string, targetUserId: string): Promise<ChoreSwapRequest> => {
      const response = await this.axiosInstance.post<ApiResponse<ChoreSwapRequest>>(
        `/households/${householdId}/chores/${choreId}/swap-request`,
        { targetUserId }
      );
      return response.data.data;
    },

    approveChoreSwap: async (householdId: string, choreId: string, swapRequestId: string, approved: boolean): Promise<Chore> => {
      const response = await this.axiosInstance.patch<ApiResponse<Chore>>(
        `/households/${householdId}/chores/${choreId}/swap-approve`,
        { swapRequestId, approved }
      );
      return response.data.data;
    },
  };

  /**
   * Finances Management Methods
   */
  finances = {
    getExpenses: async (householdId: string): Promise<ApiResponse<Expense[]>> => {
      const response = await this.axiosInstance.get<ApiResponse<Expense[]>>(`/households/${householdId}/expenses`);
      return response.data;
    },

    createExpense: async (householdId: string, expenseData: CreateExpenseDTO): Promise<ApiResponse<Expense>> => {
      const response = await this.axiosInstance.post<ApiResponse<Expense>>(`/households/${householdId}/expenses`, expenseData);
      return response.data;
    },

    updateExpense: async (householdId: string, expenseId: string, expenseData: UpdateExpenseDTO): Promise<ApiResponse<Expense>> => {
      const response = await this.axiosInstance.patch<ApiResponse<Expense>>(`/households/${householdId}/expenses/${expenseId}`, expenseData);
      return response.data;
    },

    deleteExpense: async (householdId: string, expenseId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/expenses/${expenseId}`);
    },

    getTransactions: async (householdId: string): Promise<GetTransactionsResponse> => {
      const response = await this.axiosInstance.get<GetTransactionsResponse>(`/households/${householdId}/transactions`);
      return response.data;
    },

    createTransaction: async (householdId: string, transactionData: { amount: number; type: 'INCOME' | 'EXPENSE'; category: string; date: string; description?: string }): Promise<CreateTransactionResponse> => {
      const response = await this.axiosInstance.post<CreateTransactionResponse>(`/households/${householdId}/transactions`, transactionData);
      return response.data;
    },

    updateTransaction: async (householdId: string, transactionId: string, transactionData: { amount?: number; type?: 'INCOME' | 'EXPENSE'; category?: string; date?: string; description?: string }): Promise<UpdateTransactionResponse> => {
      const response = await this.axiosInstance.patch<UpdateTransactionResponse>(`/households/${householdId}/transactions/${transactionId}`, transactionData);
      return response.data;
    },

    deleteTransaction: async (householdId: string, transactionId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/transactions/${transactionId}`);
    },
  };

  /**
   * Notification Methods
   */
  notifications = {
    getNotifications: async (): Promise<Notification[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Notification[]>>('/notifications');
      return response.data.data;
    },

    markAsRead: async (notificationId: string): Promise<void> => {
      await this.axiosInstance.patch(`/notifications/${notificationId}/read`);
    },

    deleteNotification: async (notificationId: string): Promise<void> => {
      await this.axiosInstance.delete(`/notifications/${notificationId}`);
    },
  };
}

export const apiClient = new ApiClient();