import React from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SocketProvider } from '../contexts/SocketContext';
import store from '../store/store';
import '../styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <ThemeProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
