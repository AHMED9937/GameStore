export class PrismaConfig {
  static integration = 'prisma';

  static getSetupResponse(action: string) {
    return {
      status: 'setup',
      integration: 'prisma',
      message: `Prisma ${action} not implemented yet`,
    };
  }
}
