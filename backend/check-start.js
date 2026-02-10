import 'dotenv/config';
import { collectConfigurationIssues, formatConfigurationErrorMessage } from './configValidation.js';

const { issues } = collectConfigurationIssues();

if (issues.length > 0) {
  console.error('❌ Nie można uruchomić backendu. Wykryto błędy konfiguracji:');
  issues.forEach((issue, index) => {
    console.error(`${index + 1}. ${issue}`);
  });

  if (issues.some((issue) => issue.includes('OPENAI_API_KEY'))) {
    console.error('\nUstaw OPENAI_API_KEY w pliku backend/.env.local, np.: OPENAI_API_KEY=sk-...');
  }

  console.error(`\n${formatConfigurationErrorMessage(issues)}`);
  process.exit(1);
}

console.log('✅ Konfiguracja backendu jest poprawna.');
