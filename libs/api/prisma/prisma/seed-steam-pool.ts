import { SteamCryptoService } from '@gamestore/api/steam';

const PLACEHOLDER_PASSWORD = 'ENCRYPTED_PLACEHOLDER';
const PLACEHOLDER_SECRET = 'SHARED_SECRET_PLACEHOLDER';

export type SeedPoolCredentials = {
  passwordEncrypted: string;
  sharedSecret: string;
  isEncrypted: boolean;
};

/**
 * When STEAM_ENCRYPTION_KEY plus SEED_STEAM_PASSWORD and SEED_STEAM_SHARED_SECRET
 * are set, returns AES-encrypted pool credentials for demo seed accounts.
 * Otherwise keeps legacy placeholders (activation will not work until admin pool create).
 */
export function resolveSeedPoolCredentials(): SeedPoolCredentials {
  const encryptionKey = process.env.STEAM_ENCRYPTION_KEY?.trim();
  const password = process.env.SEED_STEAM_PASSWORD?.trim();
  const sharedSecret = process.env.SEED_STEAM_SHARED_SECRET?.trim();

  if (!encryptionKey || !password || !sharedSecret) {
    return {
      passwordEncrypted: PLACEHOLDER_PASSWORD,
      sharedSecret: PLACEHOLDER_SECRET,
      isEncrypted: false,
    };
  }

  const crypto = new SteamCryptoService();
  return {
    passwordEncrypted: crypto.encrypt(password),
    sharedSecret: crypto.encrypt(sharedSecret),
    isEncrypted: true,
  };
}

export const SEED_POOL_DEFAULTS = {
  password: 'seed-demo-pool-password',
  sharedSecret: 'testsharedsecretfortotp123456',
} as const;
