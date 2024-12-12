import { configureStore, Reducer } from "@reduxjs/toolkit";
import { testLogger } from "../utils/testLogger";
import { RootState } from "@/store/store";

// Import reducers
import authReducer from "@/store/slices/authSlice";
import threadReducer from "@/store/slices/threadSlice";
import messagesReducer from "@/store/slices/messagesSlice";
import financesReducer from "@/store/slices/financesSlice";
import choresReducer from "@/store/slices/choresSlice";
import calendarReducer from "@/store/slices/calendarSlice";
import notificationsReducer from "@/store/slices/notificationsSlice";
import householdReducer from "@/store/slices/householdSlice";

// Import mock data utilities
import { getMockState } from "../setup/mockData";

export interface TestStoreOptions {
  preloadedState?: Partial<RootState>;
  mockReducers?: Partial<Record<keyof RootState, boolean>>;
  enableLogging?: boolean;
  ignoredSerializationPaths?: string[];
}

export type TestStore = ReturnType<typeof createTestStore>;

export function createMockReducer<T>(initialState: T): Reducer<T> {
  return () => initialState;
}

export function createTestStore(options: TestStoreOptions = {}) {
  const {
    preloadedState,
    mockReducers = {},
    enableLogging = true,
    ignoredSerializationPaths = [],
  } = options;

  // Get mock state from mockData
  const mockState = getMockState();
  const initialState = {
    ...mockState,
    ...preloadedState,
  };

  // Default serialization paths to ignore
  const defaultIgnoredPaths = [
    "payload.messageRead.readAt",
    "payload.createdAt",
    "payload.updatedAt",
    "payload.mentionedAt",
    "meta.arg.createdAt",
    "meta.arg.updatedAt",
    "payload.*.createdAt",
    "payload.*.updatedAt",
    "messages.messages.*.createdAt",
    "messages.messages.*.updatedAt",
    "messages.selectedMessage.createdAt",
    "messages.selectedMessage.updatedAt",
  ];

  const store = configureStore({
    reducer: {
      auth: mockReducers.auth
        ? createMockReducer(initialState.auth)
        : authReducer,
      threads: mockReducers.threads
        ? createMockReducer(initialState.threads)
        : threadReducer,
      messages: mockReducers.messages
        ? createMockReducer(initialState.messages)
        : messagesReducer,
      finances: mockReducers.finances
        ? createMockReducer(initialState.finances)
        : financesReducer,
      chores: mockReducers.chores
        ? createMockReducer(initialState.chores)
        : choresReducer,
      calendar: mockReducers.calendar
        ? createMockReducer(initialState.calendar)
        : calendarReducer,
      notifications: mockReducers.notifications
        ? createMockReducer(initialState.notifications)
        : notificationsReducer,
      household: mockReducers.household
        ? createMockReducer(initialState.household)
        : householdReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActionPaths: [
            ...defaultIgnoredPaths,
            ...ignoredSerializationPaths,
          ],
          ignoredPaths: [...defaultIgnoredPaths, ...ignoredSerializationPaths],
        },
      }),
    preloadedState: initialState,
  });

  if (enableLogging) {
    testLogger.clearSpies();
  }

  return store;
}

export function getStoreWithState(partialState: Partial<RootState>) {
  return createTestStore({ preloadedState: partialState });
}

export function getStoreWithMockedReducers(reducers: Array<keyof RootState>) {
  const mockReducers = reducers.reduce((acc, reducer) => {
    acc[reducer] = true;
    return acc;
  }, {} as Record<keyof RootState, boolean>);

  return createTestStore({ mockReducers });
}
