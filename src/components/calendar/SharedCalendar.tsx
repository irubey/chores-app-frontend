import React, { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useCalendar, useHousehold } from "../../hooks";
import EventModal from "./EventModal";
import CalendarHeader from "./CalendarHeader";
import CalendarToolbar from "./CalendarToolbar";
import CalendarSync from "./CalendarSync";
import BulkActionHandler from "./BulkActionHandler";
import CalendarEventItem from "./CalendarEventItem";
import ErrorNotification from "./ErrorNotification";
import SyncStatusIndicator from "./SyncStatusIndicator";
import PersonalCalendarLink from "./PersonalCalendarLink";
import { Event } from "../../types/event";

interface SharedCalendarProps {
  onEventClick?: (event: Event) => void;
}

const SharedCalendar: React.FC<SharedCalendarProps> = ({ onEventClick }) => {
  const { events, getEvents } = useCalendar();
  const { currentHousehold } = useHousehold();
  const calendarRef = useRef<FullCalendar>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<Event> | null>(
    null
  );
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (currentHousehold) {
      getEvents(currentHousehold.id);
    }
  }, [currentHousehold, getEvents]);

  const handleDateClick = (selectInfo: any) => {
    setSelectedEvent({
      startTime: selectInfo.dateStr,
      endTime: selectInfo.dateStr,
    });
    setIsModalVisible(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event.extendedProps as Event;
    setSelectedEvent(event);
    setIsModalVisible(true);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  };

  const handleSelectEvents = (selectInfo: any) => {
    const selectedEvents = selectInfo.api
      .getEvents()
      .filter(
        (event: any) =>
          event.start >= selectInfo.start && event.end <= selectInfo.end
      )
      .map((event: any) => event.extendedProps);
    setSelectedEvents(selectedEvents);
  };

  return (
    <div className="shared-calendar">
      <CalendarHeader />
      <CalendarToolbar calendarRef={calendarRef} />
      <CalendarSync />
      <SyncStatusIndicator />
      <PersonalCalendarLink />
      <BulkActionHandler selectedEvents={selectedEvents} />
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        select={handleSelectEvents}
        selectable={true}
        headerToolbar={false}
        eventContent={(eventInfo) => <CalendarEventItem {...eventInfo} />}
      />
      <EventModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        eventData={selectedEvent}
      />
      <ErrorNotification />
    </div>
  );
};

export default SharedCalendar;
