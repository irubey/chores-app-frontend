'use client'

import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { initializeAuth, updateAuthState } from '../store/slices/authSlice';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SocketProvider } from '../contexts/SocketContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import store from '../store/store';
import '../styles/globals.css';
import { AppDispatch } from '../store/store';
import { selectAuth } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Head from 'next/head';

function AppContent({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized } = useSelector(selectAuth);
  const pathname = usePathname();

  // Define routes where auth is not required
  const publicRoutes = ['/login', '/register', '/'];

  useEffect(() => {
    if (publicRoutes.includes(pathname)) {
      // For public routes, set isInitialized to true without authenticating
      dispatch(updateAuthState({ isAuthenticated: false, isInitialized: true }));
    } else if (!isInitialized) {
      // For protected routes, initialize authentication
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized, pathname]);

  if (!isInitialized && !publicRoutes.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const content = publicRoutes.includes(pathname) ? children : (
    <ProtectedRoute>{children}</ProtectedRoute>
  );

  return (
    <ThemeProvider>
      <SocketProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex flex-1">
            <main className="flex-1 p-4">
              {content}
            </main>
          </div>
          <Footer />
        </div>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        {/* Inline Script for Early Theme Initialization */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  const storedTheme = window.localStorage.getItem('theme');
                  if (storedTheme === 'light' || storedTheme === 'dark') {
                    return storedTheme;
                  }
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  return prefersDark ? 'dark' : 'light';
                }
                const theme = getInitialTheme();
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Provider store={store}>
          <AppContent>{children}</AppContent>
        </Provider>
      </body>
    </html>
  );
}