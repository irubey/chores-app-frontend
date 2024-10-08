import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import useCalendar from '../../hooks/useCalendar';
import { Event, EventStatus } from '../../types/event';

interface BulkActionHandlerProps {
  selectedEvents: Event[];
}

const BulkActionHandler: React.FC<BulkActionHandlerProps> = ({ selectedEvents }) => {
  const { deleteEvent, updateEventStatus } = useCalendar();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | null>(null);

  const handleDelete = () => {
    selectedEvents.forEach(event => {
      deleteEvent(event.householdId, event.id);
    });
    setIsDeleteModalVisible(false);
  };

  const handleStatusChange = () => {
    if (selectedStatus) {
      selectedEvents.forEach(event => {
        updateEventStatus(event.householdId, event.id, selectedStatus);
      });
      setIsStatusModalVisible(false);
    }
  };

  return (
    <>
      <Button 
        disabled={selectedEvents.length === 0} 
        onClick={() => setIsDeleteModalVisible(true)}
      >
        Delete Selected
      </Button>
      <Button 
        disabled={selectedEvents.length === 0} 
        onClick={() => setIsStatusModalVisible(true)}
      >
        Update Status
      </Button>

      <Modal
        title="Confirm Deletion"
        visible={isDeleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
      >
        <p>Are you sure you want to delete the selected events?</p>
      </Modal>

      <Modal
        title="Update Event Status"
        visible={isStatusModalVisible}
        onOk={handleStatusChange}
        onCancel={() => setIsStatusModalVisible(false)}
      >
        <p>Select a new status for the selected events:</p>
        <select 
          value={selectedStatus || ''} 
          onChange={(e) => setSelectedStatus(e.target.value as EventStatus)}
        >
          <option value="">Select a status</option>
          {Object.values(EventStatus).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </Modal>
    </>
  );
};

export default BulkActionHandler;