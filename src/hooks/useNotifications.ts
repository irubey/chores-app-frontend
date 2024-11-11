import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  fetchNotifications,
  markNotificationAsRead,
  deleteNotification,
  reset,
  selectNotifications,
  selectAllNotifications,
  selectUnreadNotifications,
} from "../store/slices/notificationsSlice";
import { NotificationWithUser } from "@shared/types";
import { logger } from "../lib/api/logger";
import { ApiError } from "../lib/api/errors";

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notificationsState = useSelector(selectNotifications);
  const allNotifications = useSelector(selectAllNotifications);
  const unreadNotifications = useSelector(selectUnreadNotifications);

  const getNotifications = useCallback(async (): Promise<
    NotificationWithUser[]
  > => {
    logger.debug("Fetching notifications");
    try {
      const result = await dispatch(fetchNotifications()).unwrap();
      logger.debug("Successfully fetched notifications", {
        count: result.length,
      });
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error("Failed to fetch notifications", {
          type: error.type,
          message: error.message,
          status: error.status,
        });
      } else {
        logger.error("Failed to fetch notifications with unknown error", {
          error,
        });
      }
      throw error;
    }
  }, [dispatch]);

  const markAsRead = useCallback(
    async (notificationId: string): Promise<NotificationWithUser> => {
      logger.debug("Marking notification as read", { notificationId });
      try {
        const result = await dispatch(
          markNotificationAsRead(notificationId)
        ).unwrap();
        logger.debug("Successfully marked notification as read", {
          notificationId,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to mark notification as read", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error(
            "Failed to mark notification as read with unknown error",
            { error }
          );
        }
        throw error;
      }
    },
    [dispatch]
  );

  const removeNotification = useCallback(
    async (notificationId: string): Promise<string> => {
      logger.debug("Deleting notification", { notificationId });
      try {
        const result = await dispatch(
          deleteNotification(notificationId)
        ).unwrap();
        logger.debug("Successfully deleted notification", { notificationId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to delete notification", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to delete notification with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const resetNotifications = useCallback(() => {
    logger.debug("Resetting notifications state");
    dispatch(reset());
  }, [dispatch]);

  return {
    // State
    notifications: allNotifications,
    unreadNotifications,
    isLoading: notificationsState.isLoading,
    isSuccess: notificationsState.isSuccess,
    isError: notificationsState.isError,
    message: notificationsState.message,

    // Actions
    getNotifications,
    markAsRead,
    removeNotification,
    resetNotifications,
  };
};
