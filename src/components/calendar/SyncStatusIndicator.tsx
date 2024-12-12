import React from 'react';
import { Badge } from 'antd';
import { useCalendar } from '../../hooks';

const SyncStatusIndicator: React.FC = () => {
  const { isSynced, syncProvider, syncError, lastSync } = useCalendar();

  if (syncError) {
    return <Badge status="error" text={`Sync Failed: ${syncError}`} />;
  }

  if (isSynced && syncProvider) {
    const lastSyncDate = lastSync ? new Date(lastSync).toLocaleString() : 'Unknown';
    return (
      <Badge 
        status="success" 
        text={`Synced with ${syncProvider} (Last sync: ${lastSyncDate})`} 
      />
    );
  }

  if (isSynced) {
    return <Badge status="success" text="Synced" />;
  }

  return <Badge status="processing" text="Not synced" />;
};

export default SyncStatusIndicator;