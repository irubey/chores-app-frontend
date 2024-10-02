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
  status: 'PENDING' | 'COMPLETED'; // Adjust based on backend's TransactionStatus enum
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  // Add other fields as necessary
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
