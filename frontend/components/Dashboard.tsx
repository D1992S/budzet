import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, BudgetSummary } from '../types';
import { Wallet, TrendingUp, TrendingDown, CalendarClock, CreditCard, Coins } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  summary: BudgetSummary;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, summary }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Prepare data for Pie Chart (Expenses by Category)
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

  // Prepare data for Bar Chart (Last 7 days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const barData = getLast7Days().map(date => {
    const dayTransactions = transactions.filter(t => t.date === date);
    return {
      date: date.slice(5), // MM-DD
      income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    };
  });

  const chartTextColor = isDark ? '#94a3b8' : '#64748b';
  const chartGridColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipBgColor = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorderColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipTextColor = isDark ? '#f1f5f9' : '#1e293b';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-colors">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Dostępne środki</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{summary.balance.toFixed(2)} PLN</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-colors">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Przychody (Suma)</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{summary.totalIncome.toFixed(2)} PLN</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-colors">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
            <TrendingDown size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Wydatki (Suma)</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{summary.totalExpense.toFixed(2)} PLN</h3>
          </div>
        </div>
      </div>

      {/* Assets & Liabilities Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Coins size={24} />
            </div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200">Inwestycje</h4>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{summary.investmentValue.toFixed(2)} PLN</h3>
            <p className={`text-sm font-medium ${summary.investmentProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {summary.investmentProfit >= 0 ? '+' : ''}{summary.investmentProfit.toFixed(2)} PLN (Zysk/Strata)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <CreditCard size={24} />
            </div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200">Zadłużenie</h4>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{summary.totalDebt.toFixed(2)} PLN</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pozostało do spłaty</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <CalendarClock size={24} />
            </div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200">Koszty Stałe</h4>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{summary.totalRecurringMonthly.toFixed(2)} PLN</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Szacowane miesięcznie</p>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Expense Structure */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Struktura Wydatków</h3>
          <div className="h-80 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)} PLN`}
                    contentStyle={{ backgroundColor: tooltipBgColor, borderColor: tooltipBorderColor, borderRadius: '12px', color: tooltipTextColor }}
                    itemStyle={{ color: tooltipTextColor }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                Brak danych o wydatkach
              </div>
            )}
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Ostatnie 7 dni</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="date" stroke={chartTextColor} tick={{ fill: chartTextColor }} axisLine={false} tickLine={false} />
                <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBgColor, borderColor: tooltipBorderColor, borderRadius: '12px', color: tooltipTextColor }}
                  cursor={{ fill: isDark ? '#334155' : '#f1f5f9', opacity: 0.4 }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" name="Przychód" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="expense" name="Wydatek" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};