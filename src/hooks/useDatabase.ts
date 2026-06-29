import { useState, useEffect, useCallback } from 'react';
import { dbAdapter } from '../api/dbAdapter';
import type { BudgetPlan, Transaction } from '../types';

export function useBudget(userId: string | undefined, month: string) {
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await dbAdapter.getBudgetPlan(userId, month);
    setBudget(data);
    setLoading(false);
  }, [userId, month]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const saveBudget = async (plan: BudgetPlan) => {
    const saved = await dbAdapter.saveBudgetPlan(plan);
    setBudget(saved);
    return saved;
  };

  const deleteBudget = async (id: string) => {
    await dbAdapter.deleteBudget(id);
    setBudget(null);
  };

  return { budget, loading, saveBudget, fetchBudget, deleteBudget };
}

export function useLedger(userId: string | undefined, budgetId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = useCallback(async () => {
    if (!userId || !budgetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await dbAdapter.getTransactions(userId, budgetId);
    setTransactions(data);
    setLoading(false);
  }, [userId, budgetId]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const addTx = async (tx: Omit<Transaction, 'id'>) => {
    const tempId = `temp_${Date.now()}`;
    const tempTx = { ...tx, id: tempId } as Transaction;
    
    // Optimistic UI update
    setTransactions(curr => [tempTx, ...curr].sort((a, b) => b.timestamp - a.timestamp));

    try {
      const realTx = await dbAdapter.addTransaction(tx);
      setTransactions(curr => curr.map(t => (t.id === tempId ? realTx : t)).sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      setTransactions(curr => curr.filter(t => t.id !== tempId));
      throw e;
    }
  };

  const updateTx = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'userId' | 'budgetId'>>) => {
    const updated = await dbAdapter.updateTransaction(id, updates);
    setTransactions(curr => curr.map(t => t.id === id ? updated : t));
  };

  const deleteTx = async (id: string) => {
    await dbAdapter.deleteTransaction(id);
    setTransactions(curr => curr.filter(t => t.id !== id));
  };

  const deleteTransactionsByBudget = async (budgetId: string) => {
    await dbAdapter.deleteTransactionsByBudget(budgetId);
    setTransactions([]);
  };

  return { transactions, loading, addTx, updateTx, deleteTx, fetchLedger, deleteTransactionsByBudget };
}
