export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export interface Expense {
  id: string;
  householdId: string;
  amount: number;
  description: string;
  paidById: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  dueDate?: string; // ISO string format
  category?: string;
  splits: ExpenseSplit[];
  paidBy: {
    id: string;
    name: string;
  };
  transactions: Transaction[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
}

export interface Transaction {
  id: string;
  expenseId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

export interface CreateExpenseSplitDTO {
  userId: string;
  amount: number;
}

export interface CreateExpenseDTO {
  householdId: string;
  amount: number;
  description: string;
  paidById: string;
  dueDate?: Date;
  category?: string;
  splits?: CreateExpenseSplitDTO[];
}

export interface UpdateExpenseDTO {
  amount?: number;
  description?: string;
  dueDate?: Date;
  category?: string;
  splits?: UpdateExpenseSplitDTO[];
}

export interface UpdateExpenseSplitDTO {
  userId: string;
  amount: number;
}

// Updated CreateTransactionDTO
export interface CreateTransactionDTO {
  expenseId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';      // Added 'type'
  category: string;                // Added 'category'
  date: string;                    // Added 'date' as ISO string
  description?: string;            // Optional 'description'
}

export interface UpdateTransactionDTO {
  expenseId?: string;
  fromUserId?: string;
  toUserId?: string;
  amount?: number;
  type?: 'EXPENSE' | 'INCOME';      // Optional 'type'
  category?: string;                // Optional 'category'
  date?: string;                    // Optional 'date' as ISO string
  description?: string;             // Optional 'description'
}