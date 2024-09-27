export interface Chore {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO string format
  status: ChoreStatus;
  recurrence?: string;
  priority?: number;
  assignedUserIds?: string[]; // Added property
  subtasks?: Subtask[];       // Added property
}

export enum ChoreStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Subtask {
  id: string;
  choreId: string;
  title: string;
  status: SubtaskStatus;
}

export enum SubtaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export interface CreateSubtaskDTO {
  title: string;
  status?: SubtaskStatus;
}

export interface CreateChoreDTO {
  title: string;
  description?: string;
  householdId: string;
  dueDate?: Date;
  status?: ChoreStatus;
  recurrence?: string;
  priority?: number;
  assignedUserIds?: string[];
  subtasks?: CreateSubtaskDTO[];
}

export interface UpdateChoreDTO {
  title?: string;
  description?: string;
  dueDate?: string; // Changed from Date to string
  status?: ChoreStatus;
  recurrence?: string;
  priority?: number;
  assignedUserIds?: string[];
  subtasks?: UpdateSubtaskDTO[];
}

export interface UpdateSubtaskDTO {
  title?: string;
  status?: SubtaskStatus;
}