#!/usr/bin/env tsx
/**
 * D3 exit smoke — hit staging Next web home, SEO routes, and BFF catalog.
 *
 * Usage:
 *   pnpm deploy:smoke-web -- --url https://your-app.vercel.app
 *   pnpm deploy:smoke-web -- --url https://your-app.vercel.app --print-clerk-webhook
 */
import {
  buildBffGamesUrl,
  buildClerkWebhookUrl,
  buildSiteUrl,
  CLERK_WEBHOOK_EVENTS,
} from './vercel-config';

function parseArgs(argv: string[]): {
  url: string | null;
  printClerkWebhook: boolean;
} {
  let url: string | null = null;
  let printClerkWebhook = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url' && argv[i + 1]) {
      url = argv[++i];
    } else if (arg === '--print-clerk-webhook') {
      printClerkWebhook = true;
    }
  }

  return { url, printClerkWebhook };
}

async function fetchOk(
  label: string,
  target: string,
  options?: { accept?: string },
): Promise<void> {
  const response = await fetch(target, {
    headers: { Accept: options?.accept ?? '*/*' },
    redirect: 'follow',
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
  const { url, printClerkWebhook } = parseArgs(process.argv.slice(2));

  if (!url) {
    console.error(
      '\nUsage: pnpm deploy:smoke-web -- --url https://<vercel-app>\n',
    );
    process.exit(1);
  }

  if (!/^https:\/\//i.test(url)) {
    console.error('\n✗ Site URL must be https:// (Vercel public URL)\n');
    process.exit(1);
  }

  const base = url.replace(/\/$/, '');
  console.log(`\nD3 smoke — web: ${base}\n`);

  try {
    await fetchOk('GET /', buildSiteUrl(base), { accept: 'text/html' });
    await fetchOk('GET /robots.txt', buildSiteUrl(base, '/robots.txt'), {
      accept: 'text/plain',
    });
    await fetchOk('GET /sitemap.xml', buildSiteUrl(base, '/sitemap.xml'), {
      accept: 'application/xml',
    });
    await fetchOk('GET /api/games (BFF)', buildBffGamesUrl(base), {
      accept: 'application/json',
    });
  } catch (error) {
    console.error(
      `\n✗ ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  }

  if (printClerkWebhook) {
    console.log('\nClerk webhook (D3):');
    console.log(`  URL: ${buildClerkWebhookUrl(base)}`);
    console.log(`  Events: ${CLERK_WEBHOOK_EVENTS.join(', ')}`);
    console.log(
      '  Copy signing secret → Vercel CLERK_WEBHOOK_SECRET (or CLERK_WEBHOOK_SIGNING_SECRET)',
    );
    console.log(
      `  Then set Railway CORS_ORIGINS=${base} (exact origin, no trailing slash)\n`,
    );
  }

  console.log(
    '\nD3 smoke passed. Next: Clerk webhook + Railway CORS, then continue for D4.\n',
  );
  process.exit(0);
}

main();
