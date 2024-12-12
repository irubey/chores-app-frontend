import { useEffect } from 'react';
import { notification } from 'antd';
import { useCalendar, useHousehold } from '../../hooks';
import { Event } from '../../types/event';

const EventNotifications = () => {
  const { events, isLoading, isError, message, fetchEvents } = useCalendar();
  const { currentHousehold } = useHousehold();

  useEffect(() => {
    if (currentHousehold) {
      fetchEvents(currentHousehold.id);
    }
  }, [currentHousehold, fetchEvents]);

  useEffect(() => {
    if (!isLoading && isError) {
      notification.error({ message: 'Error', description: message });
    }
  }, [isLoading, isError, message]);

  useEffect(() => {
    const upcomingEvents = events.filter((event: Event) => {
      const eventDate = new Date(event.startTime);
      const now = new Date();
      const timeDiff = eventDate.getTime() - now.getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      return minutesDiff > 0 && minutesDiff <= 30; // Events starting within the next 30 minutes
    });

    upcomingEvents.forEach((event: Event) => {
      notification.info({
        message: 'Upcoming Event',
        description: `${event.title} starts in ${Math.floor((new Date(event.startTime).getTime() - new Date().getTime()) / (1000 * 60))} minutes`,
      });
    });
  }, [events]);

  return null; // Notification logic handled via useEffect
};

export default EventNotifications;