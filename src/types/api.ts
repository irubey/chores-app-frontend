// frontend/src/types/api.ts: TypeScript interfaces for API responses

import { User } from "./user";
import { Household, HouseholdMember } from "./household";
import { Message, Thread } from "./message";
import { Notification } from "./notification";
import { Event } from "./event";
import { Expense, ExpenseSplit, Transaction } from "./expense"; // Imported from "./expense"
import { OAuthIntegration } from "./oauth";
import { Attachment } from "./attachment";
import { UploadResponse } from "./upload";
import { UpdateChoreDTO } from "./chore";
import { Chore, Subtask } from "./chore";
import { AxiosRequestConfig } from "axios";

export interface ChoreWithAssignees extends Chore {
  assignedUsers: User[];
  subtasks: Subtask[];
}

export type ApiResponse<T> = {
  data: T;
  error?: string;
};

// Use type aliases consistently
export type LoginResponse = ApiResponse<{
  user: User;
}>;

export type GetHouseholdsResponse = ApiResponse<Household[]>;

export type SyncCalendarResponse = ApiResponse<{
  events: Event[];
  provider: string;
  lastSync: string; // ISO date string
}>;

export type UpdateThreadResponse = ApiResponse<Thread>;

export type GetHouseholdMembersResponse = ApiResponse<HouseholdMember[]>;

export type InviteMemberResponse = ApiResponse<HouseholdMember>;

export type CreateExpenseSplitResponse = ApiResponse<ExpenseSplit>;

export type TransactionResponse = ApiResponse<Transaction>;

export type GetHouseholdEventsResponse = ApiResponse<Event[]>;

export type CreateEventResponse = ApiResponse<Event>;

export type UpdateEventResponse = ApiResponse<Event>;

export type GetNotificationsResponse = ApiResponse<Notification[]>;

export type UpdateChoreResponse = ApiResponse<Chore>;

export type GetTransactionsResponse = ApiResponse<Transaction[]>;

export type CreateTransactionResponse = ApiResponse<Transaction>;

export type UpdateTransactionResponse = ApiResponse<Transaction>;

export type CreateSubtaskResponse = ApiResponse<Subtask>;

export type UpdateSubtaskResponse = ApiResponse<Subtask>;

export type DeleteSubtaskResponse = ApiResponse<null>;

export type ExpenseResponse = ApiResponse<Expense>;

export type ChoreResponse = ApiResponse<Chore>;

export type GetUserHouseholdsResponse = ApiResponse<Household[]>;

export type ReceiptResponse = ApiResponse<Receipt>;

export type DeleteHouseholdResponse = ApiResponse<null>;

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export interface Receipt {
  id: string;
  expenseId: string;
  url: string;
  fileType: string;
  createdAt: Date;
}

export type RegisterResponse = ApiResponse<User>;
export type InitializeAuthResponse = ApiResponse<User>;
export type CreateHouseholdResponse = ApiResponse<Household>;
export type GetHouseholdDetailsResponse = ApiResponse<Household>;
export type UpdateHouseholdResponse = ApiResponse<Household>;
export type AcceptInvitationResponse = ApiResponse<Household>;
export type UpdateMemberRoleResponse = ApiResponse<HouseholdMember>;
export type GetThreadsResponse = ApiResponse<Thread[]>;
export type CreateThreadResponse = ApiResponse<Thread>;
export type GetMessagesResponse = ApiResponse<Message[]>;
export type SendMessageResponse = ApiResponse<Message>;
export type UpdateMessageResponse = ApiResponse<Message>;
export type GetAttachmentResponse = ApiResponse<Attachment>;
export type DeleteTransactionResponse = ApiResponse<null>;
export type DeleteMessageResponse = ApiResponse<null>;
export type RemoveMemberResponse = ApiResponse<null>;
