import React from 'react';
import { EventContentArg } from '@fullcalendar/core';
import { useCalendar, useHousehold } from '../../hooks';
import { EventStatus } from '../../types/event';

const CalendarEventItem: React.FC<EventContentArg> = ({ event }) => {
  const { deleteEvent, updateEventStatus } = useCalendar();
  const { currentHousehold } = useHousehold();

  if (!currentHousehold) {
    return null; // Or some placeholder/error message
  }

  const handleDelete = () => {
    deleteEvent(currentHousehold.id, event.id);
  };

  const handleStatusChange = (status: EventStatus) => {
    updateEventStatus(currentHousehold.id, event.id, status);
  };

  return (
    <div className="custom-event">
      <strong>{event.title}</strong>
      <div>
        <button onClick={handleDelete}>Delete</button>
        <select 
          value={event.extendedProps.status} 
          onChange={(e) => handleStatusChange(e.target.value as EventStatus)}
        >
          <option value={EventStatus.SCHEDULED}>Scheduled</option>
          <option value={EventStatus.COMPLETED}>Completed</option>
          <option value={EventStatus.CANCELLED}>Cancelled</option>
        </select>
      </div>
    </div>
  );
};

export default CalendarEventItem;