import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import {
  fetchEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  reset,
  selectCalendar,
} from "../store/slices/calendarSlice";
import { EventStatus } from "@shared/enums";
import {
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
  EventWithDetails,
} from "@shared/types";
import { logger } from "../lib/api/logger";
import { ApiError } from "../lib/api/errors";

export const useCalendar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const calendarState = useSelector(selectCalendar);

  const getEvents = useCallback(
    async (householdId: string): Promise<EventWithDetails[]> => {
      logger.debug("Fetching calendar events", { householdId });
      try {
        const result = await dispatch(fetchEvents(householdId)).unwrap();
        logger.debug("Successfully fetched calendar events", {
          count: result.length,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to fetch calendar events", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to fetch calendar events with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const createEvent = useCallback(
    async (
      householdId: string,
      eventData: CreateCalendarEventDTO
    ): Promise<EventWithDetails> => {
      logger.debug("Creating calendar event", { householdId, eventData });
      try {
        const result = await dispatch(
          addEvent({ householdId, eventData })
        ).unwrap();
        logger.debug("Successfully created calendar event", {
          eventId: result.id,
        });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to create calendar event", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to create calendar event with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const editEvent = useCallback(
    async (
      householdId: string,
      eventId: string,
      eventData: UpdateCalendarEventDTO
    ): Promise<EventWithDetails> => {
      logger.debug("Updating calendar event", {
        householdId,
        eventId,
        eventData,
      });
      try {
        const result = await dispatch(
          updateEvent({ householdId, eventId, eventData })
        ).unwrap();
        logger.debug("Successfully updated calendar event", { eventId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to update calendar event", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to update calendar event with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const removeEvent = useCallback(
    async (householdId: string, eventId: string): Promise<string> => {
      logger.debug("Deleting calendar event", { householdId, eventId });
      try {
        const result = await dispatch(
          deleteEvent({ householdId, eventId })
        ).unwrap();
        logger.debug("Successfully deleted calendar event", { eventId });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to delete calendar event", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to delete calendar event with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const changeEventStatus = useCallback(
    async (
      householdId: string,
      eventId: string,
      status: EventStatus
    ): Promise<EventWithDetails> => {
      logger.debug("Updating event status", { householdId, eventId, status });
      try {
        const result = await dispatch(
          updateEventStatus({ householdId, eventId, status })
        ).unwrap();
        logger.debug("Successfully updated event status", { eventId, status });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error("Failed to update event status", {
            type: error.type,
            message: error.message,
            status: error.status,
          });
        } else {
          logger.error("Failed to update event status with unknown error", {
            error,
          });
        }
        throw error;
      }
    },
    [dispatch]
  );

  const resetCalendar = useCallback(() => {
    logger.debug("Resetting calendar state");
    dispatch(reset());
  }, [dispatch]);

  return {
    // State
    events: calendarState.events,
    isLoading: calendarState.isLoading,
    isSuccess: calendarState.isSuccess,
    isError: calendarState.isError,
    message: calendarState.message,
    isSynced: calendarState.isSynced,
    syncProvider: calendarState.syncProvider,
    lastSync: calendarState.lastSync,
    syncError: calendarState.syncError,

    // Actions
    getEvents,
    createEvent,
    editEvent,
    removeEvent,
    changeEventStatus,
    resetCalendar,
  };
};
