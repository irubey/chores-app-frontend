import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setAccessToken, updateAuthState } from './slices/authSlice';
import messagesReducer from './slices/messagesSlice';
import financesReducer from './slices/financesSlice';
import choresReducer from './slices/choresSlice';
import calendarReducer from './slices/calendarSlice';
import notificationsReducer from './slices/notificationsSlice';
import householdReducer from './slices/householdSlice'; // Import the new household reducer

import { apiClient } from '../lib/apiClient'; // Import apiClient

// Initialize the Redux store with all reducers
const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    finances: financesReducer,
    chores: choresReducer,
    calendar: calendarReducer,
    notifications: notificationsReducer,
    household: householdReducer, // Add the new household reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// **Register Token Management Functions with ApiClient**
apiClient.registerTokenFunctions(
  () => store.getState().auth.accessToken,
  (token: string | null) => store.dispatch(setAccessToken(token))
);

// Register the updateAuthState function
apiClient.registerAuthStateUpdate((state: { isAuthenticated: boolean; isInitialized: boolean }) => 
  store.dispatch(updateAuthState(state))
);

// Initialize Axios interceptors after registration
apiClient.initializeInterceptors();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;