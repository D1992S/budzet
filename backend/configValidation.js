import { validateAiModelConfig } from './aiConfig.js';

const DEFAULT_PAYLOAD_LIMIT = '12mb';

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

const collectConfigurationIssues = () => {
  const issues = [];
  const payloadLimit = process?.env?.API_PAYLOAD_MAX_SIZE || DEFAULT_PAYLOAD_LIMIT;
  const payloadLimitBytes = parseLimitToBytes(payloadLimit);
  const apiRateLimitMax = Number(process?.env?.API_RATE_LIMIT_MAX || 30);
  const apiRateLimitWindowMs = Number(process?.env?.API_RATE_LIMIT_WINDOW_MS || 60_000);

  if (!process?.env?.OPENAI_API_KEY) {
    issues.push('OPENAI_API_KEY nie został ustawiony.');
  }

  if (!payloadLimitBytes) {
    issues.push(`API_PAYLOAD_MAX_SIZE ma nieprawidłowy format (${payloadLimit}). Użyj np. 2mb lub 512kb.`);
  }

  if (!Number.isFinite(apiRateLimitMax) || apiRateLimitMax <= 0) {
    issues.push('API_RATE_LIMIT_MAX musi być dodatnią liczbą.');
  }

  if (!Number.isFinite(apiRateLimitWindowMs) || apiRateLimitWindowMs <= 0) {
    issues.push('API_RATE_LIMIT_WINDOW_MS musi być dodatnią liczbą.');
  }

  issues.push(...validateAiModelConfig());

  return {
    issues,
    payloadLimit,
    payloadLimitBytes,
  };
};

const formatConfigurationErrorMessage = (issues) => `Błąd konfiguracji backendu AI: ${issues.join(' ')}`;

export { DEFAULT_PAYLOAD_LIMIT, parseLimitToBytes, collectConfigurationIssues, formatConfigurationErrorMessage };
