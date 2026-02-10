import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const cwd = process.cwd();
const localEnvPath = path.resolve(cwd, '.env.local');
const defaultEnvPath = path.resolve(cwd, '.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
} else {
  dotenv.config();
}
