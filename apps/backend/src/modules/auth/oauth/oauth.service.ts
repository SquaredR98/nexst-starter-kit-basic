import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { OAuthAccount } from '../../../database/entities/oauth-account.entity';
import { Profile } from '../../../database/entities/profile.entity';
import { Session } from '../../../database/entities/session.entity';
import { JwtAuthService } from '../jwt/jwt.service';
import type { GoogleProfile } from './strategies/google.strategy';
import type { GithubProfile } from './strategies/github.strategy';
import {
  OAuthAccountDto,
  OAuthAccountListDto,
  OAuthLoginResponseDto,
} from './dto/oauth-response.dto';

type OAuthProfile = GoogleProfile | GithubProfile;

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OAuthAccount)
    private readonly oauthAccountRepository: Repository<OAuthAccount>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  /**
   * Handle OAuth login/registration
   */
  async handleOAuthLogin(
    profile: OAuthProfile,
    ipAddress: string,
    userAgent: string,
  ): Promise<OAuthLoginResponseDto> {
    if (!profile.email) {
      throw new BadRequestException(
        'Email not provided by OAuth provider. Please ensure your email is public.',
      );
    }

    // Check if OAuth account exists
    let oauthAccount = await this.oauthAccountRepository.findOne({
      where: {
        provider: profile.provider,
        providerAccountId: profile.providerId,
      },
      relations: ['user'],
    });

    let user: User;
    let isNewUser = false;

    if (oauthAccount) {
      // Existing OAuth account - login
      user = oauthAccount.user;

      // Update profile data in case it changed
      oauthAccount.profileData = {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      };
      await this.oauthAccountRepository.save(oauthAccount);

      this.logger.log(
        `OAuth login for existing user: ${user.id} via ${profile.provider}`,
      );
    } else {
      // Check if user with this email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: profile.email },
        relations: ['profile'],
      });

      if (existingUser) {
        // User exists, link OAuth account
        user = existingUser;
        oauthAccount = await this.linkOAuthAccountToUser(user.id, profile);
        this.logger.log(
          `Linked ${profile.provider} account to existing user: ${user.id}`,
        );
      } else {
        // New user - create account with OAuth
        user = await this.createUserFromOAuth(profile);
        oauthAccount = await this.linkOAuthAccountToUser(user.id, profile);
        isNewUser = true;
        this.logger.log(
          `Created new user: ${user.id} via ${profile.provider}`,
        );
      }
    }

    // Create session
    const session = await this.createSession(user.id, ipAddress, userAgent);

    // Fetch user with roles for token generation
    const userWithRoles = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.role'],
    });

    if (!userWithRoles) {
      throw new Error('User not found after OAuth login');
    }

    // Generate JWT tokens
    const tokens = await this.jwtAuthService.generateTokenPair(
      userWithRoles,
      session.id,
      ipAddress,
      userAgent,
    );

    // Update session with refresh token
    await this.sessionRepository.update(
      { id: session.id },
      { refreshToken: tokens.refreshToken },
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      isNewUser,
    };
  }

  /**
   * Create a new user from OAuth profile
   */
  private async createUserFromOAuth(profile: OAuthProfile): Promise<User> {
    // Create user
    const user = this.userRepository.create({
      email: profile.email,
      emailVerified: new Date(), // OAuth emails are pre-verified
      passwordHash: null, // OAuth users don't have passwords
    });
    await this.userRepository.save(user);

    // Create profile
    const userProfile = this.profileRepository.create({
      userId: user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
    });
    await this.profileRepository.save(userProfile);

    return user;
  }

  /**
   * Link OAuth account to existing user
   */
  async linkOAuthAccountToUser(
    userId: string,
    profile: OAuthProfile,
  ): Promise<OAuthAccount> {
    // Check if this OAuth account is already linked to another user
    const existingOAuth = await this.oauthAccountRepository.findOne({
      where: {
        provider: profile.provider,
        providerAccountId: profile.providerId,
      },
    });

    if (existingOAuth && existingOAuth.userId !== userId) {
      throw new ConflictException(
        `This ${profile.provider} account is already linked to another user`,
      );
    }

    if (existingOAuth) {
      return existingOAuth; // Already linked
    }

    // Create new OAuth account link
    const oauthAccount = this.oauthAccountRepository.create({
      userId,
      provider: profile.provider,
      providerAccountId: profile.providerId,
      profileData: {
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      },
    });

    return await this.oauthAccountRepository.save(oauthAccount);
  }

  /**
   * Unlink OAuth account from user
   */
  async unlinkOAuthAccount(
    userId: string,
    provider: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['oauthAccounts'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has a password or other OAuth accounts
    const hasPassword = !!user.passwordHash;
    const oauthAccountsCount = user.oauthAccounts.length;

    if (!hasPassword && oauthAccountsCount === 1) {
      throw new BadRequestException(
        'Cannot unlink your only login method. Please set a password first.',
      );
    }

    const oauthAccount = await this.oauthAccountRepository.findOne({
      where: { userId, provider },
    });

    if (!oauthAccount) {
      throw new NotFoundException(
        `No ${provider} account linked to this user`,
      );
    }

    await this.oauthAccountRepository.remove(oauthAccount);

    this.logger.log(`Unlinked ${provider} account from user: ${userId}`);

    return {
      success: true,
      message: `${provider} account has been unlinked successfully`,
    };
  }

  /**
   * Get linked OAuth accounts for a user
   */
  async getLinkedAccounts(userId: string): Promise<OAuthAccountListDto> {
    const oauthAccounts = await this.oauthAccountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const accounts: OAuthAccountDto[] = oauthAccounts.map((account) => ({
      provider: account.provider,
      providerId: account.providerAccountId,
      email: account.profileData?.email || null,
      displayName: account.profileData?.displayName || null,
      avatarUrl: account.profileData?.avatarUrl || null,
      createdAt: account.createdAt,
    }));

    return { accounts };
  }

  /**
   * Create a new session
   */
  private async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const refreshTokenExpiration = this.jwtAuthService['refreshTokenExpiration'];
    const expiresAt = new Date();

    // Parse expiration string (e.g., "7d" -> 7 days)
    const match = refreshTokenExpiration.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      switch (unit) {
        case 's':
          expiresAt.setSeconds(expiresAt.getSeconds() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
      }
    } else {
      // Default to 7 days
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const session = this.sessionRepository.create({
      userId,
      ipAddress,
      userAgent,
      expiresAt,
      lastActiveAt: new Date(),
    });

    return await this.sessionRepository.save(session);
  }
}
