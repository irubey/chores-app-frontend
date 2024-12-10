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
import { logger } from "@/lib/api/logger";

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

// Flag to enable/disable socket connections
const ENABLE_SOCKETS = false;

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  isAuthenticated,
  user,
}) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Skip socket connection if disabled
    if (!ENABLE_SOCKETS) {
      logger.debug("Socket connections are disabled");
      return;
    }

    const handleConnect = () => {
      setIsConnected(true);
      logger.info("Socket connected successfully", {
        userId: user?.id,
        isAuthenticated,
      });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      logger.warn("Socket disconnected", {
        userId: user?.id,
        wasAuthenticated: isAuthenticated,
      });
    };

    const handleError = (error: Error) => {
      logger.error("Socket connection error", {
        error,
        userId: user?.id,
        isAuthenticated,
        previouslyConnected: isConnected,
      });
      setIsConnected(false);
    };

    // Connect socket when authenticated and user exists
    if (isAuthenticated && user) {
      logger.debug("Attempting socket connection", {
        userId: user.id,
        isAuthenticated,
      });
      socketClient.connect();

      // Set up event listeners
      socketClient.on("connect", handleConnect);
      socketClient.on("disconnect", handleDisconnect);
      socketClient.on("connect_error", handleError);
    } else {
      logger.debug("Skipping socket connection", {
        hasUser: !!user,
        isAuthenticated,
      });
    }

    // Cleanup function
    return () => {
      logger.debug("Cleaning up socket connection", {
        userId: user?.id,
        isConnected,
        isAuthenticated,
      });
      socketClient.off("connect", handleConnect);
      socketClient.off("disconnect", handleDisconnect);
      socketClient.off("connect_error", handleError);

      if (isConnected) {
        socketClient.disconnect();
      }
    };
  }, [isAuthenticated, user, isConnected]);

  const connect = () => {
    if (!ENABLE_SOCKETS) return;

    if (!isConnected && isAuthenticated && user) {
      logger.debug("Manual socket connection attempt", {
        userId: user.id,
        isAuthenticated,
      });
      socketClient.connect();
    } else {
      logger.debug("Manual socket connection skipped", {
        isConnected,
        hasUser: !!user,
        isAuthenticated,
      });
    }
  };

  const disconnect = () => {
    if (!ENABLE_SOCKETS) return;

    if (isConnected) {
      logger.debug("Manual socket disconnection", {
        userId: user?.id,
        isAuthenticated,
      });
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
