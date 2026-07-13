import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SteamConfig } from './steam.config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const PREFIX = 'v1';

const DECRYPT_MISMATCH_MESSAGE =
  'Unable to decrypt Steam credentials. STEAM_ENCRYPTION_KEY on this server must match the key used when accounts were saved.';

@Injectable()
export class SteamCryptoService {
  private readonly logger = new Logger(SteamCryptoService.name);
  private key: Buffer | null = null;

  encrypt(plain: string): string {
    const key = this.getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
      PREFIX,
      iv.toString('base64url'),
      tag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  decrypt(cipherText: string): string {
    const parts = cipherText.split(':');
    if (parts.length !== 4 || parts[0] !== PREFIX) {
      throw new UnprocessableEntityException(
        'Invalid encrypted Steam credential format. Re-save the account password/shared secret in admin.',
      );
    }

    try {
      const [, ivB64, tagB64, dataB64] = parts;
      const iv = Buffer.from(ivB64, 'base64url');
      const tag = Buffer.from(tagB64, 'base64url');
      const data = Buffer.from(dataB64, 'base64url');

      const decipher = createDecipheriv(ALGORITHM, this.getKey(), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString(
        'utf8',
      );
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof UnprocessableEntityException
      ) {
        throw error;
      }
      this.logger.warn(
        `Steam credential decrypt failed (${error instanceof Error ? error.name : 'unknown'}). Check STEAM_ENCRYPTION_KEY stability.`,
      );
      throw new UnprocessableEntityException(DECRYPT_MISMATCH_MESSAGE);
    }
  }

  isEncrypted(value: string): boolean {
    return value.startsWith(`${PREFIX}:`);
  }

  isConfigured(): boolean {
    const { encryptionKey } = SteamConfig.readEnv();
    return SteamConfig.validateEncryptionKey(encryptionKey) === 'valid';
  }

  private getKey(): Buffer {
    if (this.key) {
      return this.key;
    }

    const { encryptionKey } = SteamConfig.readEnv();
    const status = SteamConfig.validateEncryptionKey(encryptionKey);
    if (status !== 'valid') {
      throw new ServiceUnavailableException(
        'STEAM_ENCRYPTION_KEY is missing or invalid. Set a stable 64-char hex key on Railway (must match the key used when accounts were encrypted).',
      );
    }

    this.key = this.deriveKey(encryptionKey);
    return this.key;
  }

  private deriveKey(raw: string): Buffer {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Buffer.from(raw, 'hex');
    }
    return createHash('sha256').update(raw, 'utf8').digest();
  }
}
