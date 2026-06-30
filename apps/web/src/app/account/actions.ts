'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { userProfileResponse } from '@gamestore/api/auth/sync';
import { deleteDbUser, updateUserProfile } from '../../lib/clerk-neon';

export type DeleteAccountResult =
  | { ok: true; neonDeleted: boolean }
  | { ok: false; error: string };

export type UpdateProfileResult =
  | { ok: true; user: ReturnType<typeof userProfileResponse> }
  | { ok: false; error: string };

/** Updates first/last name in Clerk, then mirrors to Neon. */
export async function updateProfileAction(input: {
  firstName: string;
  lastName: string;
}): Promise<UpdateProfileResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: 'You must be signed in to update your profile.' };
  }

  try {
    const user = await updateUserProfile(input);
    return { ok: true, user: userProfileResponse(user) };
  } catch (error) {
    console.error('updateProfileAction failed:', error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Profile update failed. Please try again.',
    };
  }
}

/** Deletes Neon mirror first, then the Clerk user (single server-side flow). */
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: 'You must be signed in to delete your account.' };
  }

  try {
    const { deleted } = await deleteDbUser();

    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return { ok: true, neonDeleted: deleted > 0 };
  } catch (error) {
    console.error('deleteAccountAction failed:', error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Account deletion failed. Please try again.',
    };
  }
}
