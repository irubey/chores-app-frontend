import { useSelector } from 'react-redux';
import { selectAuth } from '../store/slices/authSlice';
import { selectChores, selectChoresLoading } from '../store/slices/choresSlice';
import { selectFinances } from '../store/slices/financesSlice';
import { selectNotifications } from '../store/slices/notificationsSlice';

const useDashboardData = () => {
  const { user } = useSelector(selectAuth);
  const chores = useSelector(selectChores);
  const choresLoading = useSelector(selectChoresLoading);
  const { expenses, isLoading: financesLoading } = useSelector(selectFinances);
  const { notifications, isLoading: notificationsLoading } = useSelector(selectNotifications);

  const isLoading = choresLoading || financesLoading || notificationsLoading;

  const pendingChores = chores.filter(chore => chore.status === 'PENDING').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const unreadNotifications = notifications.filter(notification => !notification.isRead).length;

  return {
    user,
    isLoading,
    pendingChores,
    totalExpenses,
    unreadNotifications,
  };
};

export default useDashboardData;