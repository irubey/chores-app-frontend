// frontend/src/types/socket.ts: TypeScript interfaces for Socket.IO event payloads

import { Chore } from "./chore";
import { Message } from "./message";
import { Notification } from "./notification";
import { Event as CalendarEvent } from "./event"; 
import { Household } from "./household";
import { Expense } from "./expense";

/**
 * Interface for Notification events.
 */
export interface NotificationEvent {
  type: string;
  message: string;
  userId: string;
}

/**
 * Interface for Chore Update events.
 */
export interface ChoreUpdateEvent {
  chore: Chore;
}

/**
 * Interface for New Message events.
 */
export interface MessageEvent {
  message: Message;
}

/**
 * Interface for Event (Calendar) events.
 */
export interface EventEvent {
  event: CalendarEvent; 
}

/**
 * Interface for Household Update events.
 */
export interface HouseholdUpdateEvent {
  household: Household;
}

/**
 * Interface for Expense Update events.
 */
export interface ExpenseUpdateEvent {
  expense: Expense;
}

/**
 * Server-to-Client event handlers.
 */
export interface ServerToClientEvents {
  notification_new: (data: NotificationEvent) => void;
  chore_update: (data: ChoreUpdateEvent) => void;
  message_new: (data: MessageEvent) => void;
  event_new: (data: EventEvent) => void;
  household_update: (data: HouseholdUpdateEvent) => void;
  expense_new: (data: ExpenseUpdateEvent) => void; 
  // Removed 'reconnect_failed' to avoid type mismatch
}

/**
 * Client-to-Server event handlers.
 */
export interface ClientToServerEvents {
  // Define client-to-server events here
  // Example:
  send_message: (content: string) => void;
  // Add other client-to-server events as needed
}