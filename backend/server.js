import 'dotenv/config';
import express from 'express';
import {
  OPENAI_MODEL,
  AI_MODEL_TEMPERATURE,
  AI_MODEL_MAX_TOKENS,
  AI_MODEL_TIMEOUT_MS,
  PROMPT_VERSION,
  SYSTEM_PROMPTS,
  getAiDiagnosticContext,
  validateAiModelConfig,
} from './aiConfig.js';

const app = express();

const DEFAULT_PAYLOAD_LIMIT = '12mb';
const API_PAYLOAD_MAX_SIZE = process?.env?.API_PAYLOAD_MAX_SIZE || DEFAULT_PAYLOAD_LIMIT;
const PORT = process?.env?.API_BACKEND_PORT || 5000;
const API_BACKEND_HOST = process?.env?.API_BACKEND_HOST || '127.0.0.1';
const OPENAI_API_KEY = process?.env?.OPENAI_API_KEY;
const AI_RATE_LIMIT_MAX = Number(process?.env?.API_RATE_LIMIT_MAX || 30);
const AI_RATE_LIMIT_WINDOW_MS = Number(process?.env?.API_RATE_LIMIT_WINDOW_MS || 60_000);
const AI_CORS_ALLOWLIST = (process?.env?.API_CORS_ALLOWLIST || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const parseLimitToBytes = (limitValue) => {
  if (typeof limitValue !== 'string') {
    return null;
  }

  const normalized = limitValue.trim().toLowerCase();
  const match = normalized.match(/^(\d+)(b|kb|mb)?$/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = match[2] || 'b';
  const multipliers = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
  };

  return value * multipliers[unit];
};

const MAX_PAYLOAD_BYTES = parseLimitToBytes(API_PAYLOAD_MAX_SIZE);

const validateConfiguration = () => {
  const issues = [];

  if (!OPENAI_API_KEY) {
    issues.push('OPENAI_API_KEY nie został ustawiony.');
  }

  if (!MAX_PAYLOAD_BYTES) {
    issues.push(`API_PAYLOAD_MAX_SIZE ma nieprawidłowy format (${API_PAYLOAD_MAX_SIZE}). Użyj np. 2mb lub 512kb.`);
  }

  if (!Number.isFinite(AI_RATE_LIMIT_MAX) || AI_RATE_LIMIT_MAX <= 0) {
    issues.push('API_RATE_LIMIT_MAX musi być dodatnią liczbą.');
  }

  if (!Number.isFinite(AI_RATE_LIMIT_WINDOW_MS) || AI_RATE_LIMIT_WINDOW_MS <= 0) {
    issues.push('API_RATE_LIMIT_WINDOW_MS musi być dodatnią liczbą.');
  }

  issues.push(...validateAiModelConfig());

  return issues;
};

const configurationIssues = validateConfiguration();

const getConfigurationErrorMessage = () =>
  `Błąd konfiguracji backendu AI: ${configurationIssues.join(' ')}`;

app.use(express.json({ limit: API_PAYLOAD_MAX_SIZE }));

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

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

const rateLimitStore = new Map();

const getOpenAiHeaders = () => ({
  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
      content: SYSTEM_PROMPTS.FINANCIAL_ADVISOR_PL,
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
    content: SYSTEM_PROMPTS.FINANCIAL_DOCUMENT_PARSER,
  },
  {
    role: 'user',
    content: `Przeanalizuj dokument finansowy. Kategorie dozwolone: ${CATEGORIES.join(', ')}.\n\nMime type: ${mimeType}\nBase64: ${fileBase64}`,
  },
];

const mapAdviceRequestToOpenAi = (requestBody) => ({
  model: OPENAI_MODEL,
  temperature: AI_MODEL_TEMPERATURE,
  max_tokens: AI_MODEL_MAX_TOKENS,
  messages: buildAdviceMessages(requestBody),
});

const mapDocumentRequestToOpenAi = (requestBody) => ({
  model: OPENAI_MODEL,
  temperature: AI_MODEL_TEMPERATURE,
  max_tokens: AI_MODEL_MAX_TOKENS,
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_MODEL_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: getOpenAiHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const apiError = data?.error?.message || 'OpenAI API request failed.';
      throw new Error(apiError);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
};

const validateConfigurationOrFail = (_req, res, next) => {
  if (configurationIssues.length > 0) {
    return res.status(500).json({ error: getConfigurationErrorMessage() });
  }

  next();
};

const applyAiCors = (req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (!requestOrigin) {
    return next();
  }

  if (!AI_CORS_ALLOWLIST.includes(requestOrigin)) {
    return res.status(403).json({
      error: `Origin ${requestOrigin} nie jest dozwolony dla endpointów AI.`,
    });
  }

  res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

const applyAiRateLimit = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= AI_RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Przekroczono limit żądań do endpointów AI. Spróbuj ponownie za chwilę.',
    });
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return next();
};

const validatePayloadSize = (req, res, next) => {
  if (!MAX_PAYLOAD_BYTES) {
    return next();
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({
      error: `Payload jest zbyt duży. Maksymalny rozmiar to ${API_PAYLOAD_MAX_SIZE}.`,
    });
  }

  next();
};

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const validateAdvicePayload = (req, res, next) => {
  const body = req.body;

  if (!isObject(body)) {
    return res.status(400).json({ error: 'Body musi być obiektem JSON.' });
  }

  const { transactions, goals, userQuery } = body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'Pole "transactions" musi być niepustą tablicą.' });
  }

  if (!Array.isArray(goals)) {
    return res.status(400).json({ error: 'Pole "goals" musi być tablicą.' });
  }

  if (typeof userQuery !== 'string' || !userQuery.trim()) {
    return res.status(400).json({ error: 'Pole "userQuery" musi być niepustym stringiem.' });
  }

  for (const [index, transaction] of transactions.entries()) {
    if (!isObject(transaction)) {
      return res.status(400).json({ error: `Transakcja #${index + 1} musi być obiektem.` });
    }

    const { date, amount, type, category, description } = transaction;

    if (typeof date !== 'string' || !date.trim()) {
      return res.status(400).json({ error: `Transakcja #${index + 1}: pole "date" musi być stringiem.` });
    }

    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return res.status(400).json({ error: `Transakcja #${index + 1}: pole "amount" musi być liczbą.` });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: `Transakcja #${index + 1}: pole "type" musi mieć wartość "income" lub "expense".` });
    }

    if (typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: `Transakcja #${index + 1}: pole "category" musi być stringiem.` });
    }

    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: `Transakcja #${index + 1}: pole "description" musi być stringiem.` });
    }
  }

  for (const [index, goal] of goals.entries()) {
    if (!isObject(goal)) {
      return res.status(400).json({ error: `Cel #${index + 1} musi być obiektem.` });
    }

    const { name, targetAmount, currentAmount } = goal;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: `Cel #${index + 1}: pole "name" musi być stringiem.` });
    }

    if (typeof targetAmount !== 'number' || Number.isNaN(targetAmount)) {
      return res.status(400).json({ error: `Cel #${index + 1}: pole "targetAmount" musi być liczbą.` });
    }

    if (typeof currentAmount !== 'number' || Number.isNaN(currentAmount)) {
      return res.status(400).json({ error: `Cel #${index + 1}: pole "currentAmount" musi być liczbą.` });
    }
  }

  next();
};

const validateParseDocumentPayload = (req, res, next) => {
  const body = req.body;

  if (!isObject(body)) {
    return res.status(400).json({ error: 'Body musi być obiektem JSON.' });
  }

  const { fileBase64, mimeType } = body;

  if (typeof fileBase64 !== 'string' || !fileBase64.trim()) {
    return res.status(400).json({ error: 'Pole "fileBase64" musi być niepustym stringiem.' });
  }

  if (typeof mimeType !== 'string' || !allowedMimeTypes.includes(mimeType)) {
    return res.status(400).json({
      error: `Pole "mimeType" musi należeć do listy: ${allowedMimeTypes.join(', ')}.`,
    });
  }

  next();
};

const aiRouter = express.Router();
aiRouter.use(applyAiCors, validateConfigurationOrFail, validatePayloadSize, applyAiRateLimit);
aiRouter.options('/advice', (_req, res) => res.sendStatus(204));
aiRouter.options('/parse-document', (_req, res) => res.sendStatus(204));

aiRouter.post('/advice', validateAdvicePayload, async (req, res) => {
  const { transactions, goals, userQuery } = req.body;
  const fallbackAdvice =
    'Chwilowo nie mogę przygotować spersonalizowanej porady. Sprawdź swoje 3 największe wydatki z ostatnich 30 dni i zacznij od ograniczenia jednego z nich o 10%.';

  try {
    const openAiPayload = mapAdviceRequestToOpenAi({ transactions, goals, userQuery });
    const completion = await callOpenAiChatCompletions(openAiPayload);
    const advice = parseOpenAiMessageContent(completion);

    if (!advice) {
      return res.status(502).json({ error: 'OpenAI nie zwróciło treści porady.' });
    }

    return res.json({ advice });
  } catch (error) {
    console.error('[AI Advice] Error:', {
      ...getAiDiagnosticContext('advice'),
      message: error?.message,
      name: error?.name,
    });

    return res.status(200).json({
      advice: fallbackAdvice,
      warning:
        'Wystąpił chwilowy problem z usługą AI. Pokazujemy bezpieczną podpowiedź zastępczą.',
    });
  }
});

aiRouter.post('/parse-document', validateParseDocumentPayload, async (req, res) => {
  const { fileBase64, mimeType } = req.body;

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
    console.error('[AI Parse Document] Error:', {
      ...getAiDiagnosticContext('parse-document'),
      promptVersion: PROMPT_VERSION,
      message: error?.message,
      name: error?.name,
    });

    return res.status(503).json({
      error:
        'Nie udało się teraz odczytać dokumentu. Spróbuj ponownie za chwilę albo dodaj transakcje ręcznie.',
    });
  }
});

app.use('/api/ai', aiRouter);

app.listen(PORT, API_BACKEND_HOST, () => {
  if (configurationIssues.length > 0) {
    console.error(getConfigurationErrorMessage());
  }

  console.log(`AI Backend listening at http://${API_BACKEND_HOST}:${PORT}`);
});
