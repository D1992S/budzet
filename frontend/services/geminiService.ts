import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Transaction, SavingsGoal, CATEGORIES } from '../types';

const apiKey = process.env.API_KEY;
// Initialize only if key exists to prevent crash on load, though usage will fail gracefully
const ai = apiKey ? new GoogleGenAI({ apiKey, vertexai: true }) : null;

export const getFinancialAdvice = async (
  transactions: Transaction[],
  goals: SavingsGoal[],
  userQuery: string
): Promise<string> => {
  if (!ai) {
    return "Klucz API nie został skonfigurowany. Upewnij się, że zmienna środowiskowa API_KEY jest ustawiona.";
  }

  // Prepare context data
  const recentTransactions = transactions.slice(0, 20);
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const context = `
    Jesteś doświadczonym doradcą finansowym. Twoim celem jest pomoc użytkownikowi w zarządzaniu budżetem domowym w Polsce.
    
    Dane finansowe użytkownika:
    - Całkowity przychód (z historii): ${totalIncome.toFixed(2)} PLN
    - Całkowite wydatki (z historii): ${totalExpense.toFixed(2)} PLN
    - Bilans: ${(totalIncome - totalExpense).toFixed(2)} PLN
    - Cele oszczędnościowe: ${JSON.stringify(goals.map(g => ({ name: g.name, progress: `${g.currentAmount}/${g.targetAmount}` })))}
    - Ostatnie transakcje: ${JSON.stringify(recentTransactions.map(t => ({ date: t.date, type: t.type, category: t.category, amount: t.amount, desc: t.description })))}
    
    Pytanie użytkownika: "${userQuery}"
    
    Odpowiedz krótko, konkretnie i w przyjaznym tonie. Używaj formatowania Markdown (pogrubienia, listy).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{ text: context }]
      }
    });

    return response.text || "Przepraszam, nie udało mi się wygenerować porady w tej chwili.";
  } catch (error) {
    console.error("Błąd Gemini:", error);
    return "Wystąpił błąd podczas łączenia z asystentem AI. Spróbuj ponownie później.";
  }
};

export const parseFinancialDocument = async (fileBase64: string, mimeType: string): Promise<Omit<Transaction, 'id'>[]> => {
  if (!ai) {
    throw new Error("Klucz API nie został skonfigurowany.");
  }

  const prompt = `
    Przeanalizuj ten dokument finansowy (paragon, faktura, wyciąg bankowy).
    Wyodrębnij wszystkie transakcje.
    Dla każdej transakcji określ:
    - date (YYYY-MM-DD) - jeśli brak roku, przyjmij obecny rok.
    - amount (number) - kwota w PLN.
    - type ('income' lub 'expense') - przychód lub wydatek.
    - category - wybierz najbardziej pasującą z listy: ${CATEGORIES.join(', ')}.
    - description - krótki opis (np. nazwa sklepu lub usługi).
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ['income', 'expense'] },
        category: { type: Type.STRING, enum: CATEGORIES },
        description: { type: Type.STRING }
      },
      required: ['date', 'amount', 'type', 'category', 'description']
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: fileBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Błąd analizy dokumentu:", error);
    throw new Error("Nie udało się przeanalizować dokumentu.");
  }
};