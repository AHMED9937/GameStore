import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SteamConfig } from './steam.config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const PREFIX = 'v1';

@Injectable()
export class SteamCryptoService {
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
      throw new Error('Invalid encrypted credential format');
    }

    const [, ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const data = Buffer.from(dataB64, 'base64url');

    const decipher = createDecipheriv(ALGORITHM, this.getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8',
    );
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
      if (process.env.NODE_ENV === 'production') {
        throw new Error('STEAM_ENCRYPTION_KEY is missing or invalid');
      }
      throw new ServiceUnavailableException(
        'STEAM encryption is not configured',
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
