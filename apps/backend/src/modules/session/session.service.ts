import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Session } from '../../database/entities/session.entity';
import { JwtAuthService } from '../auth/jwt/jwt.service';
import {
  SessionResponseDto,
  SessionListResponseDto,
} from './dto/session-response.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionListResponseDto> {
    const sessions = await this.sessionRepository.find({
      where: {
        userId,
        revokedAt: IsNull(),
      },
      order: {
        lastActiveAt: 'DESC',
      },
    });

    const sessionDtos: SessionResponseDto[] = sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentSessionId,
    }));

    return {
      sessions: sessionDtos,
      total: sessionDtos.length,
    };
  }

  /**
   * Get a specific session by ID
   */
  async getSessionById(
    sessionId: string,
    userId: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        userId,
        revokedAt: IsNull(),
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: false,
    };
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(
    sessionId: string,
    userId: string,
    currentSessionId?: string,
  ): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Prevent user from revoking their current session via this endpoint
    // (they should use logout instead)
    if (currentSessionId && session.id === currentSessionId) {
      throw new ForbiddenException(
        'Cannot revoke current session. Use logout endpoint instead.',
      );
    }

    // Revoke the session
    await this.jwtAuthService.revokeSession(sessionId);

    this.logger.log(
      `Session ${sessionId} revoked for user ${userId}`,
    );
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<{ revokedCount: number }> {
    const sessions = await this.sessionRepository.find({
      where: {
        userId,
        revokedAt: IsNull(),
      },
    });

    const sessionsToRevoke = sessions.filter(
      (session) => session.id !== currentSessionId,
    );

    for (const session of sessionsToRevoke) {
      await this.jwtAuthService.revokeSession(session.id);
    }

    this.logger.log(
      `Revoked ${sessionsToRevoke.length} sessions for user ${userId}`,
    );

    return {
      revokedCount: sessionsToRevoke.length,
    };
  }

  /**
   * Clean up expired sessions (can be called by a cron job)
   */
  async cleanupExpiredSessions(): Promise<{ deletedCount: number }> {
    const now = new Date();

    const expiredSessions = await this.sessionRepository.find({
      where: [
        { expiresAt: IsNull() }, // This won't match anything but TypeORM needs proper typing
      ],
    });

    // Filter in-memory for expired sessions
    const sessionsToDelete = expiredSessions.filter(
      (session) => session.expiresAt < now,
    );

    if (sessionsToDelete.length > 0) {
      await this.sessionRepository.remove(sessionsToDelete);
    }

    this.logger.log(`Cleaned up ${sessionsToDelete.length} expired sessions`);

    return {
      deletedCount: sessionsToDelete.length,
    };
  }
}
