import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/api/apiClient";
import {
  Event,
  EventStatus,
  EventRecurrence,
  EventCategory,
} from "../../types/event";
import { RootState } from "../store";
import { SyncCalendarResponse } from "@/types/api";

interface CalendarState {
  events: Event[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  isSynced: boolean;
  syncProvider: string | null;
  lastSync: string | null; // ISO string format
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
  Event[],
  string,
  { rejectValue: string }
>("calendar/fetchEvents", async (householdId, thunkAPI) => {
  try {
    const events = await apiClient.calendar.events.getEvents(householdId);
    return events;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch events";
    return thunkAPI.rejectWithValue(message);
  }
});

export const addEvent = createAsyncThunk<
  Event,
  { householdId: string; eventData: Partial<Event> },
  { rejectValue: string }
>("calendar/addEvent", async ({ householdId, eventData }, thunkAPI) => {
  try {
    const event = await apiClient.calendar.events.createEvent(
      householdId,
      eventData
    );
    return event;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Failed to add event";
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateEvent = createAsyncThunk<
  Event,
  { householdId: string; eventId: string; eventData: Partial<Event> },
  { rejectValue: string }
>(
  "calendar/updateEvent",
  async ({ householdId, eventId, eventData }, thunkAPI) => {
    try {
      const event = await apiClient.calendar.events.updateEvent(
        householdId,
        eventId,
        eventData
      );
      return event;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update event";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteEvent = createAsyncThunk<
  string,
  { householdId: string; eventId: string },
  { rejectValue: string }
>("calendar/deleteEvent", async ({ householdId, eventId }, thunkAPI) => {
  try {
    await apiClient.calendar.events.deleteEvent(householdId, eventId);
    return eventId;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete event";
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateEventStatus = createAsyncThunk<
  Event,
  { householdId: string; eventId: string; status: EventStatus },
  { rejectValue: string }
>(
  "calendar/updateEventStatus",
  async ({ householdId, eventId, status }, thunkAPI) => {
    try {
      const event = await apiClient.calendar.events.updateEventStatus(
        householdId,
        eventId,
        status
      );
      return event;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update event status";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const syncCalendar = createAsyncThunk<
  SyncCalendarResponse["data"],
  { householdId: string; provider: string },
  { rejectValue: string }
>("calendar/syncCalendar", async ({ householdId, provider }, thunkAPI) => {
  try {
    const response = await apiClient.calendar.syncCalendar(householdId, {
      provider,
    });
    return response;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to sync calendar";
    return thunkAPI.rejectWithValue(message);
  }
});

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
        (state, action: PayloadAction<Event[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.events = action.payload;
        }
      )
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch events";
      })
      // Add Event
      .addCase(addEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events.push(action.payload);
      })
      .addCase(addEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to add event";
      })
      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.events.findIndex(
          (event) => event.id === action.payload.id
        );
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to update event";
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
        state.message = action.payload || "Failed to delete event";
      })
      // Update Event Status
      .addCase(updateEventStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateEventStatus.fulfilled,
        (state, action: PayloadAction<Event>) => {
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
        state.message = action.payload || "Failed to update event status";
      })
      // Sync Calendar
      .addCase(syncCalendar.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.syncError = null;
      })
      .addCase(
        syncCalendar.fulfilled,
        (state, action: PayloadAction<SyncCalendarResponse["data"]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.isSynced = true;
          state.syncProvider = action.payload.provider;
          state.lastSync = action.payload.lastSync;
          state.events = action.payload.events;
        }
      )
      .addCase(syncCalendar.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.syncError = action.payload || "Sync failed";
      });
  },
});

export const { reset } = calendarSlice.actions;

export const selectCalendar = (state: RootState) => state.calendar;

export default calendarSlice.reducer;
