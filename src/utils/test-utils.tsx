import React, { PropsWithChildren } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import type { RenderOptions } from "@testing-library/react";
import type { Store } from "@reduxjs/toolkit";
import type { RootState } from "../store/store";
import { Thread, Message, User, Household } from "@shared/types";

// Import your reducers
import authReducer from "../store/slices/authSlice";
import messagesReducer from "../store/slices/messagesSlice";
import threadReducer from "../store/slices/threadSlice";
import householdReducer from "../store/slices/householdSlice";
import financesReducer from "../store/slices/financesSlice";
import choresReducer from "../store/slices/choresSlice";
import calendarReducer from "../store/slices/calendarSlice";
import notificationsReducer from "../store/slices/notificationsSlice";

// Create the root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  messages: messagesReducer,
  threads: threadReducer,
  household: householdReducer,
  finances: financesReducer,
  chores: choresReducer,
  calendar: calendarReducer,
  notifications: notificationsReducer,
});

export type TestRootState = ReturnType<typeof rootReducer>;

// Create a custom store setup function
export function setupStore(preloadedState?: Partial<TestRootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable serializable check for testing
      }),
  });
}

interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<TestRootState>;
  store?: ReturnType<typeof setupStore>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Test data generators
export const mockHousehold = (overrides = {}): Household => ({
  id: "household-1",
  name: "Test Household",
  createdAt: new Date(),
  updatedAt: new Date(),
  currency: "USD",
  timezone: "UTC",
  language: "en",
  ...overrides,
});

export const mockThread = (overrides = {}): Thread => ({
  id: "thread-1",
  title: "Test Thread",
  createdAt: new Date(),
  updatedAt: new Date(),
  householdId: "household-1",
  authorId: "user-1",
  ...overrides,
});

export const mockMessage = (overrides = {}): Message => ({
  id: "message-1",
  content: "Test message",
  threadId: "thread-1",
  authorId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockUser = (overrides = {}): User => ({
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock initial states
type Status = "idle" | "loading" | "succeeded" | "failed";

export const mockInitialThreadState = {
  threads: [],
  selectedThread: null,
  status: {
    list: "idle" as Status,
    create: "idle" as Status,
    update: "idle" as Status,
    delete: "idle" as Status,
    invite: "idle" as Status,
    details: "idle" as Status,
  },
  error: null,
};

export const mockInitialMessageState = {
  messages: [],
  selectedMessage: null,
  status: {
    list: "idle" as Status,
    create: "idle" as Status,
    update: "idle" as Status,
    delete: "idle" as Status,
    reaction: "idle" as Status,
    attachment: "idle" as Status,
    poll: "idle" as Status,
    mention: "idle" as Status,
    read: "idle" as Status,
  },
  error: null,
  hasMore: false,
  nextCursor: undefined,
};
