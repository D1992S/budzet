import { Transaction, SavingsGoal } from '../types';

interface AdviceRequestPayload {
  transactions: Array<{
    date: string;
    amount: number;
    type: Transaction['type'];
    category: string;
    description: string;
  }>;
  goals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
  }>;
  userQuery: string;
}

interface AdviceResponsePayload {
  advice: string;
}

interface ParseDocumentResponsePayload {
  transactions: Omit<Transaction, 'id'>[];
}

const handleErrorResponse = async (response: Response, fallbackMessage: string): Promise<never> => {
  let errorMessage = fallbackMessage;

  try {
    const data = await response.json();
    if (data?.error) {
      errorMessage = data.error;
    }
  } catch {
    // ignore JSON parse error and keep fallback message
  }

  throw new Error(errorMessage);
};

export const getFinancialAdvice = async (
  transactions: Transaction[],
  goals: SavingsGoal[],
  userQuery: string
): Promise<string> => {
  const payload: AdviceRequestPayload = {
    transactions: transactions.map((t) => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
    })),
    goals: goals.map((g) => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
    })),
    userQuery,
  };

  const response = await fetch('/api/ai/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Wystąpił błąd podczas pobierania porady AI.');
  }

  const data = (await response.json()) as AdviceResponsePayload;
  return data.advice ?? 'Przepraszam, nie udało mi się wygenerować porady w tej chwili.';
};

export const parseFinancialDocument = async (
  fileBase64: string,
  mimeType: string
): Promise<Omit<Transaction, 'id'>[]> => {
  const response = await fetch('/api/ai/parse-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64, mimeType }),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Nie udało się przeanalizować dokumentu.');
  }

  const data = (await response.json()) as ParseDocumentResponsePayload;
  return data.transactions ?? [];
};
