export type SteamEnvFieldStatus = 'missing' | 'invalid' | 'valid';

export type SteamEnvStatus = {
  encryptionKey: SteamEnvFieldStatus;
  guardCooldownMinutes: SteamEnvFieldStatus;
};

export class SteamConfig {
  static integration = 'steam';

  static getSetupResponse(action: string) {
    const message =
      action === 'guard-code'
        ? 'Steam Guard — not implemented yet'
        : `Steam ${action} — not implemented yet`;

    return {
      status: 'setup' as const,
      integration: 'steam',
      message,
    };
  }

  static readEnv() {
    return {
      encryptionKey: process.env.STEAM_ENCRYPTION_KEY ?? '',
      guardCooldownMinutes: process.env.STEAM_GUARD_COOLDOWN_MINUTES ?? '15',
    };
  }

  static validateEncryptionKey(value: string): SteamEnvFieldStatus {
    if (!value) return 'missing';
    if (/^[0-9a-fA-F]{64}$/.test(value)) return 'valid';
    return value.length >= 32 ? 'valid' : 'invalid';
  }

  static validateCooldownMinutes(value: string): SteamEnvFieldStatus {
    if (!value) return 'missing';
    const minutes = Number.parseInt(value, 10);
    return Number.isFinite(minutes) && minutes > 0 ? 'valid' : 'invalid';
  }

  static readCooldownMinutes(): number {
    const { guardCooldownMinutes } = this.readEnv();
    const minutes = Number.parseInt(guardCooldownMinutes, 10);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : 15;
  }

  static getHealthResponse() {
    const { encryptionKey } = this.getEnvStatus();
    const configured = encryptionKey === 'valid';

    return {
      status: 'setup' as const,
      integration: 'steam',
      message: configured
        ? 'Steam — configured, not implemented yet'
        : 'Steam — not configured, not implemented yet',
    };
  }

  static getEnvStatus(): SteamEnvStatus {
    const env = this.readEnv();
    return {
      encryptionKey: this.validateEncryptionKey(env.encryptionKey),
      guardCooldownMinutes: this.validateCooldownMinutes(
        env.guardCooldownMinutes,
      ),
    };
  }
}
