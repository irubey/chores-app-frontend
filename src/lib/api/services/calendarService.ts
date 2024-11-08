import { ApiResponse } from "@shared/interfaces";
import {
  Event,
  EventWithDetails,
  CreateEventDTO,
  UpdateEventDTO,
  CreateReminderDTO,
} from "@shared/types";
import { BaseApiClient } from "../baseClient";

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
    ): Promise<EventWithDetails[]> => {
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
      eventData: CreateEventDTO,
      signal?: AbortSignal
    ): Promise<EventWithDetails> => {
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
    ): Promise<EventWithDetails> => {
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
      eventData: UpdateEventDTO,
      signal?: AbortSignal
    ): Promise<EventWithDetails> => {
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
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/calendar/events/${eventId}`,
        { signal }
      );
    },

    /**
     * Get events by specific date
     */
    getEventsByDate: async (
      householdId: string,
      date: string, // ISO date string YYYY-MM-DD
      signal?: AbortSignal
    ): Promise<EventWithDetails[]> => {
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
    ): Promise<EventWithDetails> => {
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
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/calendar/events/${eventId}/reminders/${reminderId}`,
        { signal }
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
    ): Promise<EventWithDetails[]> => {
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
    ): Promise<EventWithDetails> => {
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
    ): Promise<EventWithDetails> => {
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
    ): Promise<EventWithDetails> => {
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
    ): Promise<void> => {
      await this.axiosInstance.delete(
        `/households/${householdId}/chores/${choreId}/events/${eventId}`,
        { signal }
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
    ): Promise<EventWithDetails> => {
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
    ): Promise<EventWithDetails> => {
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
    ): Promise<EventWithDetails[]> => {
      return this.handleRequest(() =>
        this.axiosInstance.get<ApiResponse<EventWithDetails[]>>(
          `/households/${householdId}/chores/${choreId}/events/upcoming`,
          { signal }
        )
      );
    },
  };
}
