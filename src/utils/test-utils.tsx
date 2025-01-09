// import React, { PropsWithChildren } from "react";
// import { render, RenderOptions } from "@testing-library/react";
// import { Provider } from "react-redux";
// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import type { RootState } from "../store/store";
// import { MessageWithDetails, Thread, User, Household } from "@shared/types";

// // Import all reducers
// import authReducer from "../store/slices/authSlice";
// import messagesReducer from "../store/slices/messagesSlice";
// import threadReducer from "../store/slices/threadSlice";
// import householdReducer from "../store/slices/householdSlice";
// import financesReducer from "../store/slices/financesSlice";
// import choresReducer from "../store/slices/choresSlice";
// import calendarReducer from "../store/slices/calendarSlice";
// import notificationsReducer from "../store/slices/notificationsSlice";

// // Create root reducer matching the actual store
// const rootReducer = combineReducers({
//   auth: authReducer,
//   messages: messagesReducer,
//   threads: threadReducer,
//   household: householdReducer,
//   finances: financesReducer,
//   chores: choresReducer,
//   calendar: calendarReducer,
//   notifications: notificationsReducer,
// });

// type Status = "idle" | "loading" | "succeeded" | "failed";

// // Define the MessageState type locally to match the slice
// interface MessageState {
//   messages: MessageWithDetails[];
//   selectedMessage: MessageWithDetails | null;
//   status: {
//     list: Status;
//     create: Status;
//     update: Status;
//     delete: Status;
//     reaction: Status;
//     attachment: Status;
//     poll: Status;
//     mention: Status;
//     read: Status;
//   };
//   error: string | null;
//   hasMore: boolean;
//   nextCursor?: string;
// }

// export const mockMessageState: MessageState = {
//   messages: [],
//   selectedMessage: null,
//   status: {
//     list: "idle",
//     create: "idle",
//     update: "idle",
//     delete: "idle",
//     reaction: "idle",
//     attachment: "idle",
//     poll: "idle",
//     mention: "idle",
//     read: "idle",
//   },
//   error: null,
//   hasMore: false,
//   nextCursor: undefined,
// };

// // Test data generators
// export const mockUser = (overrides = {}): User => ({
//   id: "user-1",
//   name: "Test User",
//   email: "test@example.com",
//   createdAt: new Date(),
//   updatedAt: new Date(),
//   ...overrides,
// });

// export const mockThread = (overrides = {}): Thread => ({
//   id: "thread-1",
//   title: "Test Thread",
//   createdAt: new Date(),
//   updatedAt: new Date(),
//   householdId: "household-1",
//   authorId: "user-1",
//   ...overrides,
// });

// export const mockMessage = (overrides = {}): MessageWithDetails => ({
//   id: "msg-1",
//   content: "Test message",
//   threadId: "thread-1",
//   authorId: "user-1",
//   createdAt: new Date(),
//   updatedAt: new Date(),
//   author: mockUser(),
//   thread: mockThread(),
//   attachments: [],
//   reactions: [],
//   mentions: [],
//   reads: [],
//   poll: undefined,
//   ...overrides,
// });

// // Setup store with proper typing
// export function setupStore(preloadedState?: Partial<RootState>) {
//   return configureStore({
//     reducer: rootReducer,
//     preloadedState: preloadedState as any,
//     middleware: (getDefaultMiddleware) =>
//       getDefaultMiddleware({
//         serializableCheck: false, // Disable for testing
//       }),
//   });
// }

// export type AppStore = ReturnType<typeof setupStore>;
// export type AppDispatch = AppStore["dispatch"];

// // Enhanced render with providers
// export function renderWithProviders(
//   ui: React.ReactElement,
//   {
//     preloadedState = {},
//     store = setupStore(preloadedState),
//     ...renderOptions
//   }: {
//     preloadedState?: Partial<RootState>;
//     store?: AppStore;
//   } & Omit<RenderOptions, "wrapper"> = {}
// ) {
//   function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
//     return <Provider store={store}>{children}</Provider>;
//   }

//   return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
// }
