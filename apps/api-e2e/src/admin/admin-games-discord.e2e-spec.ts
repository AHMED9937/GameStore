import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import { ClerkAuthGuard } from '@gamestore/api/auth';
import { AppModule } from '../../../api/src/app/app.module';
import { DiscordNotifyService } from '../../../api/src/app/discord/discord-notify.service';
import { E2eClerkAuthGuard } from '../support/e2e-auth.guard';
import {
  authAs,
  closeE2eApp,
  seedE2eUsers,
} from '../support/e2e-app';
import { E2E_TOKENS } from '../support/e2e-auth.tokens';

const hasDatabase = Boolean(process.env.DATABASE_URL);

const LONG_DESCRIPTION =
  'A richly detailed game description for e2e testing that exceeds fifty characters.';

describe.skipIf(!hasDatabase)('Admin games Discord announcement lifecycle', () => {
  let app: INestApplication;
  let discordGameId = '';
  const discordNotify = {
    isWebhookConfigured: vi.fn().mockReturnValue(true),
    publishGameAnnouncement: vi.fn().mockResolvedValue('discord-msg-e2e'),
    updateGameAnnouncement: vi.fn().mockResolvedValue(undefined),
    deleteGameAnnouncement: vi.fn().mockResolvedValue(true),
  };

  async function createPublishableGame(slug: string) {
    const createResponse = await request(app.getHttpServer())
      .post('/api/admin/games')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        title: 'E2E Discord Game',
        slug,
        platform: 'steam',
        priceBase: 14.99,
        genres: ['Adventure'],
        description: LONG_DESCRIPTION,
        coverImage: '/og/default.png',
      })
      .expect(201);

    const gameId = createResponse.body.id as string;

    const accountResponse = await request(app.getHttpServer())
      .post('/api/admin/accounts')
      .set(authAs(E2E_TOKENS.admin))
      .send({
        username: `pool-discord-${slug}`,
        password: 'e2e-test-password',
        sharedSecret: 'e2e-shared-secret-value',
        region: 'global',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/admin/accounts/${accountResponse.body.id}/assign`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ gameId })
      .expect(200);

    return gameId;
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ClerkAuthGuard)
      .useClass(E2eClerkAuthGuard)
      .overrideProvider(DiscordNotifyService)
      .useValue(discordNotify)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    await seedE2eUsers(app);
  });

  afterEach(async () => {
    if (discordGameId) {
      await request(app.getHttpServer())
        .delete(`/api/admin/games/${discordGameId}`)
        .set(authAs(E2E_TOKENS.admin))
        .catch(() => undefined);
      discordGameId = '';
    }
    vi.clearAllMocks();
    discordNotify.isWebhookConfigured.mockReturnValue(true);
    discordNotify.publishGameAnnouncement.mockResolvedValue('discord-msg-e2e');
    discordNotify.updateGameAnnouncement.mockResolvedValue(undefined);
    discordNotify.deleteGameAnnouncement.mockResolvedValue(true);
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('publishes to Discord on first publish and stores message id', async () => {
    const slug = `e2e-discord-publish-${Date.now()}`;
    discordGameId = await createPublishableGame(slug);

    await request(app.getHttpServer())
      .put(`/api/admin/games/${discordGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: true })
      .expect(200);

    expect(discordNotify.publishGameAnnouncement).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'E2E Discord Game',
        slug,
      }),
    );

    const published = await request(app.getHttpServer())
      .get(`/api/admin/games/${discordGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(published.body.discord).toMatchObject({
      configured: true,
      posted: true,
      messageId: 'discord-msg-e2e',
    });
  });

  it('deletes Discord message on unpublish', async () => {
    const slug = `e2e-discord-unpublish-${Date.now()}`;
    discordGameId = await createPublishableGame(slug);

    await request(app.getHttpServer())
      .put(`/api/admin/games/${discordGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: true })
      .expect(200);

    vi.clearAllMocks();
    discordNotify.isWebhookConfigured.mockReturnValue(true);
    discordNotify.deleteGameAnnouncement.mockResolvedValue(true);

    await request(app.getHttpServer())
      .put(`/api/admin/games/${discordGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: false })
      .expect(200)
      .expect((response) => {
        expect(response.body.discord.posted).toBe(false);
        expect(response.body.discord.messageId).toBeNull();
      });

    expect(discordNotify.deleteGameAnnouncement).toHaveBeenCalledWith(
      'discord-msg-e2e',
    );
  });

  it('updates Discord when announcement text changes on a published game', async () => {
    const slug = `e2e-discord-patch-${Date.now()}`;
    discordGameId = await createPublishableGame(slug);

    await request(app.getHttpServer())
      .put(`/api/admin/games/${discordGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: true })
      .expect(200);

    vi.clearAllMocks();
    discordNotify.isWebhookConfigured.mockReturnValue(true);
    discordNotify.updateGameAnnouncement.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .put(`/api/admin/games/${discordGameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ discordAnnounceDescription: 'Launch week special on Discord!' })
      .expect(200);

    expect(discordNotify.updateGameAnnouncement).toHaveBeenCalledWith(
      'discord-msg-e2e',
      expect.objectContaining({
        announceDescription: 'Launch week special on Discord!',
      }),
    );
  });

  it('deletes Discord message when game is deleted', async () => {
    const slug = `e2e-discord-delete-${Date.now()}`;
    const gameId = await createPublishableGame(slug);

    await request(app.getHttpServer())
      .put(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .send({ published: true })
      .expect(200);

    vi.clearAllMocks();
    discordNotify.isWebhookConfigured.mockReturnValue(true);
    discordNotify.deleteGameAnnouncement.mockResolvedValue(true);

    await request(app.getHttpServer())
      .delete(`/api/admin/games/${gameId}`)
      .set(authAs(E2E_TOKENS.admin))
      .expect(200);

    expect(discordNotify.deleteGameAnnouncement).toHaveBeenCalledWith(
      'discord-msg-e2e',
    );
  });
});

if (!hasDatabase) {
  // eslint-disable-next-line no-console
  console.warn('Skipping Admin games Discord e2e tests: DATABASE_URL is not set');
}
