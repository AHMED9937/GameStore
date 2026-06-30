import { verifyWebhook } from '@clerk/nextjs/webhooks';
import type { NextRequest } from 'next/server';
import { applyClerkWebhookEvent } from '@gamestore/api/auth/sync';
import { db } from '@gamestore/api/prisma/db';

export async function POST(req: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;

  try {
    event = await verifyWebhook(req, {
      signingSecret:
        process.env['CLERK_WEBHOOK_SIGNING_SECRET'] ??
        process.env['CLERK_WEBHOOK_SECRET'],
    });
  } catch (error) {
    console.error('Clerk webhook verification failed:', error);
    return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  try {
    const action = await applyClerkWebhookEvent(db, event.type, event.data);
    if (action !== 'ignored') {
      console.info(`Clerk webhook ${event.type} → Neon ${action}`);
    }
    return Response.json({ received: true, action, type: event.type });
  } catch (error) {
    console.error(`Clerk webhook sync failed (${event.type}):`, error);
    return Response.json({ error: 'Webhook sync failed' }, { status: 500 });
  }
}
