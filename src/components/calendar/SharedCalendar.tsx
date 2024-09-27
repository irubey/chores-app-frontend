'use client'
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Event } from '../../types/event';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

moment.locale('en-GB');
const localizer = momentLocalizer(moment);

interface SharedCalendarProps {
  events: Event[];
  onEventUpdate: (householdId: string, eventId: string, event: Partial<Event>) => void;
  onEventDelete: (householdId: string, eventId: string) => void;
}

const SharedCalendar: React.FC<SharedCalendarProps> = ({ events, onEventUpdate, onEventDelete }) => {
  const currentHousehold = useSelector((state: RootState) => state.household.currentHousehold);

  const handleSelectEvent = (event: Event) => {
    // Implement logic to open event details modal or form
    console.log('Selected event:', event);
  };

  const handleEventDrop = ({ event, start, end }: any) => {
    onEventUpdate(currentHousehold.id, event.id, { ...event, start, end });
  };

  const handleEventResize = ({ event, start, end }: any) => {
    onEventUpdate(currentHousehold.id, event.id, { ...event, start, end });
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        resizable
        selectable
      />
    </div>
  );
};

export default SharedCalendar;