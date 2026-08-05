export type PaddleEnvFieldStatus = 'missing' | 'invalid' | 'valid';

export type PaddleEnvStatus = {
  apiKey: PaddleEnvFieldStatus;
  webhookSecret: PaddleEnvFieldStatus;
  environment: PaddleEnvFieldStatus;
};

export type PaddleHealthStatus = 'ok' | 'misconfigured';

export type PaddleHealthResponse = {
  status: PaddleHealthStatus;
  integration: 'paddle';
  env: PaddleEnvStatus;
};

const PADDLE_API_KEY_REGEX =
  /^pdl_(live|sdbx)_apikey_[a-z\d]{26}_[a-zA-Z\d]{22}_[a-zA-Z\d]{3}$/;

export class PaddleConfig {
  static integration = 'paddle';

  static getSetupResponse(action: string) {
    return {
      status: 'setup' as const,
      integration: 'paddle' as const,
      message: `Paddle ${action} not implemented yet`,
    };
  }

  static readEnv() {
    return {
      apiKey: process.env.PADDLE_API_KEY ?? '',
      webhookSecret: process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? '',
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV ?? 'sandbox',
    };
  }

  static validateApiKey(value: string): PaddleEnvFieldStatus {
    if (!value) return 'missing';
    return PADDLE_API_KEY_REGEX.test(value) ? 'valid' : 'invalid';
  }

  static validateWebhookSecret(value: string): PaddleEnvFieldStatus {
    if (!value) return 'missing';
    return value.length >= 16 ? 'valid' : 'invalid';
  }

  static validateEnvironment(value: string): PaddleEnvFieldStatus {
    if (!value) return 'missing';
    return value === 'sandbox' || value === 'production' ? 'valid' : 'invalid';
  }

  static isEnvConfigured(
    env: PaddleEnvStatus = this.getEnvStatus(),
  ): boolean {
    return (
      env.apiKey === 'valid' &&
      env.webhookSecret === 'valid' &&
      env.environment === 'valid'
    );
  }

  /** Checkout creation only needs the API key and a valid environment. */
  static isCheckoutConfigured(
    env: PaddleEnvStatus = this.getEnvStatus(),
  ): boolean {
    return env.apiKey === 'valid' && env.environment === 'valid';
  }

  static getHealthResponse(): PaddleHealthResponse {
    const env = this.getEnvStatus();

    return {
      status: this.isEnvConfigured(env) ? 'ok' : 'misconfigured',
      integration: 'paddle',
      env,
    };
  }

  static getEnvStatus(): PaddleEnvStatus {
    const env = this.readEnv();
    return {
      apiKey: this.validateApiKey(env.apiKey),
      webhookSecret: this.validateWebhookSecret(env.webhookSecret),
      environment: this.validateEnvironment(env.environment),
    };
  }
}
