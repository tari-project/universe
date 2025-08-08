import { spawn } from 'child_process';
import dotenv from 'dotenv';

const args = process.argv.slice(2);

const envName = process.env.TARI_NETWORK || 'esme';
console.log(`Loading environment file: ./src-tauri/env.${envName}`);

const result = dotenv.config({ path: `./src-tauri/env.${envName}` });

if (result.error) {
  console.warn(`Could not load ./src-tauri/env.${envName} file`);
  dotenv.config();
}

const child = spawn('cargo', ['tauri', ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code));
