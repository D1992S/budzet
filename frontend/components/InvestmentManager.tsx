import React, { useState } from 'react';
import { Investment } from '../types';
import { TrendingUp, TrendingDown, Plus, Trash2, Coins, Landmark, Building, Briefcase, RefreshCw } from 'lucide-react';

interface InvestmentManagerProps {
  investments: Investment[];
  onAdd: (item: Omit<Investment, 'id'>) => void;
  onUpdate: (id: string, currentValue: number) => void;
  onDelete: (id: string) => void;
}

export const InvestmentManager: React.FC<InvestmentManagerProps> = ({ investments, onAdd, onUpdate, onDelete }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Investment['type']>('stock');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !invested || !current) return;

    onAdd({
      name,
      type,
      amountInvested: parseFloat(invested),
      currentValue: parseFloat(current),
      date: new Date().toISOString().split('T')[0]
    });

    setName('');
    setInvested('');
    setCurrent('');
  };

  const totalInvested = investments.reduce((sum, i) => sum + i.amountInvested, 0);
  const totalValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalProfit = totalValue - totalInvested;
  const totalRoi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const getIcon = (type: Investment['type']) => {
    switch (type) {
      case 'crypto': return <Coins size={20} />;
      case 'stock': return <TrendingUp size={20} />;
      case 'real_estate': return <Building size={20} />;
      case 'bond': return <Landmark size={20} />;
      default: return <Briefcase size={20} />;
    }
  };

  const getTypeLabel = (type: Investment['type']) => {
    switch (type) {
      case 'crypto': return 'Kryptowaluty';
      case 'stock': return 'Akcje / ETF';
      case 'real_estate': return 'Nieruchomości';
      case 'bond': return 'Obligacje';
      default: return 'Inne';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className={`rounded-3xl p-8 text-white shadow-xl transition-colors ${
        totalProfit >= 0 
          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/10' 
          : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/10'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <TrendingUp size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Portfel Inwestycyjny</h2>
              <p className="text-white/80 mt-1 text-lg">
                Wartość: <span className="font-bold text-white">{totalValue.toFixed(2)} PLN</span>
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm min-w-[200px]">
            <p className="text-sm text-white/70 mb-1">Całkowity Zysk/Strata</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">
                {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)} PLN
              </span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-lg ${totalProfit >= 0 ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`}>
                {totalRoi.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Plus size={20} /> Dodaj Aktywo
            </h3>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nazwa (np. Bitcoin, Apple)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Typ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="stock">Akcje / ETF</option>
                  <option value="crypto">Kryptowaluty</option>
                  <option value="bond">Obligacje</option>
                  <option value="real_estate">Nieruchomości</option>
                  <option value="other">Inne</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Zainwestowano</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invested}
                    onChange={(e) => setInvested(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Obecna Wartość</label>
                  <input
                    type="number"
                    step="0.01"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-lg shadow-slate-900/10 dark:shadow-emerald-900/20"
              >
                Dodaj do Portfela
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {investments.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
              <Briefcase size={64} className="mb-6 opacity-50" />
              <p className="text-lg font-medium">Twój portfel jest pusty.</p>
              <p className="text-sm mt-2">Dodaj swoje pierwsze inwestycje.</p>
            </div>
          ) : (
            investments.map((item) => {
              const profit = item.currentValue - item.amountInvested;
              const roi = item.amountInvested > 0 ? (profit / item.amountInvested) * 100 : 0;
              const isProfitable = profit >= 0;

              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isProfitable ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                        {getIcon(item.type)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">{item.name}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{getTypeLabel(item.type)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Zainwestowano</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{item.amountInvested.toFixed(2)} PLN</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Wartość</p>
                      <p className={`font-bold ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {item.currentValue.toFixed(2)} PLN
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className={`text-sm font-medium flex items-center gap-1 ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isProfitable ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {roi.toFixed(2)}% ({profit > 0 ? '+' : ''}{profit.toFixed(2)})
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        placeholder="Nowa wartość"
                        className="w-24 p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val) && val >= 0) {
                              onUpdate(item.id, val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                        title="Aktualizuj wartość"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const val = parseFloat(input.value);
                          if (!isNaN(val) && val >= 0) {
                            onUpdate(item.id, val);
                            input.value = '';
                          }
                        }}
                      >
                        <RefreshCw size={14} />
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