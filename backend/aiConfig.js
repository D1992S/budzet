const OPENAI_MODEL = process?.env?.OPENAI_MODEL || 'gpt-4.1-mini';
const AI_MODEL_TEMPERATURE = Number(process?.env?.AI_MODEL_TEMPERATURE || 0.4);
const AI_MODEL_MAX_TOKENS = Number(process?.env?.AI_MODEL_MAX_TOKENS || 700);
const AI_MODEL_TIMEOUT_MS = Number(process?.env?.AI_MODEL_TIMEOUT_MS || 12_000);
const PROMPT_VERSION = process?.env?.PROMPT_VERSION || '2026-02-10.v1';

const SYSTEM_PROMPTS = {
  FINANCIAL_ADVISOR_PL:
    'Jesteś doświadczonym doradcą finansowym dla użytkowników w Polsce. Odpowiadaj po polsku, zwięźle i konkretnie, używając Markdown.',
  FINANCIAL_DOCUMENT_PARSER:
    'Wyodrębnij transakcje z dokumentu finansowego. Zwróć wyłącznie JSON zgodny ze schematem.',
};

const getAiDiagnosticContext = (scope) => ({
  scope,
  promptVersion: PROMPT_VERSION,
  model: OPENAI_MODEL,
  temperature: AI_MODEL_TEMPERATURE,
  maxTokens: AI_MODEL_MAX_TOKENS,
  timeoutMs: AI_MODEL_TIMEOUT_MS,
});

const validateAiModelConfig = () => {
  const issues = [];

  if (!Number.isFinite(AI_MODEL_TEMPERATURE) || AI_MODEL_TEMPERATURE < 0 || AI_MODEL_TEMPERATURE > 2) {
    issues.push('AI_MODEL_TEMPERATURE musi być liczbą z zakresu 0-2.');
  }

  if (!Number.isFinite(AI_MODEL_MAX_TOKENS) || AI_MODEL_MAX_TOKENS <= 0) {
    issues.push('AI_MODEL_MAX_TOKENS musi być dodatnią liczbą.');
  }

  if (!Number.isFinite(AI_MODEL_TIMEOUT_MS) || AI_MODEL_TIMEOUT_MS <= 0) {
    issues.push('AI_MODEL_TIMEOUT_MS musi być dodatnią liczbą.');
  }

  return issues;
};

export {
  OPENAI_MODEL,
  AI_MODEL_TEMPERATURE,
  AI_MODEL_MAX_TOKENS,
  AI_MODEL_TIMEOUT_MS,
  PROMPT_VERSION,
  SYSTEM_PROMPTS,
  getAiDiagnosticContext,
  validateAiModelConfig,
};
