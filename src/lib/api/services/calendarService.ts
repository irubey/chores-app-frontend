import { ApiResponse } from "@shared/interfaces";
import {
  EventWithDetails,
  CreateEventDTO,
  UpdateEventDTO,
  CreateReminderDTO,
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
} from "@shared/types";
import { EventStatus } from "@shared/enums";
import { BaseApiClient } from "../baseClient";
import { logger } from "../logger";

export class CalendarService extends BaseApiClient {
  /**
   * Regular calendar events
   */
  public readonly events = {
    /**
     * Get all events for a household
     */
    getEvents: async (
      householdId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails[]>> => {
      logger.debug("Getting calendar events", { householdId });
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<EventWithDetails[]>>(
          `/households/${householdId}/calendar/events`,
          { signal }
        )
      );
    },

    /**
     * Create a new event
     */
    createEvent: async (
      householdId: string,
      eventData: CreateCalendarEventDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Creating calendar event", { householdId, eventData });
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/calendar/events`,
          eventData,
          { signal }
        )
      );
    },

    /**
     * Get details of a specific event
     */
    getEventDetails: async (
      householdId: string,
      eventId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Getting event details", { householdId, eventId });
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/calendar/events/${eventId}`,
          { signal }
        )
      );
    },

    /**
     * Update an existing event
     */
    updateEvent: async (
      householdId: string,
      eventId: string,
      eventData: UpdateCalendarEventDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Updating calendar event", {
        householdId,
        eventId,
        eventData,
      });
      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/calendar/events/${eventId}`,
          eventData,
          { signal }
        )
      );
    },

    /**
     * Delete an event
     */
    deleteEvent: async (
      householdId: string,
      eventId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<void>> => {
      logger.debug("Deleting calendar event", { householdId, eventId });
      return this.handleRequest(() =>
        this.axiosInstance.delete<ApiResponse<void>>(
          `/households/${householdId}/calendar/events/${eventId}`,
          { signal }
        )
      );
    },

    /**
     * Get events by specific date
     */
    getEventsByDate: async (
      householdId: string,
      date: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails[]>> => {
      logger.debug("Getting events by date", { householdId, date });
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<EventWithDetails[]>>(
          `/households/${householdId}/calendar/events/date/${date}`,
          { signal }
        )
      );
    },

    /**
     * Add a reminder to an event
     */
    addReminder: async (
      householdId: string,
      eventId: string,
      reminderData: CreateReminderDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Adding reminder to event", {
        householdId,
        eventId,
        reminderData,
      });
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/calendar/events/${eventId}/reminders`,
          reminderData,
          { signal }
        )
      );
    },

    /**
     * Remove a reminder from an event
     */
    removeReminder: async (
      householdId: string,
      eventId: string,
      reminderId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<void>> => {
      logger.debug("Removing reminder from event", {
        householdId,
        eventId,
        reminderId,
      });
      return this.handleRequest(() =>
        this.axiosInstance.delete<ApiResponse<void>>(
          `/households/${householdId}/calendar/events/${eventId}/reminders/${reminderId}`,
          { signal }
        )
      );
    },

    /**
     * Update event status
     */
    updateEventStatus: async (
      householdId: string,
      eventId: string,
      status: EventStatus,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Updating event status", { householdId, eventId, status });
      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/calendar/events/${eventId}/status`,
          { status },
          { signal }
        )
      );
    },
  };

  /**
   * Chore-specific calendar events
   */
  public readonly choreEvents = {
    /**
     * Get all chore events
     */
    getChoreEvents: async (
      householdId: string,
      choreId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails[]>> => {
      logger.debug("Getting chore events", { householdId, choreId });
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<EventWithDetails[]>>(
          `/households/${householdId}/chores/${choreId}/events`,
          { signal }
        )
      );
    },

    /**
     * Create a new chore event
     */
    createChoreEvent: async (
      householdId: string,
      choreId: string,
      eventData: CreateEventDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Creating chore event", { householdId, choreId, eventData });
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/chores/${choreId}/events`,
          eventData,
          { signal }
        )
      );
    },

    /**
     * Get details of a specific chore event
     */
    getChoreEventDetails: async (
      householdId: string,
      choreId: string,
      eventId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Getting chore event details", {
        householdId,
        choreId,
        eventId,
      });
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`,
          { signal }
        )
      );
    },

    /**
     * Update a chore event
     */
    updateChoreEvent: async (
      householdId: string,
      choreId: string,
      eventId: string,
      eventData: UpdateEventDTO,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Updating chore event", {
        householdId,
        choreId,
        eventId,
        eventData,
      });
      return this.handleRequest(() =>
        this.axiosInstance.patch<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`,
          eventData,
          { signal }
        )
      );
    },

    /**
     * Delete a chore event
     */
    deleteChoreEvent: async (
      householdId: string,
      choreId: string,
      eventId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<void>> => {
      logger.debug("Deleting chore event", { householdId, choreId, eventId });
      return this.handleRequest(() =>
        this.axiosInstance.delete<ApiResponse<void>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}`,
          { signal }
        )
      );
    },

    /**
     * Complete a chore event
     */
    completeChoreEvent: async (
      householdId: string,
      choreId: string,
      eventId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Completing chore event", {
        householdId,
        choreId,
        eventId,
      });
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}/complete`,
          {},
          { signal }
        )
      );
    },

    /**
     * Reschedule a chore event
     */
    rescheduleChoreEvent: async (
      householdId: string,
      choreId: string,
      eventId: string,
      newDate: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails>> => {
      logger.debug("Rescheduling chore event", {
        householdId,
        choreId,
        eventId,
        newDate,
      });
      return this.handleRequest(() =>
        this.axiosInstance.post<ApiResponse<EventWithDetails>>(
          `/households/${householdId}/chores/${choreId}/events/${eventId}/reschedule`,
          { date: newDate },
          { signal }
        )
      );
    },

    /**
     * Get upcoming chore events
     */
    getUpcomingChoreEvents: async (
      householdId: string,
      choreId: string,
      signal?: AbortSignal
    ): Promise<ApiResponse<EventWithDetails[]>> => {
      logger.debug("Getting upcoming chore events", { householdId, choreId });
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<EventWithDetails[]>>(
          `/households/${householdId}/chores/${choreId}/events/upcoming`,
          { signal }
        )
      );
    },
  };
}
