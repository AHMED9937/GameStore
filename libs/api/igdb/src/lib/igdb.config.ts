export class IgdbConfig {
  static integration = 'igdb';

  static getSetupResponse(action: string) {
    return {
      status: 'setup' as const,
      integration: 'igdb',
      message: `IGDB ${action} is not configured. Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in .env and restart the API.`,
    };
  }

  static isConfigured(): boolean {
    return Boolean(this.clientId() && this.clientSecret());
  }

  static clientId(): string | undefined {
    return process.env['IGDB_CLIENT_ID'] || undefined;
  }

  static clientSecret(): string | undefined {
    return process.env['IGDB_CLIENT_SECRET'] || undefined;
  }

  static tokenUrl(): string {
    return 'https://id.twitch.tv/oauth2/token';
  }

  static apiBaseUrl(): string {
    return 'https://api.igdb.com/v4';
  }
}
