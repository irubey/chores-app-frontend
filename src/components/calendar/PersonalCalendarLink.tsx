import React, { useEffect } from 'react';
import { Button, notification } from 'antd';
import { useCalendar, useAuth, useHousehold } from '../../hooks';

const PersonalCalendarLink: React.FC = () => {
  const { syncCalendar, isSynced, syncError, isLoading, isSuccess, isError } = useCalendar();
  const { currentHousehold } = useHousehold();
  const { user } = useAuth();

  const handleLink = () => {
    if (currentHousehold && currentHousehold.id) {
      // Initiate OAuth flow for calendar providers like Google
      syncCalendar(currentHousehold.id, 'google');
    } else {
      notification.error({ message: 'Error', description: 'No current household selected' });
    }
  };

  useEffect(() => {
    if (isError && syncError) {
      notification.error({ message: 'Sync Error', description: syncError });
    } else if (isSuccess && isSynced) {
      notification.success({ message: 'Calendar Synced Successfully' });
    }
  }, [isSuccess, isError, isSynced, syncError]);

  return (
    <Button onClick={handleLink} loading={isLoading} disabled={isLoading}>
      {isLoading ? 'Syncing...' : 'Link Personal Calendar'}
    </Button>
  );
};

export default PersonalCalendarLink;