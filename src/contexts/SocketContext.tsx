"use client";

// src/contexts/SocketContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { socketClient } from "../lib/socketClient";
import { User } from "@shared/types";

interface SocketContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

interface SocketProviderProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  user: User | null;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  isAuthenticated,
  user,
}) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (error: Error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    };

    // Connect socket when authenticated and user exists
    if (isAuthenticated && user) {
      socketClient.connect();

      // Set up event listeners
      socketClient.on("connect", handleConnect);
      socketClient.on("disconnect", handleDisconnect);
      socketClient.on("connect_error", handleError);
    }

    // Cleanup function
    return () => {
      socketClient.off("connect", handleConnect);
      socketClient.off("disconnect", handleDisconnect);
      socketClient.off("connect_error", handleError);

      if (isConnected) {
        socketClient.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const connect = () => {
    if (!isConnected && isAuthenticated && user) {
      socketClient.connect();
    }
  };

  const disconnect = () => {
    if (isConnected) {
      socketClient.disconnect();
    }
  };

  return (
    <SocketContext.Provider value={{ isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
