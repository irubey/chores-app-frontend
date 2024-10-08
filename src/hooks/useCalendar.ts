import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  fetchEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  syncCalendar,
  reset,
  selectCalendar,
} from "../store/slices/calendarSlice";
import { Event, EventStatus } from "../types/event";

export const useCalendar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const calendarState = useSelector(selectCalendar);

  const getEvents = (householdId: string) => dispatch(fetchEvents(householdId));
  const createEvent = (householdId: string, eventData: Partial<Event>) =>
    dispatch(addEvent({ householdId, eventData }));
  const editEvent = (
    householdId: string,
    eventId: string,
    eventData: Partial<Event>
  ) => dispatch(updateEvent({ householdId, eventId, eventData }));
  const removeEvent = (householdId: string, eventId: string) =>
    dispatch(deleteEvent({ householdId, eventId }));
  const changeEventStatus = (
    householdId: string,
    eventId: string,
    status: EventStatus
  ) => dispatch(updateEventStatus({ householdId, eventId, status }));
  const syncCalendarWithProvider = (householdId: string, provider: string) =>
    dispatch(syncCalendar({ householdId, provider }));
  const resetCalendar = () => dispatch(reset());

  return {
    ...calendarState,
    getEvents,
    createEvent,
    editEvent,
    removeEvent,
    changeEventStatus,
    syncCalendarWithProvider,
    resetCalendar,
  };
};
