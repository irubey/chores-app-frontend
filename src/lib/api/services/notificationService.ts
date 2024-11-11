import { ApiResponse } from "@shared/interfaces";
import {
  CreateNotificationDTO,
  NotificationWithUser,
  UpdateNotificationDTO,
  NotificationSettingsWithUserAndHousehold,
  UpdateNotificationSettingsDTO,
} from "@shared/types";
import { BaseApiClient } from "../baseClient";
import { logger } from "../logger";

export class NotificationService extends BaseApiClient {
  /**
   * Get all notifications for the current user
   */
  public async getNotifications(
    signal?: AbortSignal
  ): Promise<ApiResponse<NotificationWithUser[]>> {
    logger.debug("Getting notifications");
    return this.handleRequest(() =>
      this.axiosInstance.get<ApiResponse<NotificationWithUser[]>>(
        "/notifications",
        {
          signal,
        }
      )
    );
  }

  /**
   * Create a new notification
   */
  public async createNotification(
    notificationData: CreateNotificationDTO,
    signal?: AbortSignal
  ): Promise<ApiResponse<NotificationWithUser>> {
    logger.debug("Creating notification", { notificationData });
    return this.handleRequest(() =>
      this.axiosInstance.post<ApiResponse<NotificationWithUser>>(
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
  ): Promise<ApiResponse<NotificationWithUser>> {
    logger.debug("Marking notification as read", { notificationId });
    const updateData: UpdateNotificationDTO = { isRead: true };
    return this.handleRequest(() =>
      this.axiosInstance.patch<ApiResponse<NotificationWithUser>>(
        `/notifications/${notificationId}/read`,
        updateData,
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
  ): Promise<ApiResponse<void>> {
    logger.debug("Deleting notification", { notificationId });
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
    ): Promise<ApiResponse<NotificationSettingsWithUserAndHousehold>> => {
      logger.debug("Getting notification settings", { userId, householdId });
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (householdId) params.append("householdId", householdId);

      return this.handleRequest(() =>
        this.axiosInstance.get<
          ApiResponse<NotificationSettingsWithUserAndHousehold>
        >(`/notifications/settings?${params.toString()}`, { signal })
      );
    },

    /**
     * Update notification settings
     */
    updateSettings: async (
      settingsId: string,
      settingsData: UpdateNotificationSettingsDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<NotificationSettingsWithUserAndHousehold>> => {
      logger.debug("Updating notification settings", {
        settingsId,
        settingsData,
      });
      return this.handleRequest(() =>
        this.axiosInstance.patch<
          ApiResponse<NotificationSettingsWithUserAndHousehold>
        >(`/notifications/settings/${settingsId}`, settingsData, { signal })
      );
    },
  };
}
