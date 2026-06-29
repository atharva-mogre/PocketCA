import type { User, BudgetPlan, Transaction } from '../types';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DB_KEYS = {
  USERS: 'pocketca_users',
  BUDGETS: 'pocketca_budgets',
  TRANSACTIONS: 'pocketca_transactions',
  SESSION: 'pocketca_session',
};

// --- INITIALIZATION ---
const getStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// --- AUTHENTICATION ---
export const dbAdapter = {
  async signUp(name: string, email: string, password?: string): Promise<User> {
    await delay(600);
    const users = getStorage<User[]>(DB_KEYS.USERS, []);
    
    const normalizedEmail = email.trim().toLowerCase();
    
    if (users.find(u => u.email === normalizedEmail)) {
      throw new Error("User already exists with this email.");
    }
    
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      email: normalizedEmail,
      password,
      createdAt: Date.now()
    };
    
    users.push(newUser);
    setStorage(DB_KEYS.USERS, users);
    
    // Automatically log in
    setStorage(DB_KEYS.SESSION, newUser.id);
    return newUser;
  },

  async logIn(email: string, password?: string): Promise<User> {
    await delay(600);
    const users = getStorage<User[]>(DB_KEYS.USERS, []);
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email === normalizedEmail);
    
    if (!user) {
      throw new Error("Invalid credentials.");
    }
    
    if (password && user.password && user.password !== password) {
      throw new Error("Invalid credentials.");
    }
    
    setStorage(DB_KEYS.SESSION, user.id);
    return user;
  },

  async logOut(): Promise<void> {
    await delay(300);
    localStorage.removeItem(DB_KEYS.SESSION);
  },

  async getCurrentUser(): Promise<User | null> {
    // Keep it fast, no delay for session checks to prevent UI flickering
    const sessionId = localStorage.getItem(DB_KEYS.SESSION);
    if (!sessionId) return null;
    
    const users = getStorage<User[]>(DB_KEYS.USERS, []);
    return users.find(u => u.id === JSON.parse(sessionId)) || null;
  },

  // --- BUDGET PLANS ---
  async getBudgetPlan(userId: string, month: string): Promise<BudgetPlan | null> {
    await delay(400);
    const budgets = getStorage<BudgetPlan[]>(DB_KEYS.BUDGETS, []);
    return budgets.find(b => b.userId === userId && b.month === month) || null;
  },

  async saveBudgetPlan(plan: BudgetPlan): Promise<BudgetPlan> {
    await delay(500);
    const budgets = getStorage<BudgetPlan[]>(DB_KEYS.BUDGETS, []);
    const index = budgets.findIndex(b => b.id === plan.id);
    
    if (index >= 0) {
      budgets[index] = plan;
    } else {
      budgets.push(plan);
    }
    
    setStorage(DB_KEYS.BUDGETS, budgets);
    return plan;
  },

  async deleteBudget(id: string): Promise<void> {
    await delay(300);
    const budgets = getStorage<BudgetPlan[]>(DB_KEYS.BUDGETS, []);
    setStorage(DB_KEYS.BUDGETS, budgets.filter(b => b.id !== id));
  },

  // --- LEDGER (TRANSACTIONS) ---
  async getTransactions(userId: string, budgetId: string): Promise<Transaction[]> {
    await delay(300);
    const transactions = getStorage<Transaction[]>(DB_KEYS.TRANSACTIONS, []);
    return transactions
      .filter(t => t.userId === userId && t.budgetId === budgetId)
      .sort((a, b) => b.timestamp - a.timestamp); // Sort newest first
  },

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    await delay(300);
    const transactions = getStorage<Transaction[]>(DB_KEYS.TRANSACTIONS, []);
    
    const newTx: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    transactions.push(newTx);
    setStorage(DB_KEYS.TRANSACTIONS, transactions);
    return newTx;
  },

  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'userId' | 'budgetId'>>): Promise<Transaction> {
    await delay(300);
    const transactions = getStorage<Transaction[]>(DB_KEYS.TRANSACTIONS, []);
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) throw new Error("Transaction not found");
    
    transactions[index] = { ...transactions[index], ...updates };
    setStorage(DB_KEYS.TRANSACTIONS, transactions);
    
    return transactions[index];
  },

  async deleteTransaction(id: string): Promise<void> {
    await delay(300);
    const transactions = getStorage<Transaction[]>(DB_KEYS.TRANSACTIONS, []);
    const filtered = transactions.filter(t => t.id !== id);
    setStorage(DB_KEYS.TRANSACTIONS, filtered);
  },

  async deleteTransactionsByBudget(budgetId: string): Promise<void> {
    await delay(300);
    const transactions = getStorage<Transaction[]>(DB_KEYS.TRANSACTIONS, []);
    setStorage(DB_KEYS.TRANSACTIONS, transactions.filter(t => t.budgetId !== budgetId));
  }
};
