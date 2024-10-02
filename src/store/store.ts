import { configureStore } from '@reduxjs/toolkit';
import authReducer, { updateAuthState } from './slices/authSlice';
import messagesReducer from './slices/messagesSlice';
import financesReducer from './slices/financesSlice';
import choresReducer from './slices/choresSlice';
import calendarReducer from './slices/calendarSlice';
import notificationsReducer from './slices/notificationsSlice';
import householdReducer from './slices/householdSlice';
import { apiClient } from '../lib/apiClient';

const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    finances: financesReducer,
    chores: choresReducer,
    calendar: calendarReducer,
    notifications: notificationsReducer,
    household: householdReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Register the updateAuthState function
apiClient.registerAuthStateUpdate((state: { isAuthenticated: boolean; isInitialized: boolean }) =>
  store.dispatch(updateAuthState(state))
);

// Initialize Axios interceptors after registration
apiClient.initializeInterceptors();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;