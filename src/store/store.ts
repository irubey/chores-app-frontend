import { configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import authReducer from "./slices/authSlice";
import messagesReducer from "./slices/messagesSlice";
import financesReducer from "./slices/financesSlice";
import choresReducer from "./slices/choresSlice";
import calendarReducer from "./slices/calendarSlice";
import notificationsReducer from "./slices/notificationsSlice";
import householdReducer from "./slices/householdSlice";
import threadReducer from "./slices/threadSlice";
import { setAppDispatch } from "./storeDispatch";
import { logger } from "@/lib/api/logger";

logger.debug("Configuring Redux store");

const store = configureStore({
  reducer: {
    auth: authReducer,
    threads: threadReducer,
    messages: messagesReducer,
    finances: financesReducer,
    chores: choresReducer,
    calendar: calendarReducer,
    notifications: notificationsReducer,
    household: householdReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({}),
});

// Set the dispatch in storeDispatch.ts
setAppDispatch(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
