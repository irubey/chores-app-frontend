export interface Notification {
  id: string;
  userId: string;
  type: 'MESSAGE' | 'CHORE' | 'EXPENSE' | 'EVENT' | 'OTHER';
  message: string;
  isRead: boolean;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  // Add other fields as necessary
}
