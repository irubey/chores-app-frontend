import { useEffect } from 'react';
import { notification } from 'antd';
import { useCalendar } from '../../hooks';

const ErrorNotification = () => {
  const { isError, message } = useCalendar();

  useEffect(() => {
    if (isError) {
      notification.error({ message: 'Calendar Error', description: message });
    }
  }, [isError, message]);

  return null;
};

export default ErrorNotification;