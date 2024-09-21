export interface Household {
  id: string;
  name: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  // Add other fields as necessary
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string; // ISO string format
  // Add other fields as necessary
}