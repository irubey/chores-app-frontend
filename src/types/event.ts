export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

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
  status: EventStatus;
  recurrence: EventRecurrence;
  customRecurrence?: DaysOfWeek[];
  category: EventCategory;
  isAllDay: boolean;
  location?: string;
  isPrivate: boolean;
}

export enum EventRecurrence {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM'
}

export enum EventCategory {
  CHORE = 'CHORE',
  MEETING = 'MEETING',
  SOCIAL = 'SOCIAL',
  OTHER = 'OTHER'
}

export enum DaysOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY'
}