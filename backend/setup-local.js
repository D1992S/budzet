import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const targetPath = path.resolve(cwd, '.env.local');
const examplePath = path.resolve(cwd, '.env.local.example');

if (fs.existsSync(targetPath)) {
  console.log('ℹ️ Plik .env.local już istnieje — nic nie zmieniam.');
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  console.error('❌ Brak pliku .env.local.example.');
  process.exit(1);
}

fs.copyFileSync(examplePath, targetPath);
console.log('✅ Utworzono backend/.env.local na podstawie backend/.env.local.example');
console.log('➡️ Jeśli chcesz używać AI, wpisz OPENAI_API_KEY w backend/.env.local');
