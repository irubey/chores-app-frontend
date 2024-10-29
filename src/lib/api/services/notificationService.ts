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
    const response = await this.axiosInstance.get<ApiResponse<Notification[]>>(
      "/notifications",
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Create a new notification
   */
  public async createNotification(
    notificationData: CreateNotificationDTO,
    signal?: AbortSignal
  ): Promise<Notification> {
    const response = await this.axiosInstance.post<ApiResponse<Notification>>(
      "/notifications",
      notificationData,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Mark a notification as read
   */
  public async markNotificationAsRead(
    notificationId: string,
    signal?: AbortSignal
  ): Promise<Notification> {
    const response = await this.axiosInstance.patch<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`,
      { signal }
    );
    return this.extractData(response);
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(
    notificationId: string,
    signal?: AbortSignal
  ): Promise<void> {
    await this.axiosInstance.delete(`/notifications/${notificationId}`, {
      signal,
    });
  }

  /**
   * Notification settings management
   */
  public readonly settings = {
    /**
     * Get notification settings for the current user
     */
    getSettings: async (
      signal?: AbortSignal
    ): Promise<NotificationSettings> => {
      const response = await this.axiosInstance.get<
        ApiResponse<NotificationSettings>
      >("/notifications/settings", { signal });
      return this.extractData(response);
    },

    /**
     * Update notification settings
     */
    updateSettings: async (
      settingsId: string,
      settingsData: UpdateNotificationSettingsDTO,
      signal?: AbortSignal
    ): Promise<NotificationSettings> => {
      const response = await this.axiosInstance.patch<
        ApiResponse<NotificationSettings>
      >(`/notifications/settings/${settingsId}`, settingsData, { signal });
      return this.extractData(response);
    },
  };
}
