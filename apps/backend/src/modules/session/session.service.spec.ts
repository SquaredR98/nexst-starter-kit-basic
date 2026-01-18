import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionService } from './session.service';
import { JwtAuthService } from '../auth/jwt/jwt.service';
import { Session } from '../../database/entities/session.entity';
import {
  createMockRepository,
  mockSession,
} from '../../test-utils/test-helpers';
import { IsNull } from 'typeorm';

describe('SessionService', () => {
  let service: SessionService;
  let sessionRepository: ReturnType<typeof createMockRepository>;
  let jwtAuthService: Partial<JwtAuthService>;

  beforeEach(async () => {
    sessionRepository = createMockRepository<Session>();
    jwtAuthService = {
      revokeSession: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(Session),
          useValue: sessionRepository,
        },
        {
          provide: JwtAuthService,
          useValue: jwtAuthService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSessions', () => {
    it('should return list of user sessions with current session marked', async () => {
      const sessions = [
        { ...mockSession, id: 'session-1' },
        { ...mockSession, id: 'session-2' },
        { ...mockSession, id: 'session-3' },
      ];

      (sessionRepository.find as jest.Mock).mockResolvedValue(sessions);
      (sessionRepository.count as jest.Mock).mockResolvedValue(3);

      const result = await service.getUserSessions('user-id', 'session-2');

      expect(result.sessions).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.sessions[1].isCurrent).toBe(true);
      expect(result.sessions[0].isCurrent).toBe(false);
    });
  });

  describe('getSessionById', () => {
    it('should return session if it belongs to user', async () => {
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.getSessionById('session-123', 'user-id');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockSession.id);
    });

    it('should throw NotFoundException if session not found', async () => {
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getSessionById('non-existent', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeSession', () => {
    it('should successfully revoke a session', async () => {
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(mockSession);

      await service.revokeSession('session-123', 'user-id', 'current-session');

      expect(jwtAuthService.revokeSession).toHaveBeenCalledWith('session-123');
    });

    it('should throw ForbiddenException when trying to revoke current session', async () => {
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(mockSession);

      await expect(
        service.revokeSession('session-123', 'user-id', 'session-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if session not found', async () => {
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.revokeSession('non-existent', 'user-id', 'current-session'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeAllOtherSessions', () => {
    it('should revoke all sessions except current one', async () => {
      const sessions = [
        { ...mockSession, id: 'session-1' },
        { ...mockSession, id: 'session-2' },
        { ...mockSession, id: 'session-3' },
      ];

      (sessionRepository.find as jest.Mock).mockResolvedValue(sessions);

      const result = await service.revokeAllOtherSessions('user-id', 'session-2');

      expect(jwtAuthService.revokeSession).toHaveBeenCalledTimes(2);
      expect(jwtAuthService.revokeSession).toHaveBeenCalledWith('session-1');
      expect(jwtAuthService.revokeSession).toHaveBeenCalledWith('session-3');
      expect(result.revokedCount).toBe(2);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      const deletedSessions = [
        { ...mockSession, expiresAt: new Date(Date.now() - 1000) },
      ];

      (sessionRepository.find as jest.Mock).mockResolvedValue(deletedSessions);
      (sessionRepository.remove as jest.Mock).mockResolvedValue(deletedSessions);

      const result = await service.cleanupExpiredSessions();

      expect(result.deletedCount).toBe(1);
      expect(sessionRepository.remove).toHaveBeenCalledWith(deletedSessions);
    });
  });
});
