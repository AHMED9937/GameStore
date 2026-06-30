export type StripeEnvFieldStatus = 'missing' | 'invalid' | 'valid';

export type StripeEnvStatus = {
  secretKey: StripeEnvFieldStatus;
  webhookSecret: StripeEnvFieldStatus;
  publishableKey: StripeEnvFieldStatus;
};

export class StripeConfig {
  static integration = 'stripe';

  static getSetupResponse(action: string) {
    return {
      status: 'setup' as const,
      integration: 'stripe',
      message: `Stripe ${action} — not implemented yet`,
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

  static getHealthResponse() {
    const { secretKey, publishableKey } = this.getEnvStatus();
    const configured =
      secretKey === 'valid' && publishableKey === 'valid';

    return {
      status: 'setup' as const,
      integration: 'stripe',
      message: configured
        ? 'Stripe — configured, not implemented yet'
        : 'Stripe — not configured, not implemented yet',
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
