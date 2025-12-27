import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../auth/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/jwt/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { SessionListResponseDto } from './dto/session-response.dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * Get all active sessions for the current user
   */
  @Get()
  async getUserSessions(
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<SessionListResponseDto> {
    // Extract current session ID from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    let currentSessionId: string | undefined;

    if (token) {
      try {
        const payload = await this.sessionService['jwtAuthService'].verifyAccessToken(token);
        currentSessionId = payload.sessionId;
      } catch (error) {
        // If token verification fails, just don't mark any session as current
      }
    }

    return this.sessionService.getUserSessions(user.id, currentSessionId);
  }

  /**
   * Get a specific session by ID
   */
  @Get(':id')
  async getSessionById(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
  ) {
    return this.sessionService.getSessionById(sessionId, user.id);
  }

  /**
   * Revoke a specific session
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    // Extract current session ID to prevent self-revocation
    const token = req.headers.authorization?.replace('Bearer ', '');
    let currentSessionId: string | undefined;

    if (token) {
      try {
        const payload = await this.sessionService['jwtAuthService'].verifyAccessToken(token);
        currentSessionId = payload.sessionId;
      } catch (error) {
        // Ignore
      }
    }

    await this.sessionService.revokeSession(
      sessionId,
      user.id,
      currentSessionId,
    );

    return { message: 'Session revoked successfully' };
  }

  /**
   * Revoke all other sessions (keep current session active)
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async revokeAllOtherSessions(
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<{ message: string; revokedCount: number }> {
    // Extract current session ID
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    const payload = await this.sessionService['jwtAuthService'].verifyAccessToken(token);
    const currentSessionId = payload.sessionId;

    if (!currentSessionId) {
      throw new Error('No session ID in token');
    }

    const result = await this.sessionService.revokeAllOtherSessions(
      user.id,
      currentSessionId,
    );

    return {
      message: 'All other sessions revoked successfully',
      revokedCount: result.revokedCount,
    };
  }
}
