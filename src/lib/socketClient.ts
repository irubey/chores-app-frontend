// frontend/src/lib/socketClient.ts: Singleton Socket.IO client for real-time communication

import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents
} from '../types/socket';
import {
  NotificationEvent,
  ChoreUpdateEvent,
  HouseholdUpdateEvent,
  ExpenseUpdateEvent,
  EventEvent
} from '../types/socket';

/**
 * Singleton class to manage Socket.IO connections and event handling.
 */
class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor() {
    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3000',
      {
        auth: {
          token: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    // Handle connection errors
    this.socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message);
      // Optionally, notify the user or trigger a logout
    });


    // Handle new events with type annotations
    this.socket.on('household_update', (data: HouseholdUpdateEvent) => {
      console.log('Household updated:', data);
      // Handle household update logic
    });

    this.socket.on('expense_new', (data: ExpenseUpdateEvent) => {
      console.log('New expense added:', data);
      // Handle new expense logic
    });

    this.socket.on('notification_new', (data: NotificationEvent) => {
      console.log('New notification:', data);
      // Handle notification logic
    });

    this.socket.on('chore_update', (data: ChoreUpdateEvent) => {
      console.log('Chore updated:', data);
      // Handle chore update logic
    });

    this.socket.on('event_new', (data: EventEvent) => { 
      console.log('New event:', data);
      // Handle event logic
    });

    // ... other event listeners ...
  }

  /**
   * Registers event handlers for Socket.IO events.
   * @param event The event name.
   * @param handler The event handler function.
   */
  on<K extends keyof ServerToClientEvents>(event: K, handler: ServerToClientEvents[K]): void {
    this.socket.on(event, handler as any);
  }

  /**
   * Emits events to the Socket.IO server.
   * @param event The event name.
   * @param args The data payload(s).
   */
  emit<K extends keyof ClientToServerEvents>(event: K, ...args: Parameters<ClientToServerEvents[K]>): void {
    this.socket.emit(event, ...args);
  }

  /**
   * Disconnects the Socket.IO client.
   */
  disconnect(): void {
    this.socket.disconnect();
  }

  /**
   * Reconnects the Socket.IO client.
   */
  reconnect(): void {
    this.socket.connect();
  }
}

export const socketClient = new SocketClient();