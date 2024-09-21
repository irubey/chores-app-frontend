export interface Event {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  startTime: string; // ISO string format
  endTime: string; // ISO string format
  createdById: string;
  choreId?: string | null;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  // Add other fields as necessary
}