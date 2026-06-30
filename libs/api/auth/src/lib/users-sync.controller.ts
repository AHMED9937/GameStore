import { Body, Controller, Patch, Post } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { parseProfileUpdateInput, userProfileResponse } from './auth.types';
import { ClerkConfig } from './clerk.config';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './auth.types';
import { clerkApiUserFromSdk } from './clerk-user-sync';
import { UsersRepository } from './users.repository';

@Controller('users')
export class UsersSyncController {
  private readonly clerk = createClerkClient({
    secretKey: ClerkConfig.getSecretKey() ?? '',
  });

  constructor(private readonly usersRepository: UsersRepository) {}

  @Post('sync')
  async syncCurrentUser(@CurrentUser() currentUser: AuthUser) {
    const clerkUser = await this.clerk.users.getUser(currentUser.clerkId);
    const user = await this.usersRepository.syncFromClerkApiUser(
      clerkApiUserFromSdk(clerkUser),
    );

    return {
      synced: true,
      user: userProfileResponse(user),
    };
  }

  @Patch('me')
  async updateProfile(@CurrentUser() currentUser: AuthUser, @Body() body: unknown) {
    const profile = parseProfileUpdateInput(body);

    await this.clerk.users.updateUser(currentUser.clerkId, {
      firstName: profile.firstName,
      lastName: profile.lastName,
    });

    const clerkUser = await this.clerk.users.getUser(currentUser.clerkId);
    const user = await this.usersRepository.syncFromClerkApiUser(
      clerkApiUserFromSdk(clerkUser),
    );

    return { user: userProfileResponse(user) };
  }
}
