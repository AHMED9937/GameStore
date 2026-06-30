import {
  deleteDbUser,
  getDbUserIfAuthenticated,
  updateUserProfile,
} from '../../../../lib/clerk-neon';
import { parseProfileUpdateInput, userProfileResponse } from '@gamestore/api/auth/sync';

/** Returns the current user's Neon row (JIT sync if needed). Requires Clerk session. */
export async function GET() {
  const user = await getDbUserIfAuthenticated();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json(userProfileResponse(user));
}

/** Update profile in Clerk and mirror to Neon. */
export async function PATCH(request: Request) {
  try {
    const body: unknown = await request.json();
    const profile = parseProfileUpdateInput(body);
    const user = await updateUserProfile(profile);
    return Response.json({ user: userProfileResponse(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    const status =
      message === 'Unauthorized'
        ? 401
        : message.startsWith('Invalid') ||
            message.includes('required') ||
            message.includes('must be at most')
          ? 400
          : 500;
    console.error('PATCH /api/users/me failed:', error);
    return Response.json({ error: message }, { status });
  }
}

/** Delete mirrored Neon user while Clerk session is still valid (self-service account deletion). */
export async function DELETE() {
  try {
    const { deleted } = await deleteDbUser();
    return Response.json({ deleted: deleted > 0, count: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('DELETE /api/users/me failed:', error);
    return Response.json({ error: message }, { status });
  }
}
