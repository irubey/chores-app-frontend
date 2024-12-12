import { configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import messagesReducer from "./slices/messagesSlice";
import financesReducer from "./slices/financesSlice";
import choresReducer from "./slices/choresSlice";
import calendarReducer from "./slices/calendarSlice";
import notificationsReducer from "./slices/notificationsSlice";
import threadReducer from "./slices/threadSlice";
import { setAppDispatch } from "./storeDispatch";
import { logger } from "@/lib/api/logger";

logger.debug("Configuring Redux store");

const store = configureStore({
  reducer: {
    threads: threadReducer,
    messages: messagesReducer,
    finances: financesReducer,
    chores: choresReducer,
    calendar: calendarReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({}),
});

// Set the dispatch in storeDispatch.ts
setAppDispatch(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
