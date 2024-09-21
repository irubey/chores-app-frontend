export interface Subtask {
  id: string;
  choreId: string;
  title: string;
  status: 'PENDING' | 'COMPLETED';
  // Add other fields as necessary
}