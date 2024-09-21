import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import messagesReducer from './slices/messagesSlice';
import financesReducer from './slices/financesSlice';
import choresReducer from './slices/choresSlice';
import calendarReducer from './slices/calendarSlice';
import notificationsReducer from './slices/notificationsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    finances: financesReducer,
    chores: choresReducer,
    calendar: calendarReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;