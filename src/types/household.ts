import { Chore } from "./chore";
import { User } from "./user";
import { Thread } from "./message";
export enum HouseholdRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface Household {
  id: string;
  name: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  currency: string;
  icon?: string;
  timezone?: string;
  language?: string;
  chores?: Chore[];
  members?: HouseholdMember[];
  threads?: Thread[];
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  role: HouseholdRole;
  joinedAt: string; // ISO string format
  isInvited: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  isSelected: boolean;
  user: User;
}
