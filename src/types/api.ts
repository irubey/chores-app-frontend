// frontend/src/types/api.ts: TypeScript interfaces for API responses

import { User } from "./user";
import { Household, HouseholdMember } from "./household";
import { Message } from "./message";
import { Notification } from "./notification";
import { Event } from "./event";
import { Expense, ExpenseSplit,Transaction } from "./expense"; // Imported from "./expense"
import { OAuthIntegration } from "./oauth";
import { Attachment } from "./attachment";
import { UploadResponse } from "./upload";
import { UpdateChoreDTO } from "./chore";
import { Chore, Subtask } from "./chore";
import { AxiosRequestConfig } from 'axios';

export interface ChoreWithAssignees extends Chore {
  assignedUsers: User[];
  subtasks: Subtask[];
}

/**
 * Generic API response structure.
 */
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

/**
 * Response structure for login requests.
 */
export interface LoginResponse {
  accessToken: string;
  user: User;
}


/**
 * Response structure for fetching households.
 */
export interface GetHouseholdsResponse extends ApiResponse<Household[]> {}

/**
 * Response structure for syncing calendar.
 */
export interface SyncCalendarResponse extends ApiResponse<{
  events: Event[];
  provider: string;
  lastSync: string; // ISO date string
}> {}

/**
 * Response structure for fetching household members.
 */
export interface GetHouseholdMembersResponse extends ApiResponse<HouseholdMember[]> {}

/**
 * Response structure for inviting a household member.
 */
export interface InviteMemberResponse extends ApiResponse<HouseholdMember> {}

/**
 * Response structure for creating an expense split.
 */
export interface CreateExpenseSplitResponse extends ApiResponse<ExpenseSplit> {}

/**
 * Response structure for transactions.
 */
export interface TransactionResponse extends ApiResponse<Transaction> {}

/**
 * Response structure for fetching household events.
 */
export interface GetHouseholdEventsResponse extends ApiResponse<Event[]> {}

/**
 * Response structure for creating an event.
 */
export interface CreateEventResponse extends ApiResponse<Event> {}

/**
 * Response structure for updating an event.
 */
export interface UpdateEventResponse extends ApiResponse<Event> {}

/**
 * No response structure needed for deleteEvent as it returns void.
 */

/**
 * Response structure for fetching notifications.
 */
export interface GetNotificationsResponse extends ApiResponse<Notification[]> {}

/**
 * Response structure for marking a notification as read.
 */
export interface MarkAsReadResponse extends ApiResponse<null> {}

/**
 * Additional API response interfaces as needed
 */
export interface UpdateChoreResponse extends ApiResponse<Chore> {}

export interface DeleteTransactionResponse extends ApiResponse<null> {}

// Add these new interfaces
export interface GetTransactionsResponse extends ApiResponse<Transaction[]> {}

export interface CreateTransactionResponse extends ApiResponse<Transaction> {}

export interface UpdateTransactionResponse extends ApiResponse<Transaction> {}

export interface CreateSubtaskResponse extends ApiResponse<Chore> {}

export interface UpdateSubtaskResponse extends ApiResponse<Chore> {}

export interface DeleteSubtaskResponse extends ApiResponse<null> {}

// Add this new interface for expense operations
export interface ExpenseResponse extends ApiResponse<Expense> {}

// Add this new interface for chore operations
export interface ChoreResponse extends ApiResponse<Chore> {}

/**
 * Corrected Response structure for fetching user households.
 */
export interface GetUserHouseholdsResponse extends ApiResponse<Household[]> {}

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export interface ReceiptResponse extends ApiResponse<Receipt> {}

export interface Receipt {
  id: string;
  expenseId: string;
  url: string;
  fileType: string;
  createdAt: Date;
}

