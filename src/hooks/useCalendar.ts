import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents, addEvent, updateEvent, deleteEvent, syncCalendar, scheduleChores, selectCalendar } from '../store/slices/calendarSlice';
import { Event } from '../types/event';
import { AppDispatch } from '../store/store';

const useCalendar = () => {
  const dispatch = useDispatch<AppDispatch>();

  const calendarState = useSelector(selectCalendar);

  const fetchEventsAction = useCallback((householdId: string) => {
    dispatch(fetchEvents(householdId));
  }, [dispatch]);

  const addEventAction = useCallback((householdId: string, event: Partial<Event>) => {
    dispatch(addEvent({ householdId, eventData: event }));
  }, [dispatch]);

  const updateEventAction = useCallback((householdId: string, eventId: string, event: Partial<Event>) => {
    dispatch(updateEvent({ householdId, eventId, eventData: event }));
  }, [dispatch]);

  const deleteEventAction = useCallback((householdId: string, eventId: string) => {
    dispatch(deleteEvent({ householdId, eventId }));
  }, [dispatch]);

  const syncCalendarAction = useCallback((householdId: string, provider: string) => {
    dispatch(syncCalendar({ householdId, provider }));
  }, [dispatch]);

  const scheduleChoresAction = useCallback((householdId: string) => {
    dispatch(scheduleChores(householdId));
  }, [dispatch]);

  return {
    ...calendarState,
    fetchEvents: fetchEventsAction,
    addEvent: addEventAction,
    updateEvent: updateEventAction,
    deleteEvent: deleteEventAction,
    syncCalendar: syncCalendarAction,
    scheduleChores: scheduleChoresAction,
  };
};

export default useCalendar;