import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';
import { Event } from '../../types/event';
import { Chore } from '../../types/chore';
import { RootState } from '../store';
import { SyncCalendarResponse } from '@/types/api';

interface CalendarState {
  events: Event[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  isSynced: boolean;
  syncProvider: string | null;
  lastSync: Date | null;
  syncError: string | null;
}

const initialState: CalendarState = {
  events: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  isSynced: false,
  syncProvider: null,
  lastSync: null,
  syncError: null,
};

// Async thunks
export const fetchEvents = createAsyncThunk<Event[], string, { rejectValue: string }>(
  'calendar/fetchEvents',
  async (householdId, thunkAPI) => {
    try {
      const response = await apiClient.households.getHouseholdEvents(householdId);
      return response.data; 
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to fetch events';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addEvent = createAsyncThunk<Event, { householdId: string; eventData: Partial<Event> }, { rejectValue: string }>(
  'calendar/addEvent',
  async ({ householdId, eventData }, thunkAPI) => {
    try {
      const response = await apiClient.households.createEvent(householdId, eventData);
      return response.data; 
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to add event';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateEvent = createAsyncThunk<Event, { householdId: string; eventId: string; eventData: Partial<Event> }, { rejectValue: string }>(
  'calendar/updateEvent',
  async ({ householdId, eventId, eventData }, thunkAPI) => {
    try {
      const response = await apiClient.households.updateEvent(householdId, eventId, eventData);
      return response.data; 
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to update event';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteEvent = createAsyncThunk<string, { householdId: string; eventId: string }, { rejectValue: string }>(
  'calendar/deleteEvent',
  async ({ householdId, eventId }, thunkAPI) => {
    try {
      await apiClient.households.deleteEvent(householdId, eventId);
      return eventId;
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to delete event';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const scheduleChores = createAsyncThunk<Chore[], string, { rejectValue: string }>(
  'calendar/scheduleChores',
  async (householdId, thunkAPI) => {
    try {
      // Fetch current chores
      const chores = await apiClient.chores.getChores(householdId);
      
      // Here you would typically have some logic to schedule the chores
      // For now, we'll just return the current chores
      
      // After scheduling, fetch events to update the calendar
      thunkAPI.dispatch(fetchEvents(householdId));
      
      return chores;
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to schedule chores';
      return thunkAPI.rejectWithValue(message);
    }
  }
);


// Async thunk for syncing calendar
export const syncCalendar = createAsyncThunk<
  SyncCalendarResponse['data'], // Return type is the inner data object
  { householdId: string; provider: string },
  { rejectValue: string }
>(
  'calendar/syncCalendar',
  async ({ householdId, provider }, thunkAPI) => {
    try {
      const response = await apiClient.households.syncCalendar(householdId, { provider });
      return response.data;
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        error.message ||
        'Failed to sync calendar';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Slice
const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
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
      .addCase(addEvent.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete Event
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.events = state.events.filter(event => event.id !== action.payload);
      })
      .addCase(deleteEvent.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Schedule Chores
      .addCase(scheduleChores.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(scheduleChores.fulfilled, (state, action: PayloadAction<Chore[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        // You might want to update the state with the scheduled chores if needed
      })
      .addCase(scheduleChores.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Sync Calendar
      .addCase(syncCalendar.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.syncError = null;
      })
      .addCase(syncCalendar.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isSynced = true;
        state.syncProvider = action.payload.provider;
        state.lastSync = new Date();
        // Optionally update events based on sync response
      })
      .addCase(syncCalendar.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isError = true;
        state.syncError = action.payload || 'Sync failed';
      });
  },
});

export const { reset } = calendarSlice.actions;

export const selectCalendar = (state: RootState) => state.calendar;

export default calendarSlice.reducer;