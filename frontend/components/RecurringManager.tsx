import React, { useState } from 'react';
import { RecurringExpense, CATEGORIES } from '../types';
import { CalendarClock, Plus, Trash2, Calendar } from 'lucide-react';

interface RecurringManagerProps {
  expenses: RecurringExpense[];
  onAdd: (item: Omit<RecurringExpense, 'id'>) => void;
  onDelete: (id: string) => void;
}

export const RecurringManager: React.FC<RecurringManagerProps> = ({ expenses, onAdd, onDelete }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [category, setCategory] = useState('Rachunki');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    onAdd({
      name,
      amount: parseFloat(amount),
      frequency,
      dueDay: parseInt(dueDay),
      category
    });

    setName('');
    setAmount('');
    setDueDay('1');
  };

  const totalMonthly = expenses.reduce((sum, item) => {
    if (item.frequency === 'monthly') return sum + item.amount;
    return sum + (item.amount / 12);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="flex items-center gap-6 mb-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <CalendarClock size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Wydatki Regularne</h2>
            <p className="text-blue-100 mt-1 text-lg">Twoje stałe zobowiązania miesięczne: <span className="font-bold text-white">{totalMonthly.toFixed(2)} PLN</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Plus size={20} /> Dodaj Zobowiązanie
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nazwa</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  placeholder="np. Netflix, Czynsz"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kwota (PLN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dzień płatności</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Częstotliwość</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="monthly">Miesięcznie</option>
                    <option value="yearly">Rocznie</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kategoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
              >
                Dodaj
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {expenses.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
              <Calendar size={64} className="mb-6 opacity-50" />
              <p className="text-lg font-medium">Brak zdefiniowanych wydatków stałych.</p>
            </div>
          ) : (
            expenses.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">{item.name}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mt-1 inline-block">
                      {item.category}
                    </span>
                  </div>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Kwota</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{item.amount.toFixed(2)} PLN</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Płatność</p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {item.dueDay}. dzień {item.frequency === 'monthly' ? 'miesiąca' : 'roku'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};