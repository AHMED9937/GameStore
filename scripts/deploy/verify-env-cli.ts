#!/usr/bin/env tsx
/**
 * D1 exit gate — validate staging secrets in a local .env file.
 *
 * Usage:
 *   pnpm deploy:verify-env
 *   pnpm deploy:verify-env -- --file .env.staging --target staging
 *
 * Never commit real .env files. Store staging vs production values in your password manager.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { D1_ENV_KEYS, keysForHost } from './env-keys';
import { parseEnvFile, verifyD1Env, type DeployTarget } from './verify-env';

function parseArgs(argv: string[]): {
  file: string;
  target: DeployTarget;
  compareLocalSteam: boolean;
  printMatrix: boolean;
} {
  let file = '.env';
  let target: DeployTarget = 'staging';
  let compareLocalSteam = true;
  let printMatrix = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--file' && argv[i + 1]) {
      file = argv[++i];
    } else if (arg === '--target' && argv[i + 1]) {
      target = argv[++i] === 'production' ? 'production' : 'staging';
    } else if (arg === '--no-local-steam-compare') {
      compareLocalSteam = false;
    } else if (arg === '--matrix') {
      printMatrix = true;
    }
  }

  return { file, target, compareLocalSteam, printMatrix };
}

function printHostMatrix(): void {
  console.log('\nEnv host matrix (DEPLOYMENT_PLAN.md §7):\n');
  console.log('  Vercel (web):  NEXT_PUBLIC_*, API_URL, Clerk, DATABASE_URL (if sync), Stripe publishable');
  console.log('  Railway (api): DATABASE_URL, DIRECT_URL, CORS_ORIGINS, Clerk secret, Stripe secret+webhook,');
  console.log('                 STEAM_*, IGDB_*, THROTTLE_*, NODE_ENV\n');

  const printGroup = (label: string, host: 'vercel' | 'railway' | 'both') => {
    const names = keysForHost(host).map((k) => k.name);
    console.log(`  ${label}: ${names.join(', ')}`);
  };

  printGroup('Vercel', 'vercel');
  printGroup('Railway', 'railway');
  printGroup('Both hosts', 'both');
  console.log('');
}

function loadLocalSteamKey(): string | undefined {
  const localPath = resolve('.env');
  if (!existsSync(localPath)) {
    return undefined;
  }
  return parseEnvFile(readFileSync(localPath, 'utf8')).STEAM_ENCRYPTION_KEY;
}

function main(): void {
  const { file, target, compareLocalSteam, printMatrix } = parseArgs(
    process.argv.slice(2),
  );

  if (printMatrix) {
    printHostMatrix();
    return;
  }

  const envPath = resolve(file);
  if (!existsSync(envPath)) {
    console.error(`\n✗ Env file not found: ${envPath}`);
    console.error('  Copy .env.example → .env (or .env.staging) and fill in D1 values.\n');
    process.exit(1);
  }

  const env = parseEnvFile(readFileSync(envPath, 'utf8'));
  const localSteamKey =
    compareLocalSteam && file !== '.env' ? loadLocalSteamKey() : undefined;

  console.log(`\nD1 verify — target: ${target}, file: ${envPath}\n`);

  const { checks, passed } = verifyD1Env(env, { target, localSteamKey });

  for (const check of checks) {
    const icon = check.ok ? '✓' : '✗';
    console.log(`  ${icon} ${check.message}`);
  }

  console.log('');
  if (passed) {
    console.log('D1 env checks passed. Next: Railway deploy (D2) after you say continue.\n');
    console.log('Manual checks still required:');
    console.log('  • psql "$DATABASE_URL" -c "select 1" (or Neon SQL editor)');
    console.log('  • Clerk staging admin user with public_metadata.role = "admin"');
    console.log('  • Stripe Dashboard still in Test mode\n');
    process.exit(0);
  }

  console.error('D1 env checks failed. Fix the items above before D2.\n');
  console.error('Required keys:', D1_ENV_KEYS.map((k) => k.name).join(', '));
  process.exit(1);
}

main();
