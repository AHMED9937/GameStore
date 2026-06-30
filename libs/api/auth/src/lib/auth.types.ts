export type UserRole = 'user' | 'admin';

export type AuthUser = {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
};

export type ProfileUpdateInput = {
  firstName: string;
  lastName: string;
};

const PROFILE_NAME_MAX_LENGTH = 100;

export function normalizeOptionalName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseProfileUpdateInput(input: unknown): ProfileUpdateInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid profile payload');
  }

  const record = input as Record<string, unknown>;
  const firstName = normalizeOptionalName(record['firstName']);
  const lastName = normalizeOptionalName(record['lastName']);

  if (!firstName) {
    throw new Error('First name is required');
  }
  if (!lastName) {
    throw new Error('Last name is required');
  }
  if (firstName.length > PROFILE_NAME_MAX_LENGTH) {
    throw new Error(`First name must be at most ${PROFILE_NAME_MAX_LENGTH} characters`);
  }
  if (lastName.length > PROFILE_NAME_MAX_LENGTH) {
    throw new Error(`Last name must be at most ${PROFILE_NAME_MAX_LENGTH} characters`);
  }

  return { firstName, lastName };
}

export function displayNameFromParts(parts: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  const segments = [parts.firstName, parts.lastName].filter(
    (value): value is string => Boolean(value?.trim()),
  );
  if (segments.length > 0) {
    return segments.join(' ');
  }
  return parts.email;
}

export function userProfileResponse(user: {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}) {
  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: displayNameFromParts(user),
    role: user.role,
  };
}

export function parseUserRole(metadata: unknown): UserRole {
  if (
    metadata &&
    typeof metadata === 'object' &&
    'role' in metadata &&
    (metadata as { role: unknown }).role === 'admin'
  ) {
    return 'admin';
  }
  return 'user';
}

export function primaryEmailFromClerkUser(data: {
  email_addresses?: Array<{ id: string; email_address: string }>;
  primary_email_address_id?: string | null;
}): string | null {
  const addresses = data.email_addresses ?? [];
  if (addresses.length === 0) {
    return null;
  }

  const primaryId = data.primary_email_address_id;
  if (primaryId) {
    const primary = addresses.find((entry) => entry.id === primaryId);
    if (primary?.email_address) {
      return primary.email_address;
    }
  }

  return addresses[0]?.email_address ?? null;
}
