import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Webhook } from 'svix';
import { ClerkConfig } from './clerk.config';
import { Public } from './public.decorator';
import { UsersRepository } from './users.repository';

@SkipThrottle()
@Controller('webhooks')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  @Public()
  @Post('clerk')
  async handleClerkWebhook(
    @Req() request: { rawBody?: Buffer },
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
  ) {
    const webhookSecret = ClerkConfig.getWebhookSecret();
    if (!webhookSecret) {
      throw new ServiceUnavailableException('Clerk webhook secret is not configured');
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing Svix headers');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    const payload = rawBody.toString('utf8');
    const webhook = new Webhook(webhookSecret);

    let event: { type: string; data: unknown };
    try {
      event = webhook.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: unknown };
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    const action = await this.usersRepository.applyClerkEvent(event.type, event.data);

    if (action !== 'ignored') {
      this.logger.log(`Clerk webhook ${event.type} → Neon ${action}`);
    }

    return { received: true, action };
  }
}
