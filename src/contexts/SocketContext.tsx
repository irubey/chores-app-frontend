// src/contexts/SocketContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import { socketClient } from '../lib/socketClient';

type SocketContextType = typeof socketClient;

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SocketContext.Provider value={socketClient}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};