import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GamesRepository,
  SubscriptionPlansRepository,
} from '@gamestore/api/data-access';
import { Prisma } from '@prisma/client';

export type AdminSubscriptionPlanGameDto = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
};

export type AdminSubscriptionPlanListItemDto = {
  id: string;
  name: string;
  slug: string;
  stripePriceId: string;
  interval: string;
  intervalCount: number;
  isActive: boolean;
  gameCount: number;
};

export type AdminSubscriptionPlanDetailDto = {
  id: string;
  name: string;
  slug: string;
  stripePriceId: string;
  interval: string;
  intervalCount: number;
  isActive: boolean;
  games: AdminSubscriptionPlanGameDto[];
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminSubscriptionPlanDto = {
  name: string;
  slug?: string;
  stripePriceId: string;
  interval: string;
  intervalCount?: number;
  isActive?: boolean;
  gameIds?: string[];
};

export type UpdateAdminSubscriptionPlanDto = {
  name?: string;
  slug?: string;
  stripePriceId?: string;
  interval?: string;
  intervalCount?: number;
  isActive?: boolean;
  gameIds?: string[];
};

const ALLOWED_INTERVALS = new Set(['day', 'week', 'month', 'year']);

@Injectable()
export class AdminSubscriptionPlansService {
  constructor(
    private readonly plans: SubscriptionPlansRepository,
    private readonly games: GamesRepository,
  ) {}

  async findAll(): Promise<AdminSubscriptionPlanListItemDto[]> {
    const rows = await this.plans.findAll();
    return rows.map((row) => this.toListItemDto(row));
  }

  async findOne(id: string): Promise<AdminSubscriptionPlanDetailDto> {
    const plan = await this.plans.findById(id);
    if (!plan) {
      throw new NotFoundException(`No subscription plan found with id "${id}"`);
    }
    return this.toDetailDto(plan);
  }

  async create(
    dto: CreateAdminSubscriptionPlanDto,
  ): Promise<AdminSubscriptionPlanDetailDto> {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const slug = this.resolveSlug(name, dto.slug);
    const stripePriceId = dto.stripePriceId?.trim();
    if (!stripePriceId) {
      throw new BadRequestException('stripePriceId is required');
    }

    const interval = this.normalizeInterval(dto.interval);
    const intervalCount = this.normalizeIntervalCount(dto.intervalCount);
    const gameIds = await this.resolveGameIds(dto.gameIds);

    try {
      const plan = await this.plans.create({
        name,
        slug,
        stripePriceId,
        interval,
        intervalCount,
        isActive: dto.isActive ?? true,
      });

      if (gameIds.length > 0) {
        await this.plans.setGames(plan.id, gameIds);
      }

      return this.findOne(plan.id);
    } catch (error) {
      this.rethrowUniqueConstraint(error, slug, stripePriceId);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateAdminSubscriptionPlanDto,
  ): Promise<AdminSubscriptionPlanDetailDto> {
    await this.findOne(id);

    const data: Prisma.SubscriptionPlanUpdateInput = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('name cannot be empty');
      }
      data.name = name;
    }
    if (dto.slug !== undefined) {
      const slug = dto.slug.trim();
      if (!slug) {
        throw new BadRequestException('slug cannot be empty');
      }
      data.slug = slug;
    }
    if (dto.stripePriceId !== undefined) {
      const stripePriceId = dto.stripePriceId.trim();
      if (!stripePriceId) {
        throw new BadRequestException('stripePriceId cannot be empty');
      }
      data.stripePriceId = stripePriceId;
    }
    if (dto.interval !== undefined) {
      data.interval = this.normalizeInterval(dto.interval);
    }
    if (dto.intervalCount !== undefined) {
      data.intervalCount = this.normalizeIntervalCount(dto.intervalCount);
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      if (Object.keys(data).length > 0) {
        await this.plans.update(id, data);
      }

      if (dto.gameIds !== undefined) {
        const gameIds = await this.resolveGameIds(dto.gameIds);
        await this.plans.setGames(id, gameIds);
      }

      return this.findOne(id);
    } catch (error) {
      this.rethrowUniqueConstraint(
        error,
        typeof data.slug === 'string' ? data.slug : undefined,
        typeof data.stripePriceId === 'string' ? data.stripePriceId : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.findOne(id);

    try {
      await this.plans.delete(id);
      return { id, deleted: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete a subscription plan with active subscriber records',
        );
      }
      throw error;
    }
  }

  private async resolveGameIds(gameIds: string[] | undefined): Promise<string[]> {
    if (!gameIds?.length) {
      return [];
    }

    const uniqueIds = [...new Set(gameIds.map((id) => id.trim()).filter(Boolean))];
    const resolved: string[] = [];

    for (const gameId of uniqueIds) {
      const game = await this.games.findById(gameId);
      if (!game) {
        throw new NotFoundException(`No game found with id "${gameId}"`);
      }
      if (!game.publishedAt) {
        throw new BadRequestException(
          `Game "${game.title}" must be published before it can be added to a plan`,
        );
      }
      resolved.push(gameId);
    }

    return resolved;
  }

  private resolveSlug(name: string, slug?: string): string {
    const value = slug?.trim() || this.slugifyName(name);
    if (!value) {
      throw new BadRequestException('slug is required');
    }
    return value;
  }

  private slugifyName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeInterval(interval: string): string {
    const value = interval?.trim().toLowerCase();
    if (!value || !ALLOWED_INTERVALS.has(value)) {
      throw new BadRequestException(
        'interval must be one of: day, week, month, year',
      );
    }
    return value;
  }

  private normalizeIntervalCount(intervalCount?: number): number {
    const value = intervalCount ?? 1;
    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException('intervalCount must be a positive integer');
    }
    return value;
  }

  private rethrowUniqueConstraint(
    error: unknown,
    slug?: string,
    stripePriceId?: string,
  ): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(',')
        : String(error.meta?.target ?? '');

      if (target.includes('slug') && slug) {
        throw new ConflictException(`Subscription plan slug "${slug}" already exists`);
      }
      if (target.includes('stripePriceId') && stripePriceId) {
        throw new ConflictException(
          `Stripe price id "${stripePriceId}" is already linked to a plan`,
        );
      }
      throw new ConflictException('Subscription plan already exists');
    }
  }

  private toListItemDto(plan: {
    id: string;
    name: string;
    slug: string;
    stripePriceId: string;
    interval: string;
    intervalCount: number;
    isActive: boolean;
    games: unknown[];
  }): AdminSubscriptionPlanListItemDto {
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      stripePriceId: plan.stripePriceId,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      isActive: plan.isActive,
      gameCount: plan.games.length,
    };
  }

  private toDetailDto(plan: {
    id: string;
    name: string;
    slug: string;
    stripePriceId: string;
    interval: string;
    intervalCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    games: Array<{
      game: {
        id: string;
        title: string;
        slug: string;
        publishedAt: Date | null;
      };
    }>;
  }): AdminSubscriptionPlanDetailDto {
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      stripePriceId: plan.stripePriceId,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      isActive: plan.isActive,
      games: plan.games.map(({ game }) => ({
        id: game.id,
        title: game.title,
        slug: game.slug,
        published: game.publishedAt !== null,
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }
}
