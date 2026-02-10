import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, PiggyBank, Bot, Menu, X, Database, CalendarClock, CreditCard, TrendingUp, HardDriveUpload } from 'lucide-react';
import { Transaction, SavingsGoal, BudgetSummary, RecurringExpense, Debt, Investment } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { SavingsManager } from './components/SavingsManager';
import { RecurringManager } from './components/RecurringManager';
import { DebtManager } from './components/DebtManager';
import { InvestmentManager } from './components/InvestmentManager';
import { AiAdvisor } from './components/AiAdvisor';
import { DataBackupManager } from './components/DataBackupManager';
import { db } from './db';

// Initial Dummy Data (used only on first run)
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', amount: 5000, type: 'income', category: 'Wypłata', description: 'Wynagrodzenie miesięczne', date: new Date().toISOString().split('T')[0] },
  { id: '2', amount: 250, type: 'expense', category: 'Jedzenie', description: 'Zakupy spożywcze', date: new Date().toISOString().split('T')[0] },
  { id: '3', amount: 120, type: 'expense', category: 'Transport', description: 'Paliwo', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
];

const INITIAL_GOALS: SavingsGoal[] = [
  { id: '1', name: 'Wakacje', targetAmount: 5000, currentAmount: 1200, color: '#10b981' },
  { id: '2', name: 'Nowy Laptop', targetAmount: 4000, currentAmount: 800, color: '#3b82f6' },
];

type View = 'dashboard' | 'transactions' | 'recurring' | 'debts' | 'investments' | 'savings' | 'ai' | 'backup';

const App: React.FC = () => {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load data from DB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const txsCount = await db.transactions.count();
        
        if (txsCount === 0) {
          // Seed initial data
          await db.transactions.bulkAdd(INITIAL_TRANSACTIONS);
          await db.goals.bulkAdd(INITIAL_GOALS);
          setTransactions(INITIAL_TRANSACTIONS);
          setGoals(INITIAL_GOALS);
        } else {
          // Load existing data
          await reloadDataFromDb();
        }
      } catch (error) {
        console.error("Failed to load data from DB:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const reloadDataFromDb = async () => {
    const txs = await db.transactions.orderBy('date').reverse().toArray();
    const gls = await db.goals.toArray();
    const recs = await db.recurringExpenses.toArray();
    const dbs = await db.debts.toArray();
    const invs = await db.investments.toArray();

    setTransactions(txs);
    setGoals(gls);
    setRecurringExpenses(recs);
    setDebts(dbs);
    setInvestments(invs);
  };

  // --- Transaction Handlers ---
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    await db.transactions.add(newTransaction);
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- Goal Handlers ---
  const addGoal = async (g: Omit<SavingsGoal, 'id'>) => {
    const newGoal = { ...g, id: Date.now().toString() };
    await db.goals.add(newGoal);
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = async (id: string, amountToAdd: number) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amountToAdd };
      await db.goals.put(updatedGoal);
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
    }
  };

  const deleteGoal = async (id: string) => {
    await db.goals.delete(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // --- Recurring Expense Handlers ---
  const addRecurring = async (item: Omit<RecurringExpense, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    await db.recurringExpenses.add(newItem);
    setRecurringExpenses(prev => [...prev, newItem]);
  };

  const deleteRecurring = async (id: string) => {
    await db.recurringExpenses.delete(id);
    setRecurringExpenses(prev => prev.filter(i => i.id !== id));
  };

  // --- Debt Handlers ---
  const addDebt = async (item: Omit<Debt, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    await db.debts.add(newItem);
    setDebts(prev => [...prev, newItem]);
  };

  const deleteDebt = async (id: string) => {
    await db.debts.delete(id);
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  const payDebt = async (id: string, amount: number) => {
    const debt = debts.find(d => d.id === id);
    if (debt) {
      // 1. Update Debt
      const newRemaining = Math.max(0, debt.remainingAmount - amount);
      const updatedDebt = { ...debt, remainingAmount: newRemaining };
      await db.debts.put(updatedDebt);
      setDebts(prev => prev.map(d => d.id === id ? updatedDebt : d));

      // 2. Add Transaction
      await addTransaction({
        amount: amount,
        type: 'expense',
        category: 'Spłata Długu',
        description: `Spłata: ${debt.name}`,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  // --- Investment Handlers ---
  const addInvestment = async (item: Omit<Investment, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    await db.investments.add(newItem);
    setInvestments(prev => [...prev, newItem]);
  };

  const updateInvestmentValue = async (id: string, currentValue: number) => {
    const investment = investments.find(i => i.id === id);
    if (investment) {
      const updatedInvestment = { ...investment, currentValue };
      await db.investments.put(updatedInvestment);
      setInvestments(prev => prev.map(i => i.id === id ? updatedInvestment : i));
    }
  };

  const deleteInvestment = async (id: string) => {
    await db.investments.delete(id);
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  // Derived State
  const summary: BudgetSummary = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    get balance() { return this.totalIncome - this.totalExpense; },
    totalRecurringMonthly: recurringExpenses.reduce((sum, item) => {
      return sum + (item.frequency === 'monthly' ? item.amount : item.amount / 12);
    }, 0),
    totalDebt: debts.reduce((sum, d) => sum + d.remainingAmount, 0),
    investmentValue: investments.reduce((sum, i) => sum + i.currentValue, 0),
    investmentProfit: investments.reduce((sum, i) => sum + (i.currentValue - i.amountInvested), 0)
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Przegląd', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transakcje', icon: Receipt },
    { id: 'recurring', label: 'Cykliczne', icon: CalendarClock },
    { id: 'debts', label: 'Długi', icon: CreditCard },
    { id: 'investments', label: 'Inwestycje', icon: TrendingUp },
    { id: 'savings', label: 'Oszczędności', icon: PiggyBank },
    { id: 'ai', label: 'Asystent AI', icon: Bot },
    { id: 'backup', label: 'Backup danych', icon: HardDriveUpload },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p>Ładowanie bazy danych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-2">
          <PiggyBank className="text-emerald-500" /> Grosz do Grosza
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-slate-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 hidden md:block">
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-2">
            <PiggyBank className="text-emerald-500" /> Grosz do Grosza
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as View);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                currentView === item.id 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <Database size={12} /> Baza lokalna
            </div>
            <p className="text-xs text-slate-400 mb-1">Aktualny Bilans</p>
            <p className="text-xl font-bold">{summary.balance.toFixed(2)} PLN</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
              {navItems.find(i => i.id === currentView)?.label}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Zarządzaj swoimi finansami mądrze.</p>
          </header>

          {currentView === 'dashboard' && (
            <Dashboard transactions={transactions} summary={summary} />
          )}

          {currentView === 'transactions' && (
            <TransactionManager 
              transactions={transactions} 
              onAddTransaction={addTransaction}
              onDeleteTransaction={deleteTransaction}
            />
          )}

          {currentView === 'recurring' && (
            <RecurringManager 
              expenses={recurringExpenses}
              onAdd={addRecurring}
              onDelete={deleteRecurring}
            />
          )}

          {currentView === 'debts' && (
            <DebtManager 
              debts={debts}
              onAdd={addDebt}
              onDelete={deleteDebt}
              onPay={payDebt}
            />
          )}

          {currentView === 'investments' && (
            <InvestmentManager 
              investments={investments}
              onAdd={addInvestment}
              onUpdate={updateInvestmentValue}
              onDelete={deleteInvestment}
            />
          )}

          {currentView === 'savings' && (
            <SavingsManager 
              goals={goals}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
            />
          )}

          {currentView === 'ai' && (
            <AiAdvisor transactions={transactions} goals={goals} />
          )}

          {currentView === 'backup' && (
            <DataBackupManager onImported={reloadDataFromDb} />
          )}
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;