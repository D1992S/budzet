import Dexie, { Table } from 'dexie';
import { Transaction, SavingsGoal, RecurringExpense, Debt, Investment } from './types';

export interface IndexedDbBackup {
  version: 1;
  exportedAt: string;
  data: {
    transactions: Transaction[];
    goals: SavingsGoal[];
    recurringExpenses: RecurringExpense[];
    debts: Debt[];
    investments: Investment[];
  };
}

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

export const exportIndexedDbBackup = async (): Promise<IndexedDbBackup> => {
  const [transactions, goals, recurringExpenses, debts, investments] = await Promise.all([
    db.transactions.toArray(),
    db.goals.toArray(),
    db.recurringExpenses.toArray(),
    db.debts.toArray(),
    db.investments.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      transactions,
      goals,
      recurringExpenses,
      debts,
      investments,
    },
  };
};

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

const isBackupShape = (value: unknown): value is IndexedDbBackup => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const backup = value as Partial<IndexedDbBackup>;
  const data = backup.data as IndexedDbBackup['data'] | undefined;

  return (
    backup.version === 1 &&
    typeof backup.exportedAt === 'string' &&
    Boolean(data) &&
    isArray(data.transactions) &&
    isArray(data.goals) &&
    isArray(data.recurringExpenses) &&
    isArray(data.debts) &&
    isArray(data.investments)
  );
};

export const importIndexedDbBackup = async (backupCandidate: unknown): Promise<void> => {
  if (!isBackupShape(backupCandidate)) {
    throw new Error('Nieprawidłowy format backupu JSON.');
  }

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));

    const { data } = backupCandidate;

    if (data.transactions.length > 0) {
      await db.transactions.bulkAdd(data.transactions);
    }

    if (data.goals.length > 0) {
      await db.goals.bulkAdd(data.goals);
    }

    if (data.recurringExpenses.length > 0) {
      await db.recurringExpenses.bulkAdd(data.recurringExpenses);
    }

    if (data.debts.length > 0) {
      await db.debts.bulkAdd(data.debts);
    }

    if (data.investments.length > 0) {
      await db.investments.bulkAdd(data.investments);
    }
  });
};
