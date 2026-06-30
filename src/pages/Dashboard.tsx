import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, BrainCircuit, Activity, Trash2, Pencil, Check, X, Archive, LogOut } from 'lucide-react';
import type { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { useBudget, useLedger } from '../hooks/useDatabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  
  // Create a current month string, e.g., "2026-06"
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  const { budget, loading: budgetLoading, deleteBudget } = useBudget(user?.id, currentMonth);
  const { transactions, addTx, updateTx, deleteTx, loading: ledgerLoading, deleteTransactionsByBudget } = useLedger(user?.id, budget?.id);
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const [txType, setTxType] = useState<'expense' | 'credit'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<'Food' | 'Shopping' | 'Travel' | 'Fixed' | 'Other'>('Food');
  const [txDesc, setTxDesc] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<'Food' | 'Shopping' | 'Travel' | 'Fixed' | 'Other' | 'Credit' | 'Savings'>('Food');
  const [editDesc, setEditDesc] = useState('');

  const handleDeleteTx = async (id: string) => {
    await deleteTx(id);
  };

  const startEditing = (t: Transaction) => {
    setEditingId(t.id);
    setEditAmount(t.amount.toString());
    setEditCategory(t.category);
    setEditDesc(t.description);
  };

  const handleUpdateTx = async (id: string) => {
    if (!editAmount || !editCategory) return;
    await updateTx(id, {
      amount: parseFloat(editAmount),
      category: editCategory,
      description: editDesc || (editCategory === 'Credit' ? 'Income' : 'Expense')
    });
    setEditingId(null);
  };

  useEffect(() => {
    if (!budgetLoading && !budget) {
      navigate('/onboarding');
    }
  }, [budget, budgetLoading, navigate]);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || (txType === 'expense' && !txCategory) || !user?.id || !budget?.id) return;
    
    await addTx({
      userId: user.id,
      budgetId: budget.id,
      amount: parseFloat(txAmount),
      type: txType === 'credit' ? 'credit' : 'debit',
      category: txType === 'credit' ? 'Credit' : txCategory,
      description: txDesc || (txType === 'credit' ? 'Income' : 'Expense'),
      timestamp: Date.now()
    });
    
    setTxAmount('');
    setTxDesc('');
  };

  if (budgetLoading || ledgerLoading) return <div className="p-8 text-center text-slate-500">Loading your workspace...</div>;
  if (!budget) return null; // Will redirect via useEffect

  // Dynamic Calculations
  const totalCredits = transactions.filter(t => t.category === 'Credit').reduce((sum, t) => sum + t.amount, 0);
  const totalAvailable = budget.income + totalCredits;

  const totalFixed = budget.totalFixed || 0;
  const hasFixed = totalFixed > 0;
  
  const spent = {
    Food: transactions.filter(t => t.category === 'Food').reduce((sum, t) => sum + t.amount, 0),
    Shopping: transactions.filter(t => t.category === 'Shopping').reduce((sum, t) => sum + t.amount, 0),
    Travel: transactions.filter(t => t.category === 'Travel').reduce((sum, t) => sum + t.amount, 0),
    Fixed: transactions.filter(t => t.category === 'Fixed').reduce((sum, t) => sum + t.amount, 0),
    Other: transactions.filter(t => t.category === 'Other').reduce((sum, t) => sum + t.amount, 0),
  };

  const flexibleSpent = spent.Food + spent.Shopping + spent.Travel + spent.Other;
  
  // To avoid a false sense of security, we assume the user has at least spent their planned fixed expenses
  // until they log an amount that exceeds it.
  const assumedFixedSpent = Math.max(totalFixed, spent.Fixed);
  const effectiveTotalSpent = flexibleSpent + assumedFixedSpent;
  
  const dynamicSavings = totalAvailable - effectiveTotalSpent;

  const chartData = [
    { name: 'Food', Recommended: budget.allocations.food, Actual: spent.Food },
    { name: 'Shopping', Recommended: budget.allocations.shopping, Actual: spent.Shopping },
    { name: 'Travel', Recommended: budget.allocations.travel, Actual: spent.Travel },
    ...(hasFixed ? [{ name: 'Fixed', Recommended: totalFixed, Actual: spent.Fixed }] : []),
    { name: 'Other', Recommended: budget.allocations.other, Actual: spent.Other },
  ];

  const remainingFlexible = budget.remainingFlexible || (budget.income - totalFixed);
  const isOverBudget = flexibleSpent > (remainingFlexible + totalCredits - budget.allocations.savings);

  return (
    <div className="main-container max-w-6xl mx-auto px-6 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Monthly Workspace</h1>
          <p className="text-slate-500">Track your progress and stay on target.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              await logOut();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-3 sm:px-4 py-2.5 font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log Out</span>
          </button>
          <button 
            onClick={() => setShowSummaryModal(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Archive className="w-4 h-4" /> Close Logs
          </button>
        </div>
      </header>

      <div className="dashboard-grid grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Ledger & Tracking */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Add */}
          <div className="log-entry-card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Log Entry
              </h2>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button type="button" onClick={() => setTxType('expense')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${txType === 'expense' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Expense</button>
                <button type="button" onClick={() => setTxType('credit')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${txType === 'credit' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>Credit / Income</button>
              </div>
            </div>
            <form onSubmit={handleAddTx} className="flex flex-wrap gap-4">
              <input 
                type="number" 
                placeholder="Amount (₹)" 
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="w-full sm:w-auto flex-1 min-w-[120px] px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-primary"
                required
              />
              {txType === 'expense' && (
                <select 
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as any)}
                  className="w-full sm:w-auto flex-1 min-w-[140px] px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-primary bg-white"
                >
                  <option value="Food">Food & Drinks</option>
                  <option value="Shopping">Shopping & Ent.</option>
                  <option value="Travel">Travel & Transit</option>
                  {hasFixed && <option value="Fixed">Fixed Expense</option>}
                  <option value="Other">Other / Miscellaneous</option>
                </select>
              )}
              <input 
                type="text" 
                placeholder="Description (optional)" 
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                className="w-full sm:w-auto flex-2 min-w-[200px] px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-primary"
              />
              <button type="submit" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors min-w-[80px]">
                Add
              </button>
            </form>
          </div>

          {/* Progress Bars */}
          <div className="budget-tracking-card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-secondary" /> Active Budget Tracking
            </h2>
            
            <CategoryProgress label="Food & Drinks" spent={spent.Food} allocated={budget.allocations.food} />
            <CategoryProgress label="Shopping & Ent." spent={spent.Shopping} allocated={budget.allocations.shopping} />
            <CategoryProgress label="Travel & Transit" spent={spent.Travel} allocated={budget.allocations.travel} />
            <CategoryProgress label="Other / Misc" spent={spent.Other} allocated={budget.allocations.other} />
            {hasFixed && <CategoryProgress label="Fixed Expenses" spent={spent.Fixed} allocated={totalFixed} />}
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <CategoryProgress label="Overall Budget Used" spent={effectiveTotalSpent} allocated={totalAvailable} isOverall={true} />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Logs</h2>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No entries logged yet.</p>
              ) : (
                transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                    {editingId === t.id ? (
                      <div className="flex-1 flex gap-2 items-center">
                        <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm outline-none focus:border-primary" />
                        <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)} className="w-24 px-2 py-1 border border-slate-200 rounded text-sm bg-white outline-none focus:border-primary">
                          <option value="Food">Food</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Travel">Travel</option>
                          {hasFixed && <option value="Fixed">Fixed</option>}
                          <option value="Other">Other</option>
                          <option value="Credit">Credit</option>
                        </select>
                        <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="flex-1 min-w-[80px] px-2 py-1 border border-slate-200 rounded text-sm outline-none focus:border-primary" />
                        <button onClick={() => handleUpdateTx(t.id)} className="text-green-600 hover:text-green-700 p-1 bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="font-medium text-slate-700">{t.description}</div>
                          <div className="text-xs text-slate-400">{t.category} • {new Date(t.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div className={`font-bold ${t.category === 'Credit' ? 'text-green-600' : 'text-slate-800'}`}>
                          {t.category === 'Credit' ? '+' : '-'}₹{t.amount.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(t)} className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded hover:bg-primary/10"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteTx(t.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Reality Check */}
        <div className="space-y-8">
          
          <div className={`savings-target-card text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-colors ${dynamicSavings < 0 ? 'bg-red-600' : 'bg-primary'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-lg font-semibold mb-2 opacity-90">Savings Target</h2>
            <div className={`text-4xl font-bold mb-1 ${dynamicSavings < 0 ? 'text-white' : 'text-secondary'}`}>
              ₹{dynamicSavings.toFixed(2)}
            </div>
            <div className="text-sm text-white/80">
              {dynamicSavings < 0 ? 'Warning: You have overspent your available funds!' : `Your initial goal was ₹${budget.allocations.savings.toFixed(2)}`}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" /> End-of-Month Reality Check
            </h2>
            
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                  <Bar dataKey="Recommended" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#0D3B66" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mb-6">
              <CategoryProgress label="Overall Budget Used" spent={effectiveTotalSpent} allocated={totalAvailable} isOverall={true} />
            </div>

            <div className={`ai-insight-card p-4 rounded-xl ${isOverBudget ? 'bg-red-50 text-red-700 border-red-100' : 'bg-primary/5 text-primary-light border-primary/10'} border text-sm leading-relaxed`}>
              <strong>AI Insight:</strong> {
                isOverBudget 
                ? "You are trending over your recommended budget limits. Watch your flexible spending to ensure you hit your savings target."
                : (spent.Shopping > budget.allocations.shopping) 
                  ? "You hit your savings goal perfectly, but you overspent on your Shopping budget. Watch out for impulse buys next month!" 
                  : "Excellent pacing. You are well within the AI recommended limits across all categories. Your savings target is secure."
              }
            </div>
          </div>

        </div>
      </div>

      {/* Close Logs Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">End of Month Summary</h2>
              <button 
                onClick={() => setShowSummaryModal(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-slate-500 mb-6">Here is how you performed against your AI recommended budget plan this month.</p>
            
            <div className="h-64 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                  <Bar dataKey="Recommended" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#0D3B66" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mb-8">
              <CategoryProgress label="Overall Budget Used" spent={effectiveTotalSpent} allocated={totalAvailable} isOverall={true} />
            </div>

            <div className={`mb-8 p-4 rounded-xl ${isOverBudget ? 'bg-red-50 text-red-700 border-red-100' : 'bg-primary/5 text-primary-light border-primary/10'} border text-sm leading-relaxed`}>
              <strong>Final AI Insight:</strong> {
                isOverBudget 
                ? "You trended over your recommended budget limits this month. Let's aim to strictly monitor flexible spending in the next cycle."
                : (spent.Shopping > budget.allocations.shopping) 
                  ? "You hit your savings goal perfectly, but you overspent on Shopping. Watch out for impulse buys next month!" 
                  : "Excellent pacing. You stayed well within the AI limits across all categories and secured your savings target."
              }
            </div>

            <button 
              onClick={async () => {
                setIsResetting(true);
                await deleteTransactionsByBudget(budget.id);
                await deleteBudget(budget.id);
                navigate('/onboarding');
              }}
              disabled={isResetting}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isResetting ? 'Resetting Workspace...' : 'Reset Logs & Start Fresh Month'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CategoryProgress = ({ label, spent, allocated, isOverall = false }: { label: string, spent: number, allocated: number, isOverall?: boolean }) => {
  const percent = Math.min((spent / allocated) * 100 || 0, 100);
  
  let colorClass = "bg-secondary"; // Green
  if (percent > 75) colorClass = "bg-amber-400"; // Amber
  if (percent >= 90) colorClass = "bg-red-500"; // Red

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className={`font-medium ${isOverall ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>{label}</span>
        <span className="text-slate-500">
          <span className={percent >= 100 ? "text-red-500 font-bold" : "text-slate-800 font-semibold"}>₹{spent.toFixed(2)}</span> / ₹{allocated.toFixed(2)}
        </span>
      </div>
      <div className={`bg-slate-100 rounded-full overflow-hidden ${isOverall ? 'h-4' : 'h-3'}`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
