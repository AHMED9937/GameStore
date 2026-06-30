export type ClerkEnvFieldStatus = 'set' | 'missing';

export type ClerkEnvStatus = {
  secretKey: ClerkEnvFieldStatus;
  webhookSecret: ClerkEnvFieldStatus;
  publishableKey: ClerkEnvFieldStatus;
  configured: boolean;
};

export const ClerkConfig = {
  getSecretKey(): string | undefined {
    return process.env['CLERK_SECRET_KEY'] || undefined;
  },

  getWebhookSecret(): string | undefined {
    return (
      process.env['CLERK_WEBHOOK_SIGNING_SECRET'] ||
      process.env['CLERK_WEBHOOK_SECRET'] ||
      undefined
    );
  },

  getPublishableKey(): string | undefined {
    return process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] || undefined;
  },

  getEnvStatus(): ClerkEnvStatus {
    const secretKey = this.getSecretKey() ? 'set' : 'missing';
    const webhookSecret = this.getWebhookSecret() ? 'set' : 'missing';
    const publishableKey = this.getPublishableKey() ? 'set' : 'missing';

    return {
      secretKey,
      webhookSecret,
      publishableKey,
      configured: secretKey === 'set' && publishableKey === 'set',
    };
  },
};
