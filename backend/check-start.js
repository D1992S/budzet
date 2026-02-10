import './loadEnv.js';
import { collectConfigurationIssues, formatConfigurationErrorMessage } from './configValidation.js';

const { issues } = collectConfigurationIssues();

const isOptionalAiIssue = (issue) => issue.includes('OPENAI_API_KEY') || issue.startsWith('AI_MODEL_');
const blockingIssues = issues.filter((issue) => !isOptionalAiIssue(issue));

if (blockingIssues.length > 0) {
  console.error('❌ Nie można uruchomić backendu. Wykryto błędy konfiguracji:');
  blockingIssues.forEach((issue, index) => {
    console.error(`${index + 1}. ${issue}`);
  });
  console.error(`\n${formatConfigurationErrorMessage(blockingIssues)}`);
  process.exit(1);
}

if (issues.some((issue) => issue.includes('OPENAI_API_KEY'))) {
  console.warn('⚠️ OPENAI_API_KEY nie jest ustawiony — aplikacja uruchomi się, ale funkcje AI będą niedostępne.');
}

console.log('✅ Konfiguracja backendu pozwala na uruchomienie.');
