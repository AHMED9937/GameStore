#!/usr/bin/env tsx
/**
 * D2 exit smoke — hit staging Nest API health + catalog.
 *
 * Usage:
 *   pnpm deploy:smoke-api -- --url https://your-api.up.railway.app
 *   pnpm deploy:smoke-api -- --url https://your-api.up.railway.app --print-webhook
 */
import {
  buildGamesUrl,
  buildHealthUrl,
  buildStripeWebhookUrl,
  STRIPE_WEBHOOK_EVENTS,
} from './railway-config';

function parseArgs(argv: string[]): { url: string | null; printWebhook: boolean } {
  let url: string | null = null;
  let printWebhook = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url' && argv[i + 1]) {
      url = argv[++i];
    } else if (arg === '--print-webhook') {
      printWebhook = true;
    }
  }

  return { url, printWebhook };
}

async function fetchOk(label: string, target: string): Promise<void> {
  const response = await fetch(target, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${label}: HTTP ${response.status} for ${target}`);
  }
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`${label}: empty body from ${target}`);
  }
  console.log(`  ✓ ${label} (${response.status})`);
}

async function main(): Promise<void> {
  const { url, printWebhook } = parseArgs(process.argv.slice(2));

  if (!url) {
    console.error('\nUsage: pnpm deploy:smoke-api -- --url https://<railway-api-host>\n');
    process.exit(1);
  }

  if (!/^https:\/\//i.test(url)) {
    console.error('\n✗ API URL must be https:// (Railway public URL)\n');
    process.exit(1);
  }

  console.log(`\nD2 smoke — API: ${url.replace(/\/$/, '')}\n`);

  try {
    await fetchOk('GET /api/health/db', buildHealthUrl(url));
    await fetchOk('GET /api/games', buildGamesUrl(url));
  } catch (error) {
    console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  if (printWebhook) {
    console.log('\nStripe Test webhook (D2):');
    console.log(`  URL: ${buildStripeWebhookUrl(url)}`);
    console.log(`  Events: ${STRIPE_WEBHOOK_EVENTS.join(', ')}`);
    console.log('  Copy signing secret → Railway STRIPE_WEBHOOK_SECRET\n');
  }

  console.log('\nD2 smoke passed. Next: Stripe Test webhook + CORS finalize in D3.\n');
  process.exit(0);
}

main();
