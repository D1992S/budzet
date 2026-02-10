import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { Target, Plus, Trash2, PiggyBank } from 'lucide-react';

interface SavingsManagerProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoal: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
}

export const SavingsManager: React.FC<SavingsManagerProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal
}) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [initial, setInitial] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;

    onAddGoal({
      name,
      targetAmount: parseFloat(target),
      currentAmount: initial ? parseFloat(initial) : 0,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    });

    setName('');
    setTarget('');
    setInitial('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-emerald-500/10">
        <div className="flex items-center gap-6 mb-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <PiggyBank size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Twoje Cele Oszczędnościowe</h2>
            <p className="text-emerald-100 mt-1 text-lg">Odkładaj regularnie, aby spełniać marzenia.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Add Goal Form */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Plus size={20} /> Nowy Cel
            </h3>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nazwa celu</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-colors"
                  placeholder="np. Wakacje 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kwota docelowa (PLN)</label>
                <input
                  type="number"
                  min="1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-colors"
                  placeholder="5000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kwota początkowa (opcjonalnie)</label>
                <input
                  type="number"
                  min="0"
                  value={initial}
                  onChange={(e) => setInitial(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-colors"
                  placeholder="0"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20"
              >
                Utwórz cel
              </button>
            </form>
          </div>
        </div>

        {/* Goals List */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
              <Target size={64} className="mb-6 opacity-50" />
              <p className="text-lg font-medium">Nie masz jeszcze żadnych celów oszczędnościowych.</p>
              <p className="text-sm mt-2">Dodaj pierwszy cel korzystając z formularza.</p>
            </div>
          ) : (
            goals.map((goal) => {
              const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              return (
                <div key={goal.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors hover:shadow-md">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-800 dark:text-white text-xl">{goal.name}</h4>
                      <button 
                        onClick={() => onDeleteGoal(goal.id)}
                        className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                      <span className="text-emerald-600 dark:text-emerald-400">{goal.currentAmount.toFixed(0)} PLN</span>
                      <span>z {goal.targetAmount.toFixed(0)} PLN</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 mb-6 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${percentage}%`, backgroundColor: goal.color || '#10b981' }}
                      >
                        {percentage > 15 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white leading-none">
                            {percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-5 border-t border-slate-50 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 block tracking-wider">Dodaj wpłatę</label>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        placeholder="+ Kwota"
                        className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val) && val > 0) {
                              onUpdateGoal(goal.id, val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        className="bg-slate-900 dark:bg-slate-700 text-white px-4 rounded-xl text-sm hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                        onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                          const val = parseFloat(input.value);
                          if (!isNaN(val) && val > 0) {
                            onUpdateGoal(goal.id, val);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
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