import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronRight, BrainCircuit, Check, LogOut } from 'lucide-react';
import type { FixedExpense, BudgetPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../hooks/useDatabase';

const baseRatios = {
  food: 0.45,
  shopping: 0.30,
  travel: 0.10,
  other: 0.15,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState<string>('');
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);
  const [savingsTarget, setSavingsTarget] = useState(20); // Default 20%
  
  const { user, logOut } = useAuth();
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { saveBudget } = useBudget(user?.id, currentMonth);

  const handleAddFixedExpense = () => {
    if (newExpenseName && newExpenseAmount) {
      setFixedExpenses([...fixedExpenses, { 
        id: Math.random().toString(), 
        name: newExpenseName, 
        amount: parseFloat(newExpenseAmount) 
      }]);
      setNewExpenseName('');
      setNewExpenseAmount('');
    }
  };

  const handleRemoveFixedExpense = (id: string) => {
    setFixedExpenses(fixedExpenses.filter(e => e.id !== id));
  };

  const handleGenerateAI = async () => {
    if (!income || !user) return;
    setStep(2);
    setIsGenerating(true);
    
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const inc = parseFloat(income);
    const totalFixed = fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = inc - totalFixed;
    
    if (remaining < 0) {
      alert("Error: Fixed expenses exceed your income!");
      setStep(1);
      setIsGenerating(false);
      return;
    }

    const savings = remaining * (savingsTarget / 100);
    const flexible = remaining - savings;

    setBudgetPlan({
      id: `bud_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
      userId: user.id,
      month: currentMonth,
      income: inc,
      fixedExpenses,
      totalFixed,
      remainingFlexible: flexible,
      savingsTargetPercentage: savingsTarget,
      allocations: {
        food: flexible * baseRatios.food,
        shopping: flexible * baseRatios.shopping,
        travel: flexible * baseRatios.travel,
        other: flexible * baseRatios.other,
        savings: savings,
      }
    });
    
    setIsGenerating(false);
  };

  // Recalculate allocations dynamically if budgetPlan and savingsTarget change in Step 3
  useEffect(() => {
    if (budgetPlan && step === 3) {
      const savings = budgetPlan.remainingFlexible * (savingsTarget / 100);
      const flexible = budgetPlan.remainingFlexible - savings;
      
      setBudgetPlan({
        ...budgetPlan,
        savingsTargetPercentage: savingsTarget,
        allocations: {
          food: flexible * baseRatios.food,
          shopping: flexible * baseRatios.shopping,
          travel: flexible * baseRatios.travel,
          other: flexible * baseRatios.other,
          savings: savings
        }
      });
    }
  }, [savingsTarget]);

  const handleConfirmBudget = async () => {
    if (budgetPlan) {
      await saveBudget(budgetPlan);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-6 right-6">
        <button 
          onClick={async () => {
            await logOut();
            navigate('/login');
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Step Indicator */}
        <div className="flex border-b border-slate-100">
          {[1, 2, 3].map((num) => (
            <div key={num} className={`flex-1 text-center py-4 text-sm font-semibold transition-colors ${step >= num ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 bg-white'}`}>
              Step {num}
            </div>
          ))}
        </div>

        <div className="px-4 md:px-6 py-8 md:py-12 min-h-[400px]">
          {/* STEP 1: Input Form */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Let's set your baseline</h2>
                <p className="text-slate-500">Enter your total monthly allowance and your fixed mandatory expenses.</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Monthly Income / Allowance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input 
                    type="number" 
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Fixed/Certain Expenses</label>
                
                {fixedExpenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">{expense.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">₹{expense.amount.toFixed(2)}</span>
                      <button onClick={() => handleRemoveFixedExpense(expense.id)} className="text-red-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap sm:flex-nowrap gap-3">
                  <input 
                    type="text" 
                    value={newExpenseName}
                    onChange={(e) => setNewExpenseName(e.target.value)}
                    placeholder="Rent, Mess Bill, etc."
                    className="flex-1 min-w-[150px] px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input 
                    type="number" 
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full sm:w-32 px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button 
                    onClick={handleAddFixedExpense}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 min-h-[48px] rounded-xl transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleGenerateAI}
                disabled={!income}
                className="w-full bg-primary hover:bg-primary-light text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                Generate Smart Plan <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: AI Generation View */}
          {step === 2 && (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
              {isGenerating ? (
                <div className="text-center space-y-6">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">AI is analyzing your numbers...</h3>
                    <p className="text-slate-500 mt-2">Calculating optimal splits for Food, Shopping & Travel.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center w-full space-y-8">
                  <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto text-secondary">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Plan Generated!</h3>
                    <p className="text-slate-500 mt-2">We've found the perfect balance for your lifestyle.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
                     <StatCard label="Food & Drinks" value={budgetPlan?.allocations.food || 0} />
                     <StatCard label="Shopping" value={budgetPlan?.allocations.shopping || 0} />
                     <StatCard label="Travel" value={budgetPlan?.allocations.travel || 0} />
                     <StatCard label="Misc." value={budgetPlan?.allocations.other || 0} />
                     <StatCard label="Target Savings" value={budgetPlan?.allocations.savings || 0} highlight />
                  </div>

                  <button 
                    onClick={() => setStep(3)}
                    className="w-full bg-primary hover:bg-primary-light text-white py-4 rounded-xl font-semibold transition-colors mt-8"
                  >
                    Adjust Savings Target
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Flex Slider */}
          {step === 3 && budgetPlan && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">The Flex Slider</h2>
                 <p className="text-slate-500">Want to save more? Move the slider. We'll automatically adjust your lifestyle budget so you never overspend.</p>
               </div>

               <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Target Savings</span>
                      <div className="text-4xl font-bold text-secondary mt-1">{savingsTarget}%</div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Amount</span>
                      <div className="text-2xl font-bold text-slate-800 mt-1">₹{budgetPlan.allocations.savings.toFixed(2)}</div>
                    </div>
                  </div>

                  <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    step="5"
                    value={savingsTarget}
                    onChange={(e) => setSavingsTarget(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>0%</span>
                    <span>60%</span>
                  </div>
               </div>

               <div className="space-y-4">
                 <h4 className="font-semibold text-slate-800">Your Adjusted Lifestyle Budget:</h4>
                 <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                    <span className="text-slate-600">Food & Drinks</span>
                    <span className="font-bold text-slate-800">₹{budgetPlan.allocations.food.toFixed(2)}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                    <span className="text-slate-600">Shopping & Ent.</span>
                    <span className="font-bold text-slate-800">₹{budgetPlan.allocations.shopping.toFixed(2)}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                    <span className="text-slate-600">Travel & Transit</span>
                    <span className="font-bold text-slate-800">₹{budgetPlan.allocations.travel.toFixed(2)}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                    <span className="text-slate-600">Miscellaneous</span>
                    <span className="font-bold text-slate-800">₹{budgetPlan.allocations.other.toFixed(2)}</span>
                 </div>
               </div>

               <button 
                  onClick={handleConfirmBudget}
                  className="w-full bg-secondary hover:bg-secondary-alt text-slate-900 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-secondary/20"
                >
                  Confirm Budget & Go to Dashboard
                </button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, highlight = false }: { label: string, value: number, highlight?: boolean }) => (
  <div className={`p-4 rounded-xl border ${highlight ? 'bg-secondary/10 border-secondary/20' : 'bg-slate-50 border-slate-100'}`}>
    <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
    <div className={`text-xl font-bold ${highlight ? 'text-secondary' : 'text-slate-800'}`}>
      ₹{value.toFixed(0)}
    </div>
  </div>
);
