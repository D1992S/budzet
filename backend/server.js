import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json({ limit: process?.env?.API_PAYLOAD_MAX_SIZE || '12mb' }));

const PORT = process?.env?.API_BACKEND_PORT || 5000;
const API_BACKEND_HOST = process?.env?.API_BACKEND_HOST || '127.0.0.1';
const OPENAI_API_KEY = process?.env?.OPENAI_API_KEY;
const OPENAI_MODEL = process?.env?.OPENAI_MODEL || 'gpt-4.1-mini';

const CATEGORIES = [
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
  'Inwestycje',
];

const getOpenAiHeaders = () => ({
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  'Content-Type': 'application/json',
});

const parseOpenAiMessageContent = (completionData) =>
  completionData?.choices?.[0]?.message?.content ?? null;

const extractJsonFromContent = (content) => {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeFenceMatch?.[1]) {
      return JSON.parse(codeFenceMatch[1]);
    }
    throw new Error('Model response is not valid JSON.');
  }
};

const buildAdviceMessages = ({ transactions, goals, userQuery }) => {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return [
    {
      role: 'system',
      content:
        'Jesteś doświadczonym doradcą finansowym dla użytkowników w Polsce. Odpowiadaj po polsku, zwięźle i konkretnie, używając Markdown.',
    },
    {
      role: 'user',
      content: JSON.stringify(
        {
          summary: {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
          },
          goals,
          recentTransactions: transactions.slice(0, 20),
          userQuery,
        },
        null,
        2
      ),
    },
  ];
};

const buildDocumentParsingMessages = ({ fileBase64, mimeType }) => [
  {
    role: 'system',
    content:
      'Wyodrębnij transakcje z dokumentu finansowego. Zwróć wyłącznie JSON zgodny ze schematem.',
  },
  {
    role: 'user',
    content: `Przeanalizuj dokument finansowy. Kategorie dozwolone: ${CATEGORIES.join(', ')}.\n\nMime type: ${mimeType}\nBase64: ${fileBase64}`,
  },
];

const mapAdviceRequestToOpenAi = (requestBody) => ({
  model: OPENAI_MODEL,
  temperature: 0.4,
  messages: buildAdviceMessages(requestBody),
});

const mapDocumentRequestToOpenAi = (requestBody) => ({
  model: OPENAI_MODEL,
  temperature: 0,
  messages: buildDocumentParsingMessages(requestBody),
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'financial_document_transactions',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          transactions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                date: { type: 'string' },
                amount: { type: 'number' },
                type: { type: 'string', enum: ['income', 'expense'] },
                category: { type: 'string', enum: CATEGORIES },
                description: { type: 'string' },
              },
              required: ['date', 'amount', 'type', 'category', 'description'],
            },
          },
        },
        required: ['transactions'],
      },
      strict: true,
    },
  },
});

const callOpenAiChatCompletions = async (payload) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: getOpenAiHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const apiError = data?.error?.message || 'OpenAI API request failed.';
    throw new Error(apiError);
  }

  return data;
};

app.post('/api/ai/advice', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Brak konfiguracji OPENAI_API_KEY na backendzie.' });
  }

  const { transactions, goals, userQuery } = req.body ?? {};
  if (!Array.isArray(transactions) || !Array.isArray(goals) || typeof userQuery !== 'string') {
    return res.status(400).json({ error: 'Nieprawidłowy format danych wejściowych.' });
  }

  try {
    const openAiPayload = mapAdviceRequestToOpenAi({ transactions, goals, userQuery });
    const completion = await callOpenAiChatCompletions(openAiPayload);
    const advice = parseOpenAiMessageContent(completion);

    if (!advice) {
      return res.status(502).json({ error: 'OpenAI nie zwróciło treści porady.' });
    }

    return res.json({ advice });
  } catch (error) {
    console.error('[AI Advice] Error:', error);
    return res.status(500).json({ error: error.message || 'Nie udało się pobrać porady AI.' });
  }
});

app.post('/api/ai/parse-document', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Brak konfiguracji OPENAI_API_KEY na backendzie.' });
  }

  const { fileBase64, mimeType } = req.body ?? {};
  if (typeof fileBase64 !== 'string' || typeof mimeType !== 'string') {
    return res.status(400).json({ error: 'Nieprawidłowy format danych wejściowych.' });
  }

  try {
    const openAiPayload = mapDocumentRequestToOpenAi({ fileBase64, mimeType });
    const completion = await callOpenAiChatCompletions(openAiPayload);
    const content = parseOpenAiMessageContent(completion);
    const parsed = extractJsonFromContent(content);

    if (!parsed || !Array.isArray(parsed.transactions)) {
      return res.status(502).json({ error: 'OpenAI zwróciło nieprawidłowy format odpowiedzi.' });
    }

    return res.json({ transactions: parsed.transactions });
  } catch (error) {
    console.error('[AI Parse Document] Error:', error);
    return res.status(500).json({ error: error.message || 'Nie udało się przeanalizować dokumentu.' });
  }
});

app.listen(PORT, API_BACKEND_HOST, () => {
  console.log(`AI Backend listening at http://${API_BACKEND_HOST}:${PORT}`);
});
