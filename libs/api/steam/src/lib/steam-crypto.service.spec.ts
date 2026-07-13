import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SteamCryptoService } from './steam-crypto.service';

const TEST_KEY = 'a'.repeat(64);
const OTHER_KEY = 'b'.repeat(64);

describe('SteamCryptoService', () => {
  beforeEach(() => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('round-trips plaintext credentials', () => {
    const service = new SteamCryptoService();
    const plain = 'kURvSA8Qb8d6tZR3';
    const encrypted = service.encrypt(plain);

    expect(encrypted).toMatch(/^v1:/);
    expect(service.decrypt(encrypted)).toBe(plain);
  });

  it('produces distinct ciphertext for the same plaintext', () => {
    const service = new SteamCryptoService();
    const a = service.encrypt('same-password');
    const b = service.encrypt('same-password');
    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe('same-password');
    expect(service.decrypt(b)).toBe('same-password');
  });

  it('detects encrypted values', () => {
    const service = new SteamCryptoService();
    const encrypted = service.encrypt('secret');
    expect(service.isEncrypted(encrypted)).toBe(true);
    expect(service.isEncrypted('ENCRYPTED_PLACEHOLDER')).toBe(false);
  });

  it('throws UnprocessableEntityException when encryption key cannot decrypt', () => {
    const encrypter = new SteamCryptoService();
    const cipher = encrypter.encrypt('secret-password');

    vi.stubEnv('STEAM_ENCRYPTION_KEY', OTHER_KEY);
    const decrypter = new SteamCryptoService();

    expect(() => decrypter.decrypt(cipher)).toThrow(UnprocessableEntityException);
    expect(() => decrypter.decrypt(cipher)).toThrow(/STEAM_ENCRYPTION_KEY/);
  });

  it('throws UnprocessableEntityException for invalid ciphertext format', () => {
    const service = new SteamCryptoService();
    expect(() => service.decrypt('not-valid')).toThrow(UnprocessableEntityException);
  });

  it('throws ServiceUnavailableException when key is missing', () => {
    vi.stubEnv('STEAM_ENCRYPTION_KEY', '');
    const service = new SteamCryptoService();
    expect(() => service.encrypt('x')).toThrow(ServiceUnavailableException);
  });
});
