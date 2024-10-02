export interface Chore {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO string format
  status: ChoreStatus;
  recurrence?: string;
  priority?: number;
  assignedUserIds?: string[]; 
  subtasks?: Subtask[];       
  swapRequests?: ChoreSwapRequest[];
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

export enum ChoreSwapRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ChoreSwapRequest {
  id: string;
  choreId: string;
  requestingUserId: string;
  targetUserId: string;
  status: ChoreSwapRequestStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CreateChoreSwapRequestDTO {
  choreId: string;
  targetUserId: string;
}

export interface UpdateChoreSwapRequestDTO {
  status: ChoreSwapRequestStatus;
}