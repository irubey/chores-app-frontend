'use client'

import React from 'react';
import { useTheme} from '@/contexts/ThemeContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';

interface ThemedBodyProps {
  children: React.ReactNode;
  lato: string;
  playfair: string;
}

const ThemedBody: React.FC<ThemedBodyProps> = ({ children, lato, playfair }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  return (
    <body 
      className={`${lato} ${playfair} font-sans flex flex-col min-h-screen
        ${theme === 'dark' ? 'dark' : ''}`}
    >
      <div className="bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 min-h-screen">
        <ErrorBoundary fallback={<div>Something went wrong. Please try again later.</div>}>
          {user ? (
            <>
              <Header />
              <main className="flex-grow relative">
                <LoadingSpinner />
                <NotificationCenter />
                {children}
              </main>
              <Footer />
            </>
          ) : (
            <main className="flex-grow relative">
              {children}
            </main>
          )}
        </ErrorBoundary>
      </div>
    </body>
  );
};

export default ThemedBody;
