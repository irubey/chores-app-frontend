import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { fetchEvents, addEvent, updateEvent, deleteEvent } from '../store/slices/calendarSlice';
import { Event } from '../types/event';
import { AppDispatch } from '../store/store'; // Add this import

const useCalendar = () => {
  const dispatch = useDispatch<AppDispatch>(); // Use AppDispatch type

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

  return {
    fetchEvents: fetchEventsAction,
    addEvent: addEventAction,
    updateEvent: updateEventAction,
    deleteEvent: deleteEventAction,
  };
};

export default useCalendar;