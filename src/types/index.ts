export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

export interface BudgetPlan {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  income: number;
  fixedExpenses: FixedExpense[];
  totalFixed: number;
  remainingFlexible: number;
  allocations: {
    food: number;
    shopping: number;
    travel: number;
    other: number;
    savings: number;
  };
  savingsTargetPercentage: number;
}

export interface Transaction {
  id: string;
  userId: string;
  budgetId: string;
  amount: number;
  type: 'debit' | 'credit';
  category: 'Food' | 'Shopping' | 'Travel' | 'Fixed' | 'Savings' | 'Other' | 'Credit';
  timestamp: number;
  description: string;
}

export interface CategoryProgress {
  category: 'Food' | 'Shopping' | 'Travel' | 'Fixed' | 'Other' | 'Credit';
  allocated: number;
  spent: number;
}
