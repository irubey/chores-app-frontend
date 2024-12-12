import { Button, notification, Select } from 'antd';
import { useCalendar, useHousehold } from '../../hooks';
import React,{ useEffect, useState } from 'react';

const { Option } = Select;

const CalendarSync: React.FC = () => {
  const { syncCalendar, isSynced, syncError, isLoading, syncProvider } = useCalendar();
  const { currentHousehold } = useHousehold();
  const [selectedProvider, setSelectedProvider] = useState<string>(syncProvider || 'google');

  const handleSync = () => {
    if (currentHousehold) {
      syncCalendar(currentHousehold.id, selectedProvider);
    } else {
      notification.error({ message: 'No household selected', description: 'Please select a household before syncing.' });
    }
  };

  useEffect(() => {
    if (syncError) {
      notification.error({ message: 'Sync Failed', description: syncError });
    } else if (isSynced) {
      notification.success({ message: 'Calendar Synced Successfully' });
    }
  }, [isSynced, syncError]);

  return (
    <div>
      <Select 
        value={selectedProvider} 
        onChange={setSelectedProvider}
        style={{ width: 120, marginRight: 8 }}
      >
        <Option value="google">Google</Option>
        <Option value="outlook">Outlook</Option>
        <Option value="apple">Apple</Option>
      </Select>
      <Button 
        onClick={handleSync} 
        loading={isLoading}
        disabled={!currentHousehold}
      >
        Sync Calendar
      </Button>
    </div>
  );
};

export default CalendarSync;