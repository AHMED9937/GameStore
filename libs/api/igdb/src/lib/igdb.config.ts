export class IgdbConfig {
  static integration = 'igdb';

  static getSetupResponse(action: string) {
    return {
      status: 'setup' as const,
      integration: 'igdb',
      message: `IGDB ${action} — not implemented yet`,
    };
  }
}
