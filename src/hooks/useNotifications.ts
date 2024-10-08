import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  fetchNotifications,
  markNotificationAsRead,
  deleteNotification,
  reset,
} from "../store/slices/notificationsSlice";

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notificationsState = useSelector(
    (state: RootState) => state.notifications
  );

  const getNotifications = () => dispatch(fetchNotifications());
  const markAsRead = (notificationId: string) =>
    dispatch(markNotificationAsRead(notificationId));
  const removeNotification = (notificationId: string) =>
    dispatch(deleteNotification(notificationId));
  const resetNotifications = () => dispatch(reset());

  return {
    ...notificationsState,
    getNotifications,
    markAsRead,
    removeNotification,
    resetNotifications,
  };
};
