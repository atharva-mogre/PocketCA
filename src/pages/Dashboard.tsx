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
  const [showFullInsight, setShowFullInsight] = useState(false);
  
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Monthly Workspace</h1>
          <p className="text-sm sm:text-base text-slate-500">Track your progress and stay on target.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              await logOut();
              navigate('/login');
            }}
            className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 px-3 sm:px-4 py-2 font-medium transition-colors min-h-[48px] text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Log Out</span>
          </button>
          <button 
            onClick={() => setShowSummaryModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium transition-colors min-h-[48px] text-sm sm:text-base"
          >
            <Archive className="w-4 h-4 sm:w-5 sm:h-5" /> Close Logs
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Ledger & Tracking & Savings Target */}
        <div className="lg:col-span-2 flex flex-col gap-6 sm:gap-8">
          
          {/* Combined Log Entry & Progress Bars */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
            
            {/* Quick Add */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" /> Log Entry
                </h2>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setTxType('expense')} className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${txType === 'expense' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Expense</button>
                  <button type="button" onClick={() => setTxType('credit')} className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${txType === 'credit' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>Income</button>
                </div>
              </div>
              <form onSubmit={handleAddTx} className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <input 
                  type="number" 
                  placeholder="Amount (₹)" 
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="flex-1 min-w-[120px] px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-primary min-h-[48px]"
                  required
                />
                {txType === 'expense' && (
                  <select 
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as any)}
                    className="flex-1 min-w-[140px] px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-primary bg-white min-h-[48px]"
                  >
                    <option value="Food">Food & Drinks</option>
                    <option value="Shopping">Shopping & Ent.</option>
                    <option value="Travel">Travel & Transit</option>
                    {hasFixed && <option value="Fixed">Fixed Expense</option>}
                    <option value="Other">Other / Misc</option>
                  </select>
                )}
                <input 
                  type="text" 
                  placeholder="Description (optional)" 
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full sm:w-auto sm:flex-2 min-w-[200px] px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-primary min-h-[48px]"
                />
                <button type="submit" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors min-w-[80px] min-h-[48px]">
                  Add
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100"></div>

            {/* Progress Bars */}
            <div className="space-y-5 sm:space-y-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary" /> Active Budget Tracking
              </h2>
              
              <CategoryProgress label="Food & Drinks" spent={spent.Food} allocated={budget.allocations.food} />
              <CategoryProgress label="Shopping & Ent." spent={spent.Shopping} allocated={budget.allocations.shopping} />
              <CategoryProgress label="Travel & Transit" spent={spent.Travel} allocated={budget.allocations.travel} />
              <CategoryProgress label="Other / Misc" spent={spent.Other} allocated={budget.allocations.other} />
              {hasFixed && <CategoryProgress label="Fixed Expenses" spent={spent.Fixed} allocated={totalFixed} />}
              
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100">
                <CategoryProgress label="Overall Budget Used" spent={effectiveTotalSpent} allocated={totalAvailable} isOverall={true} />
              </div>
            </div>
          </div>

          {/* Repositioned Savings Target */}
          <div className={`text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-colors ${dynamicSavings < 0 ? 'bg-red-600' : 'bg-primary'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 opacity-90">Savings Target</h2>
            <div className={`text-3xl sm:text-4xl font-bold mb-1 ${dynamicSavings < 0 ? 'text-white' : 'text-secondary'}`}>
              ₹{dynamicSavings.toFixed(2)}
            </div>
            <div className="text-xs sm:text-sm text-white/80">
              {dynamicSavings < 0 ? 'Warning: You have overspent your available funds!' : `Your initial goal was ₹${budget.allocations.savings.toFixed(2)}`}
            </div>
          </div>
        </div>

        {/* Right Column: Carousel on Mobile, Stack on Desktop */}
        <div className="lg:col-span-1">
          {/* Mobile Carousel Wrapper */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible snap-x snap-mandatory scrollbar-hide gap-4 pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0">
            
            {/* Chart Card */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm min-w-[85vw] sm:min-w-[400px] lg:min-w-0 snap-center lg:mb-8 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" /> Reality Check
              </h2>
              
              <div className="h-56 sm:h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                    <Bar dataKey="Recommended" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Actual" fill="#0D3B66" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Recent Logs Card */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm min-w-[85vw] sm:min-w-[400px] lg:min-w-0 snap-center lg:mb-8 shrink-0 flex flex-col h-full">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Recent Logs</h2>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] scrollbar-hide">
                {transactions.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No entries logged yet.</p>
                ) : (
                  transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between items-center p-2 sm:p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                      {editingId === t.id ? (
                        <div className="flex-1 flex flex-wrap gap-2 items-center">
                          <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-16 sm:w-20 px-2 py-1 border border-slate-200 rounded text-xs sm:text-sm outline-none focus:border-primary min-h-[36px]" />
                          <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)} className="w-20 sm:w-24 px-1 py-1 border border-slate-200 rounded text-xs sm:text-sm bg-white outline-none focus:border-primary min-h-[36px]">
                            <option value="Food">Food</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Travel">Travel</option>
                            {hasFixed && <option value="Fixed">Fixed</option>}
                            <option value="Other">Other</option>
                            <option value="Credit">Credit</option>
                          </select>
                          <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="flex-1 min-w-[70px] px-2 py-1 border border-slate-200 rounded text-xs sm:text-sm outline-none focus:border-primary min-h-[36px]" />
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdateTx(t.id)} className="text-green-600 hover:text-green-700 p-2 bg-green-50 rounded min-h-[36px]"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded min-h-[36px]"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-medium text-slate-700 text-sm sm:text-base truncate">{t.description}</div>
                            <div className="text-[10px] sm:text-xs text-slate-400 truncate">{t.category} • {new Date(t.timestamp).toLocaleDateString()}</div>
                          </div>
                          <div className={`font-bold text-sm sm:text-base whitespace-nowrap ${t.category === 'Credit' ? 'text-green-600' : 'text-slate-800'}`}>
                            {t.category === 'Credit' ? '+' : '-'}₹{t.amount.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1 ml-2 sm:ml-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditing(t)} className="text-slate-400 hover:text-primary transition-colors p-2 rounded hover:bg-primary/10 min-h-[36px]"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteTx(t.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded hover:bg-red-50 min-h-[36px]"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="min-w-[85vw] sm:min-w-[400px] lg:min-w-0 snap-center shrink-0">
              <div className={`p-4 sm:p-5 rounded-2xl ${isOverBudget ? 'bg-red-50 text-red-700 border-red-100' : 'bg-primary/5 text-primary-light border-primary/10'} border text-xs sm:text-sm leading-relaxed shadow-sm`}>
                <div className="flex items-center justify-between font-bold mb-2">
                  <span>AI Insight</span>
                  <button 
                    onClick={() => setShowFullInsight(!showFullInsight)}
                    className="text-xs underline opacity-70 hover:opacity-100 min-h-[32px] px-2 -mr-2"
                  >
                    {showFullInsight ? "Show Less" : "Read More"}
                  </button>
                </div>
                <div>
                  {isOverBudget 
                    ? "🚨 Warning: You are trending over your budget limits."
                    : (spent.Shopping > budget.allocations.shopping) 
                      ? "⚠️ You hit your savings, but overspent on Shopping." 
                      : "✅ Excellent pacing. You are within AI limits."
                  }
                </div>
                {showFullInsight && (
                  <div className="mt-2 pt-2 border-t border-current/10 opacity-90">
                    {isOverBudget 
                      ? "You have exceeded the recommended maximums. Watch your flexible spending closely for the rest of the month to ensure you still hit your baseline savings target."
                      : (spent.Shopping > budget.allocations.shopping) 
                        ? "Watch out for impulse buys next month! Shifting funds from other flexible categories is covering the difference this month." 
                        : "Your spending behavior matches the ideal allocation perfectly. Your savings target is completely secure at this pace."
                    }
                  </div>
                )}
              </div>
            </div>

          </div>
          
          {/* Mobile Carousel Indicators */}
          <div className="flex lg:hidden justify-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
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
