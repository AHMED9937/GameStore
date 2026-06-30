import { ensureDbUser } from '../../../../lib/clerk-neon';
import { userProfileResponse } from '@gamestore/api/auth/sync';

/** JIT upsert after login (fallback when Clerk webhooks are not reachable). */
export async function POST() {
  try {
    const user = await ensureDbUser();
    return Response.json({
      synced: true,
      user: userProfileResponse(user),
    });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
