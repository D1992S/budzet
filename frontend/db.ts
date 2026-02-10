import Dexie, { Table } from 'dexie';
import { Transaction, SavingsGoal, RecurringExpense, Debt, Investment } from './types';

export class GroszDoGroszaDB extends Dexie {
  transactions!: Table<Transaction>;
  goals!: Table<SavingsGoal>;
  recurringExpenses!: Table<RecurringExpense>;
  debts!: Table<Debt>;
  investments!: Table<Investment>;

  constructor() {
    super('GroszDoGroszaDB');
    
    // Define tables and indexes
    // Version 1: Initial schema
    this.version(1).stores({
      transactions: 'id, date, type, category',
      goals: 'id, name'
    });

    // Version 2: Add recurring expenses and debts
    this.version(2).stores({
      transactions: 'id, date, type, category',
      goals: 'id, name',
      recurringExpenses: 'id, name',
      debts: 'id, name'
    });

    // Version 3: Add investments
    this.version(3).stores({
      transactions: 'id, date, type, category',
      goals: 'id, name',
      recurringExpenses: 'id, name',
      debts: 'id, name',
      investments: 'id, name, type'
    });
  }
}

export const db = new GroszDoGroszaDB();