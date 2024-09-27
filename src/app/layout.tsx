'use client'

import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { initializeAuth } from '../store/slices/authSlice';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SocketProvider } from '../contexts/SocketContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import store from '../store/store';
import '../styles/globals.css';
import { AppDispatch } from '../store/store'; // Import AppDispatch

function AppContent({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>(); // Use AppDispatch type

  useEffect(() => {
    dispatch(initializeAuth()); // This should now work correctly
  }, [dispatch]);

  return (
    <ThemeProvider>
      <SocketProvider>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <Header />

          {/* Main Content Area */}
          <div className="flex flex-1">
            {/* Page Content */}
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <AppContent>{children}</AppContent>
        </Provider>
      </body>
    </html>
  );
}