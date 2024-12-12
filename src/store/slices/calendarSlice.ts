import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/api/apiClient";
import { RootState } from "../store";
import { logger } from "@/lib/api/logger";
import {
  EventWithDetails,
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
} from "@shared/types";
import { Provider, EventStatus } from "@shared/enums";
import { ApiError } from "@/lib/api/errors";

interface CalendarState {
  events: EventWithDetails[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  isSynced: boolean;
  syncProvider: Provider | null;
  lastSync: string | null;
  syncError: string | null;
}

const initialState: CalendarState = {
  events: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  isSynced: false,
  syncProvider: null,
  lastSync: null,
  syncError: null,
};

// Async thunks
export const fetchEvents = createAsyncThunk<
  EventWithDetails[],
  string,
  { rejectValue: string }
>("calendar/fetchEvents", async (householdId, thunkAPI) => {
  try {
    logger.debug("Fetching calendar events", { householdId });
    const response = await apiClient.calendar.events.getEvents(householdId);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to fetch events");
  }
});

export const addEvent = createAsyncThunk<
  EventWithDetails,
  { householdId: string; eventData: CreateCalendarEventDTO },
  { rejectValue: string }
>("calendar/addEvent", async ({ householdId, eventData }, thunkAPI) => {
  try {
    logger.debug("Adding calendar event", { householdId, eventData });
    const response = await apiClient.calendar.events.createEvent(
      householdId,
      eventData
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to add event");
  }
});

export const updateEvent = createAsyncThunk<
  EventWithDetails,
  { householdId: string; eventId: string; eventData: UpdateCalendarEventDTO },
  { rejectValue: string }
>(
  "calendar/updateEvent",
  async ({ householdId, eventId, eventData }, thunkAPI) => {
    try {
      logger.debug("Updating calendar event", {
        householdId,
        eventId,
        eventData,
      });
      const response = await apiClient.calendar.events.updateEvent(
        householdId,
        eventId,
        eventData
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue("Failed to update event");
    }
  }
);

export const deleteEvent = createAsyncThunk<
  string,
  { householdId: string; eventId: string },
  { rejectValue: string }
>("calendar/deleteEvent", async ({ householdId, eventId }, thunkAPI) => {
  try {
    logger.debug("Deleting calendar event", { householdId, eventId });
    await apiClient.calendar.events.deleteEvent(householdId, eventId);
    return eventId;
  } catch (error) {
    if (error instanceof ApiError) {
      return thunkAPI.rejectWithValue(error.message);
    }
    return thunkAPI.rejectWithValue("Failed to delete event");
  }
});

export const updateEventStatus = createAsyncThunk<
  EventWithDetails,
  { householdId: string; eventId: string; status: EventStatus },
  { rejectValue: string }
>(
  "calendar/updateEventStatus",
  async ({ householdId, eventId, status }, thunkAPI) => {
    try {
      logger.debug("Updating event status", { householdId, eventId, status });
      const response = await apiClient.calendar.events.updateEventStatus(
        householdId,
        eventId,
        status
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue("Failed to update event status");
    }
  }
);

// Slice
const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        fetchEvents.fulfilled,
        (state, action: PayloadAction<EventWithDetails[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.events = action.payload;
        }
      )
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to fetch events";
      })
      // Add Event
      .addCase(addEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        addEvent.fulfilled,
        (state, action: PayloadAction<EventWithDetails>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.events.push(action.payload);
        }
      )
      .addCase(addEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to add event";
      })
      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateEvent.fulfilled,
        (state, action: PayloadAction<EventWithDetails>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.events.findIndex(
            (event) => event.id === action.payload.id
          );
          if (index !== -1) {
            state.events[index] = action.payload;
          }
        }
      )
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to update event";
      })
      // Delete Event
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        deleteEvent.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.events = state.events.filter(
            (event) => event.id !== action.payload
          );
        }
      )
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to delete event";
      })
      // Update Event Status
      .addCase(updateEventStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateEventStatus.fulfilled,
        (state, action: PayloadAction<EventWithDetails>) => {
          state.isLoading = false;
          state.isSuccess = true;
          const index = state.events.findIndex(
            (event) => event.id === action.payload.id
          );
          if (index !== -1) {
            state.events[index] = action.payload;
          }
        }
      )
      .addCase(updateEventStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload ?? "Failed to update event status";
      });
  },
});

export const { reset } = calendarSlice.actions;
export const selectCalendar = (state: RootState) => state.calendar;
export default calendarSlice.reducer;
