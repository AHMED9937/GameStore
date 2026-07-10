#!/usr/bin/env tsx
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const example = resolve(root, '.env.staging.example');
const target = resolve(root, '.env.staging');

if (!existsSync(example)) {
  console.error('Missing .env.staging.example');
  process.exit(1);
}

if (existsSync(target)) {
  console.log('.env.staging already exists — not overwritten.');
  console.log('Edit it with your Neon staging DATABASE_URL and DIRECT_URL.');
  process.exit(0);
}

copyFileSync(example, target);
console.log('Created .env.staging from .env.staging.example');
console.log('');
console.log('Next steps:');
console.log('  1. Open .env.staging');
console.log('  2. Paste Neon STAGING branch: DATABASE_URL (pooled) + DIRECT_URL (direct)');
console.log('  3. Leave your local .env unchanged');
console.log('  4. Run: pnpm deploy:verify-env -- --file .env.staging');
