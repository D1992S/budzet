import React, { useState } from 'react';
import { Debt } from '../types';
import { CreditCard, Plus, Trash2, TrendingDown, CheckCircle2 } from 'lucide-react';

interface DebtManagerProps {
  debts: Debt[];
  onAdd: (item: Omit<Debt, 'id'>) => void;
  onDelete: (id: string) => void;
  onPay: (id: string, amount: number) => void;
}

export const DebtManager: React.FC<DebtManagerProps> = ({ debts, onAdd, onDelete, onPay }) => {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interest, setInterest] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalAmount) return;

    onAdd({
      name,
      totalAmount: parseFloat(totalAmount),
      remainingAmount: parseFloat(totalAmount),
      interestRate: interest ? parseFloat(interest) : undefined
    });

    setName('');
    setTotalAmount('');
    setInterest('');
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 rounded-3xl p-8 text-white shadow-xl shadow-red-500/10">
        <div className="flex items-center gap-6 mb-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <CreditCard size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Zadłużenia i Kredyty</h2>
            <p className="text-red-100 mt-1 text-lg">Pozostało do spłaty: <span className="font-bold text-white">{totalDebt.toFixed(2)} PLN</span></p>
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
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nazwa (np. Kredyt hipoteczny)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Całkowita kwota (PLN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Oprocentowanie (%) - opcjonalne</label>
                <input
                  type="number"
                  step="0.1"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-lg shadow-red-600/20"
              >
                Dodaj Dług
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="xl:col-span-2 grid grid-cols-1 gap-6">
          {debts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
              <CheckCircle2 size={64} className="mb-6 opacity-50 text-emerald-500" />
              <p className="text-lg font-medium">Gratulacje! Nie masz żadnych długów.</p>
            </div>
          ) : (
            debts.map((debt) => {
              const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
              return (
                <div key={debt.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xl">{debt.name}</h4>
                      {debt.interestRate && (
                        <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md mt-1 inline-block font-medium">
                          RRSO: {debt.interestRate}%
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => onDelete(debt.id)}
                      className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <span>Spłacono: {(debt.totalAmount - debt.remainingAmount).toFixed(2)} PLN</span>
                    <span>Pozostało: <span className="font-bold text-red-600 dark:text-red-400">{debt.remainingAmount.toFixed(2)} PLN</span></span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 mb-6 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 block tracking-wider">Dokonaj spłaty</label>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        placeholder="Kwota spłaty"
                        className="flex-1 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val) && val > 0) {
                              onPay(debt.id, val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        className="bg-slate-900 dark:bg-slate-700 text-white px-6 rounded-xl text-sm hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                        onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                          const val = parseFloat(input.value);
                          if (!isNaN(val) && val > 0) {
                            onPay(debt.id, val);
                            input.value = '';
                          }
                        }}
                      >
                        <TrendingDown size={16} /> Spłać
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">* Spłata zostanie automatycznie dodana do historii transakcji jako wydatek.</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};