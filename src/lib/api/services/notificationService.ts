import { ApiResponse } from "@shared/interfaces";
import {
  Notification,
  CreateNotificationDTO,
  NotificationSettings,
  UpdateNotificationSettingsDTO,
} from "@shared/types";
import { BaseApiClient } from "../baseClient";

export class NotificationService extends BaseApiClient {
  /**
   * Get all notifications for the current user
   */
  public async getNotifications(signal?: AbortSignal): Promise<Notification[]> {
    return this.handleRequest(() =>
      this.axiosInstance.get<ApiResponse<Notification[]>>("/notifications", {
        signal,
      })
    );
  }

  /**
   * Create a new notification
   */
  public async createNotification(
    notificationData: CreateNotificationDTO,
    signal?: AbortSignal
  ): Promise<Notification> {
    return this.handleRequest(() =>
      this.axiosInstance.post<ApiResponse<Notification>>(
        "/notifications",
        notificationData,
        { signal }
      )
    );
  }

  /**
   * Mark a notification as read
   */
  public async markNotificationAsRead(
    notificationId: string,
    signal?: AbortSignal
  ): Promise<Notification> {
    return this.handleRequest(() =>
      this.axiosInstance.patch<ApiResponse<Notification>>(
        `/notifications/${notificationId}/read`,
        {},
        { signal }
      )
    );
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(
    notificationId: string,
    signal?: AbortSignal
  ): Promise<void> {
    return this.handleRequest(() =>
      this.axiosInstance.delete<ApiResponse<void>>(
        `/notifications/${notificationId}`,
        { signal }
      )
    );
  }

  /**
   * Notification settings management
   */
  public readonly settings = {
    /**
     * Get notification settings for the current user
     */
    getSettings: async (
      userId?: string,
      householdId?: string,
      signal?: AbortSignal
    ): Promise<NotificationSettings> => {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (householdId) params.append("householdId", householdId);

      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<NotificationSettings>>(
          `/notifications/settings?${params.toString()}`,
          { signal }
        )
      );
    },

    /**
     * Update notification settings
     */
    updateSettings: async (
      settingsId: string,
      settingsData: Partial<NotificationSettings>,
      signal?: AbortSignal
    ): Promise<NotificationSettings> => {
      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<NotificationSettings>>(
          `/notifications/settings/${settingsId}`,
          settingsData,
          { signal }
        )
      );
    },
  };
}
