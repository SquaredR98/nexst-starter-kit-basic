import {
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { Session } from '../../../database/entities/session.entity';
import { User } from '../../../database/entities/user.entity';
import {
  JwtPayload,
  JwtRefreshPayload,
  TokenPair,
} from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthService {
  private readonly logger = new Logger(JwtAuthService.name);
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;
  private readonly issuer: string;

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.accessTokenSecret = this.configService.get<string>('jwt.secret') || '';
    this.refreshTokenSecret = this.configService.get<string>(
      'jwt.refreshSecret',
    ) || '';
    this.accessTokenExpiration = this.configService.get<string>(
      'jwt.accessExpiration',
    ) || '15m';
    this.refreshTokenExpiration = this.configService.get<string>(
      'jwt.refreshExpiration',
    ) || '7d';
    this.issuer = this.configService.get<string>('jwt.issuer') || 'auth-starter-kit';
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(
    user: User,
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const roles = user.roles?.map((ur) => ur.role?.name).filter((name): name is string => !!name) || [];

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      sessionId,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload as any, {
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenExpiration as any,
        issuer: this.issuer,
      }),
      this.jwtService.signAsync(refreshPayload as any, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenExpiration as any,
        issuer: this.issuer,
      }),
    ]);

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpiration(this.accessTokenExpiration);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.accessTokenSecret,
        issuer: this.issuer,
      });

      return payload;
    } catch (error) {
      this.logger.error(`Access token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        token,
        {
          secret: this.refreshTokenSecret,
          issuer: this.issuer,
        },
      );

      // Verify session still exists and is valid
      const session = await this.sessionRepository.findOne({
        where: {
          id: payload.sessionId,
          refreshToken: token,
          revokedAt: IsNull(),
        },
      });

      if (!session) {
        throw new UnauthorizedException('Session not found or revoked');
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session has expired');
      }

      return payload;
    } catch (error) {
      this.logger.error(`Refresh token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);

    // Fetch user with roles
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update session last active time
    await this.sessionRepository.update(
      { id: payload.sessionId },
      { lastActiveAt: new Date() },
    );

    // Generate new token pair (token rotation)
    const newTokenPair = await this.generateTokenPair(
      user,
      payload.sessionId,
    );

    // Update session with new refresh token
    await this.sessionRepository.update(
      { id: payload.sessionId },
      { refreshToken: newTokenPair.refreshToken },
    );

    // Blacklist old refresh token
    await this.blacklistToken(refreshToken, this.refreshTokenExpiration);

    return newTokenPair;
  }

  /**
   * Revoke token (add to blacklist)
   */
  async revokeToken(token: string, expiration: string): Promise<void> {
    await this.blacklistToken(token, expiration);
  }

  /**
   * Revoke all tokens for a session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (session && session.refreshToken) {
      // Blacklist the refresh token
      await this.blacklistToken(
        session.refreshToken,
        this.refreshTokenExpiration,
      );

      // Mark session as revoked
      await this.sessionRepository.update(
        { id: sessionId },
        { revokedAt: new Date() },
      );
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.sessionRepository.find({
      where: { userId, revokedAt: IsNull() },
    });

    for (const session of sessions) {
      if (session.refreshToken) {
        await this.blacklistToken(
          session.refreshToken,
          this.refreshTokenExpiration,
        );
      }
    }

    // Mark all sessions as revoked
    await this.sessionRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /**
   * Add token to blacklist in Redis
   */
  private async blacklistToken(
    token: string,
    expiration: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(token);
    const ttl = this.parseExpiration(expiration);
    const key = `blacklist:${tokenHash}`;

    await this.cacheManager.set(key, '1', ttl * 1000);
    this.logger.debug(`Token blacklisted: ${tokenHash}`);
  }

  /**
   * Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const key = `blacklist:${tokenHash}`;
    const result = await this.cacheManager.get(key);
    return !!result;
  }

  /**
   * Hash token for blacklist storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse expiration string to seconds
   */
  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }

  /**
   * Create fingerprint from request metadata
   * Basic tier: Simple hash of IP + User-Agent
   */
  createFingerprint(ipAddress: string, userAgent: string): string {
    const data = `${ipAddress}:${userAgent}`;
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 32);
  }
}
