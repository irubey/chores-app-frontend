// frontend/src/lib/apiClient.ts: Comprehensive API client for Household Management App with strong typing and global error handling

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
  LoginResponse, 
  RegisterResponse, 
  GetHouseholdsResponse, 
  SyncCalendarResponse,
  InviteMemberResponse,
  GetHouseholdEventsResponse,
  CreateEventResponse,
  UpdateEventResponse,
} from '../types/api'; // Define and import your API response types
import { User } from '../types/user';
import { Household, HouseholdMember } from '../types/household';
import { OAuthIntegration } from '../types/oauth';
import { Attachment } from '../types/attachment';
import { UploadResponse } from '../types/upload';
import { Event } from '../types/event';
import { Message, CreateMessageDTO, UpdateMessageDTO } from '../types/message';
import { Chore, CreateChoreDTO, UpdateChoreDTO } from '../types/chore';
import { Expense, CreateExpenseDTO, UpdateExpenseDTO } from '../types/expense';
import { Notification } from '../types/notification';

/**
 * Handles all API interactions with the backend server.
 * Includes interceptors for attaching tokens, refreshing them upon expiration, and global error handling.
 */
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, 
    });

    this.setupInterceptors();
  }

  /**
   * Sets up Axios interceptors for request and response.
   */
  private setupInterceptors() {
    // Request interceptor to attach the access token to headers
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken && config.headers) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh on 401 errors and global error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.auth.refreshToken(refreshToken);
              const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = response;

              // Update tokens in localStorage
              localStorage.setItem('accessToken', newAccessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }

              // Update the Authorization header and retry the original request
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              }
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Optionally, redirect to login page or handle logout
            this.auth.logout();
          }
        }

        // Global error handling
        if (error.response) {
          // Handle known errors
          const { status, data } = error.response as AxiosResponse<{ message?: string; error?: string }>;
          console.error(`API Error: ${status} - ${data.message || data.error || 'Unknown error'}`);
        } else if (error.request) {
          // Handle no response
          console.error('API Error: No response received from server.');
        } else {
          // Handle other errors
          console.error('API Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Authentication Methods
   */
  auth = {
    /**
     * Logs in a user with email and password.
     * @param credentials Object containing email and password.
     */
    login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
      const response = await this.axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      return response.data.data; // Extracted LoginResponse from ApiResponse
    },

    /**
     * Registers a new user.
     * @param data Object containing email, password, and name.
     */
    register: async (data: { email: string; password: string; name: string }): Promise<RegisterResponse> => {
      const response = await this.axiosInstance.post<ApiResponse<User>>('/auth/register', data);
      return response.data;
    },

    /**
     * Refreshes the access token using a refresh token.
     * @param token Refresh token string.
     */
    refreshToken: async (token: string): Promise<LoginResponse> => {
      const response = await this.axiosInstance.post<LoginResponse>('/auth/refresh', { token });
      return response.data;
    },

    /**
     * Logs out the current user.
     */
    logout: async (): Promise<ApiResponse<null>> => {
      const response = await this.axiosInstance.post<ApiResponse<null>>('/auth/logout');
      return response.data;
    },

    /**
     * Integrates OAuth providers for authentication.
     * @param provider OAuth provider name.
     * @param data OAuth tokens and related information.
     */
    oauthIntegrate: async (provider: string, data: { accessToken: string; refreshToken?: string; expiresAt?: Date }): Promise<ApiResponse<OAuthIntegration>> => {
      const response = await this.axiosInstance.post<ApiResponse<OAuthIntegration>>(`/auth/oauth/${provider}`, data);
      return response.data;
    },
  };

  /**
   * Household Management Methods
   */
  households = {
    /**
     * Retrieves all households the user is a member of.
     */
    getHouseholds: async (): Promise<GetHouseholdsResponse> => {
      const response = await this.axiosInstance.get<ApiResponse<Household[]>>('/households');
      return response.data;
    },

    /**
     * Creates a new household.
     * @param data Object containing household details.
     */
    createHousehold: async (data: { name: string }): Promise<ApiResponse<Household>> => {
      const response = await this.axiosInstance.post<ApiResponse<Household>>('/households', data);
      return response.data;
    },

    /**
     * Retrieves details of a specific household.
     * @param householdId The ID of the household.
     */
    getHousehold: async (householdId: string): Promise<ApiResponse<Household>> => {
      const response = await this.axiosInstance.get<ApiResponse<Household>>(`/households/${householdId}`);
      return response.data;
    },

    /**
     * Updates a specific household.
     * @param householdId The ID of the household.
     * @param data Object containing updates.
     */
    updateHousehold: async (householdId: string, data: Partial<Household>): Promise<ApiResponse<Household>> => {
      const response = await this.axiosInstance.patch<ApiResponse<Household>>(`/households/${householdId}`, data);
      return response.data;
    },

    /**
     * Deletes a specific household.
     * @param householdId The ID of the household.
     */
    deleteHousehold: async (householdId: string): Promise<ApiResponse<null>> => {
      const response = await this.axiosInstance.delete<ApiResponse<null>>(`/households/${householdId}`);
      return response.data;
    },

    /**
     * Syncs household calendar with external providers.
     * @param householdId The ID of the household.
     * @param data SyncCalendarDTO containing provider and access token.
     */
    syncCalendar: async (householdId: string, data: { provider: string; accessToken: string }): Promise<SyncCalendarResponse> => {
      const response = await this.axiosInstance.post<ApiResponse<Event[]>>(`/households/${householdId}/calendar/sync`, data);
      return response.data;
    },

    /**
     * Fetches all events for a specific household.
     * @param householdId The ID of the household.
     */
    getHouseholdEvents: async (householdId: string): Promise<GetHouseholdEventsResponse> => {
      const response = await this.axiosInstance.get<GetHouseholdEventsResponse>(`/households/${householdId}/events`);
      return response.data;
    },

    /**
     * Creates a new event for a specific household.
     * @param householdId The ID of the household.
     * @param eventData The data for the new event.
     */
    createEvent: async (householdId: string, eventData: Partial<Event>): Promise<CreateEventResponse> => {
      const response = await this.axiosInstance.post<CreateEventResponse>(`/households/${householdId}/events`, eventData);
      return response.data;
    },

    /**
     * Updates an existing event for a specific household.
     * @param householdId The ID of the household.
     * @param eventId The ID of the event to update.
     * @param eventData The updated data for the event.
     */
    updateEvent: async (householdId: string, eventId: string, eventData: Partial<Event>): Promise<UpdateEventResponse> => {
      const response = await this.axiosInstance.patch<UpdateEventResponse>(`/households/${householdId}/events/${eventId}`, eventData);
      return response.data;
    },

    /**
     * Deletes an event from a specific household.
     * @param householdId The ID of the household.
     * @param eventId The ID of the event to delete.
     */
    deleteEvent: async (householdId: string, eventId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/events/${eventId}`);
    },

    // Add more household-related methods as needed
  };

  /**
   * Household Member Management Methods
   */
  householdMembers = {
    /**
     * Retrieves all members of a household.
     * @param householdId The ID of the household.
     */
    getMembers: async (householdId: string): Promise<ApiResponse<HouseholdMember[]>> => {
      const response = await this.axiosInstance.get<ApiResponse<HouseholdMember[]>>(`/households/${householdId}/members`);
      return response.data;
    },

    /**
     * Invites a new member to the household.
     * @param householdId The ID of the household.
     * @param data Invitation details.
     */
    inviteMember: async (householdId: string, data: { email: string; role?: 'ADMIN' | 'MEMBER' }): Promise<InviteMemberResponse> => {
      const response = await this.axiosInstance.post<ApiResponse<HouseholdMember>>(`/households/${householdId}/invitations`, data);
      return response.data;
    },

    /**
     * Removes a member from the household.
     * @param householdId The ID of the household.
     * @param memberId The ID of the member to remove.
     */
    removeMember: async (householdId: string, memberId: string): Promise<ApiResponse<null>> => {
      const response = await this.axiosInstance.delete<ApiResponse<null>>(`/households/${householdId}/members/${memberId}`);
      return response.data;
    },

    // Add more household member-related methods as needed
  };

  /**
   * Utility Methods
   */
  utils = {
    /**
     * Uploads a file to the server.
     * @param file The file to upload.
     */
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

    /**
     * Fetches attachment details.
     * @param attachmentId The ID of the attachment.
     */
    getAttachment: async (attachmentId: string): Promise<ApiResponse<Attachment>> => {
      const response = await this.axiosInstance.get<ApiResponse<Attachment>>(`/attachments/${attachmentId}`);
      return response.data;
    },

    // Add more utility-related methods as needed
  };

  /**
   * Messaging Methods
   */
  messages = {
    /**
     * Retrieves all messages in a household.
     */
    getMessages: async (householdId: string): Promise<Message[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Message[]>>(`/households/${householdId}/messages`);
      return response.data.data;
    },

    /**
     * Creates a new message.
     */
    createMessage: async (householdId: string, data: CreateMessageDTO): Promise<Message> => {
      const response = await this.axiosInstance.post<ApiResponse<Message>>(`/households/${householdId}/messages`, data);
      return response.data.data;
    },

    /**
     * Updates an existing message.
     * @param householdId The ID of the household.
     * @param messageId The ID of the message to update.
     * @param data The updated message data.
     */
    updateMessage: async (householdId: string, messageId: string, data: UpdateMessageDTO): Promise<Message> => {
      const response = await this.axiosInstance.patch<ApiResponse<Message>>(`/households/${householdId}/messages/${messageId}`, data);
      return response.data.data;
    },

    /**
     * Deletes a message.
     * @param householdId The ID of the household.
     * @param messageId The ID of the message to delete.
     */
    deleteMessage: async (householdId: string, messageId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/messages/${messageId}`);
    },
  };

  /**
   * Chore Management Methods
   */
  chores = {
    /**
     * Retrieves all chores in a household.
     */
    getChores: async (householdId: string): Promise<Chore[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Chore[]>>(`/households/${householdId}/chores`);
      return response.data.data;
    },

    /**
     * Creates a new chore.
     */
    createChore: async (householdId: string, choreData: CreateChoreDTO): Promise<Chore> => {
      const response = await this.axiosInstance.post<ApiResponse<Chore>>(`/households/${householdId}/chores`, choreData);
      return response.data.data;
    },

    /**
     * Updates an existing chore.
     */
    updateChore: async (householdId: string, choreId: string, choreData: UpdateChoreDTO): Promise<Chore> => {
      const response = await this.axiosInstance.patch<ApiResponse<Chore>>(`/households/${householdId}/chores/${choreId}`, choreData);
      return response.data.data;
    },

    /**
     * Deletes a chore.
     */
    deleteChore: async (householdId: string, choreId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/chores/${choreId}`);
    },

    // ... additional chore methods ...
  };

  /**
   * Finances Management Methods
   */
  finances = {
    /**
     * Retrieves all expenses in a household.
     */
    getExpenses: async (householdId: string): Promise<ApiResponse<Expense[]>> => {
      const response = await this.axiosInstance.get<ApiResponse<Expense[]>>(`/households/${householdId}/expenses`);
      return response.data;
    },

    /**
     * Creates a new expense.
     */
    createExpense: async (householdId: string, expenseData: CreateExpenseDTO): Promise<ApiResponse<Expense>> => {
      const response = await this.axiosInstance.post<ApiResponse<Expense>>(`/households/${householdId}/expenses`, expenseData);
      return response.data;
    },

    /**
     * Updates an existing expense.
     */
    updateExpense: async (householdId: string, expenseId: string, expenseData: UpdateExpenseDTO): Promise<ApiResponse<Expense>> => {
      const response = await this.axiosInstance.patch<ApiResponse<Expense>>(`/households/${householdId}/expenses/${expenseId}`, expenseData);
      return response.data;
    },

    /**
     * Deletes an expense.
     */
    deleteExpense: async (householdId: string, expenseId: string): Promise<void> => {
      await this.axiosInstance.delete(`/households/${householdId}/expenses/${expenseId}`);
    },

    // ... other finances-related methods ...
  };

  /**
   * Notification Methods
   */
  notifications = {
    /**
     * Retrieves all notifications for the authenticated user.
     */
    getNotifications: async (): Promise<Notification[]> => {
      const response = await this.axiosInstance.get<ApiResponse<Notification[]>>('/notifications');
      return response.data.data;
    },

    /**
     * Marks a specific notification as read.
     * @param notificationId The ID of the notification to mark as read.
     */
    markAsRead: async (notificationId: string): Promise<void> => {
      await this.axiosInstance.patch(`/notifications/${notificationId}/read`);
    },
    
    // Add more notification-related methods as needed
  };

  // ... similarly add calendar and other feature methods ...
}

export const apiClient = new ApiClient();