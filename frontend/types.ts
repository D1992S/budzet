export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  dueDay: number; // Day of the month (1-31)
  category: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  minimumPayment?: number;
}

export interface Investment {
  id: string;
  name: string;
  type: 'crypto' | 'stock' | 'real_estate' | 'bond' | 'other';
  amountInvested: number; // Initial cost basis
  currentValue: number; // Current market value
  date: string; // Date of purchase or entry
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalRecurringMonthly: number;
  totalDebt: number;
  investmentValue: number;
  investmentProfit: number;
}

export const CATEGORIES = [
  'Jedzenie',
  'Mieszkanie',
  'Transport',
  'Rozrywka',
  'Zdrowie',
  'Edukacja',
  'Zakupy',
  'Inne',
  'Wypłata',
  'Prezent',
  'Rachunki',
  'Abonamenty',
  'Spłata Długu',
  'Inwestycje'
];