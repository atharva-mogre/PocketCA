import { supabase } from './supabaseConfig';
import type { User, BudgetPlan, Transaction } from '../types';

export const dbAdapter = {
  // --- AUTHENTICATION ---
  async signUp(name: string, email: string, password?: string): Promise<User> {
    if (!password) throw new Error("Password is required for Supabase sync.");
    
    // 1. Sign up user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Failed to create user.");

    // 2. Insert into custom public.users table
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email
      });

    if (dbError) throw new Error(dbError.message);

    return {
      id: authData.user.id,
      name,
      email,
      createdAt: Date.now()
    };
  },

  async logIn(email: string, password?: string): Promise<User> {
    if (!password) throw new Error("Password is required for Supabase sync.");
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Invalid credentials.");

    return {
      id: data.user.id,
      name: data.user.user_metadata?.name || 'User',
      email: data.user.email!,
      createdAt: Date.now()
    };
  },

  async logOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session || !session.user) return null;
    
    return {
      id: session.user.id,
      name: session.user.user_metadata?.name || 'User',
      email: session.user.email!,
      createdAt: Date.now()
    };
  },

  // --- BUDGET PLANS ---
  async getBudgetPlan(userId: string, month: string): Promise<BudgetPlan | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(error.message);
    }
    
    if (!data) return null;

    // Map snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      month: data.month,
      income: Number(data.income),
      fixedExpenses: data.fixed_expenses,
      totalFixed: Number(data.total_fixed),
      remainingFlexible: Number(data.remaining_flexible),
      allocations: data.allocations,
      savingsTargetPercentage: Number(data.savings_target_percentage)
    };
  },

  async saveBudgetPlan(plan: BudgetPlan): Promise<BudgetPlan> {
    const { error } = await supabase
      .from('budgets')
      .upsert({
        id: plan.id,
        user_id: plan.userId,
        month: plan.month,
        income: plan.income,
        fixed_expenses: plan.fixedExpenses,
        total_fixed: plan.totalFixed,
        remaining_flexible: plan.remainingFlexible,
        allocations: plan.allocations,
        savings_target_percentage: plan.savingsTargetPercentage
      });

    if (error) throw new Error(error.message);
    return plan;
  },

  async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- LEDGER (TRANSACTIONS) ---
  async getTransactions(userId: string, budgetId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('budget_id', budgetId)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(t => ({
      id: t.id,
      userId: t.user_id,
      budgetId: t.budget_id,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      description: t.description || '',
      timestamp: Number(t.timestamp)
    }));
  },

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTxId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const { error } = await supabase
      .from('transactions')
      .insert({
        id: newTxId,
        user_id: transaction.userId,
        budget_id: transaction.budgetId,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        timestamp: transaction.timestamp
      });

    if (error) throw new Error(error.message);

    return {
      ...transaction,
      id: newTxId
    };
  },

  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'userId' | 'budgetId'>>): Promise<Transaction> {
    // First get the transaction so we can return the full updated object
    const { data: current, error: getError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (getError) throw new Error(getError.message);

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(error.message);

    return {
      id: current.id,
      userId: current.user_id,
      budgetId: current.budget_id,
      amount: updates.amount !== undefined ? updates.amount : Number(current.amount),
      type: updates.type || current.type,
      category: updates.category || current.category,
      description: updates.description !== undefined ? updates.description : (current.description || ''),
      timestamp: Number(current.timestamp)
    };
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteTransactionsByBudget(budgetId: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('budget_id', budgetId);
    if (error) throw new Error(error.message);
  }
};
