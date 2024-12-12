// frontend/src/lib/socketClient.ts: Singleton Socket.IO client for real-time communication

import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@shared/types";

/**
 * Singleton class to manage Socket.IO connections and event handling.
 */
class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private readonly url: string;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
  }

  /**
   * Connects to the Socket.IO server with the provided token.
   * @param token - JWT access token for authentication.
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.url, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up default error handling
    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    this.socket.connect();
  }

  /**
   * Disconnects the Socket.IO client.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /**
   * Registers an event handler for Socket.IO events.
   * @param event The event name.
   * @param handler The handler function.
   */
  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    if (!this.socket) return;
    this.socket.on(event, handler as any);
  }

  /**
   * Emits events to the Socket.IO server.
   * @param event The event name.
   * @param args The data payload(s).
   */
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Unable to emit event:", event);
      return;
    }
    this.socket.emit(event, ...args);
  }

  /**
   * Removes an event handler for a specific event.
   * @param event The event name.
   * @param handler The handler function to remove.
   */
  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    if (!this.socket) return;
    this.socket.off(event, handler as any);
  }

  /**
   * Cleanup method to be called when unmounting or during auth cleanup
   */
  cleanup(): void {
    this.disconnect();
  }
}

export const socketClient = new SocketClient();
