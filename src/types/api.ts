// frontend/src/types/api.ts: TypeScript interfaces for API responses

import { User } from "./user";
import { Household, HouseholdMember } from "./household";
import { Chore } from "./chore";
import { Message } from "./message";
import { Notification } from "./notification";
import { Event } from "./event";
import { Expense, ExpenseSplit, Transaction } from "./expense"; // Imported from "./expense"
import { OAuthIntegration } from "./oauth";
import { Attachment } from "./attachment";
import { UploadResponse } from "./upload";

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
export interface LoginResponse extends ApiResponse<{ accessToken: string; refreshToken: string }> {}

/**
 * Response structure for registration requests.
 */
export interface RegisterResponse extends ApiResponse<User> {}

/**
 * Response structure for fetching households.
 */
export interface GetHouseholdsResponse extends ApiResponse<Household[]> {}

/**
 * Response structure for syncing calendar.
 */
export interface SyncCalendarResponse extends ApiResponse<Event[]> {}

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
 * Additional API response interfaces as needed
 */