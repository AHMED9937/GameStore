export type StripeEnvFieldStatus = 'missing' | 'invalid' | 'valid';

export type StripeEnvStatus = {
  secretKey: StripeEnvFieldStatus;
  webhookSecret: StripeEnvFieldStatus;
  publishableKey: StripeEnvFieldStatus;
};

export type StripeHealthStatus = 'ok' | 'misconfigured';

export type StripeHealthResponse = {
  status: StripeHealthStatus;
  integration: 'stripe';
  env: StripeEnvStatus;
};

export class StripeConfig {
  static integration = 'stripe';

  static getSetupResponse(action: string) {
    return {
      status: 'setup' as const,
      integration: 'stripe',
      message: `Stripe ${action} not implemented yet`,
    };
  }

  static readEnv() {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY ?? '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
    };
  }

  static validateSecretKey(value: string): StripeEnvFieldStatus {
    if (!value) return 'missing';
    return /^sk_(test|live)_/.test(value) ? 'valid' : 'invalid';
  }

  static validateWebhookSecret(value: string): StripeEnvFieldStatus {
    if (!value) return 'missing';
    return value.startsWith('whsec_') ? 'valid' : 'invalid';
  }

  static validatePublishableKey(value: string): StripeEnvFieldStatus {
    if (!value) return 'missing';
    return /^pk_(test|live)_/.test(value) ? 'valid' : 'invalid';
  }

  static isEnvConfigured(env: StripeEnvStatus = this.getEnvStatus()): boolean {
    return (
      env.secretKey === 'valid' &&
      env.publishableKey === 'valid' &&
      env.webhookSecret === 'valid'
    );
  }

  /** Checkout sessions only need secret + publishable keys; webhooks are separate. */
  static isCheckoutConfigured(
    env: StripeEnvStatus = this.getEnvStatus(),
  ): boolean {
    return env.secretKey === 'valid' && env.publishableKey === 'valid';
  }

  static getHealthResponse(): StripeHealthResponse {
    const env = this.getEnvStatus();

    return {
      status: this.isEnvConfigured(env) ? 'ok' : 'misconfigured',
      integration: 'stripe',
      env,
    };
  }

  static getEnvStatus(): StripeEnvStatus {
    const env = this.readEnv();
    return {
      secretKey: this.validateSecretKey(env.secretKey),
      webhookSecret: this.validateWebhookSecret(env.webhookSecret),
      publishableKey: this.validatePublishableKey(env.publishableKey),
    };
  }
}
