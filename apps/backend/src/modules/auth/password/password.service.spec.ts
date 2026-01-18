import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';
import { JwtAuthService } from '../jwt/jwt.service';
import { User } from '../../../database/entities/user.entity';
import { Session } from '../../../database/entities/session.entity';
import { PasswordHistory } from '../../../database/entities/password-history.entity';
import { Profile } from '../../../database/entities/profile.entity';
import { UserRole } from '../../../database/entities/user-role.entity';
import { Role } from '../../../database/entities/role.entity';
import {
  createMockRepository,
  createMockCacheManager,
  mockUser,
  mockTokens,
  mockSession,
} from '../../../test-utils/test-helpers';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('PasswordService', () => {
  let service: PasswordService;
  let userRepository: ReturnType<typeof createMockRepository>;
  let sessionRepository: ReturnType<typeof createMockRepository>;
  let passwordHistoryRepository: ReturnType<typeof createMockRepository>;
  let profileRepository: ReturnType<typeof createMockRepository>;
  let userRoleRepository: ReturnType<typeof createMockRepository>;
  let roleRepository: ReturnType<typeof createMockRepository>;
  let jwtAuthService: Partial<JwtAuthService>;
  let configService: any;
  let cacheManager: any;

  beforeEach(async () => {
    userRepository = createMockRepository<User>();
    sessionRepository = createMockRepository<Session>();
    passwordHistoryRepository = createMockRepository<PasswordHistory>();
    profileRepository = createMockRepository();
    userRoleRepository = createMockRepository();
    roleRepository = createMockRepository();

    jwtAuthService = {
      generateTokenPair: jest.fn().mockResolvedValue(mockTokens),
      revokeAllUserSessions: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: any = {
          'jwt.refreshExpiration': '7d',
          'BCRYPT_ROUNDS': 10,
          'PASSWORD_HISTORY_LIMIT': 5,
          'MAX_FAILED_ATTEMPTS': 5,
          'LOCKOUT_DURATION_MINUTES': 15,
        };
        return config[key] !== undefined ? config[key] : defaultValue;
      }),
    };

    cacheManager = createMockCacheManager();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Session),
          useValue: sessionRepository,
        },
        {
          provide: getRepositoryToken(PasswordHistory),
          useValue: passwordHistoryRepository,
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: profileRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: userRoleRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
        {
          provide: JwtAuthService,
          useValue: jwtAuthService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (userRepository.create as jest.Mock).mockReturnValue({ ...mockUser, email: registerDto.email });
      (userRepository.save as jest.Mock).mockResolvedValue({ ...mockUser, id: 'new-user-id' });
      (sessionRepository.create as jest.Mock).mockReturnValue(mockSession);
      (sessionRepository.save as jest.Mock).mockResolvedValue(mockSession);
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...mockUser,
        id: 'new-user-id',
        roles: [],
      });
      (sessionRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (passwordHistoryRepository.find as jest.Mock).mockResolvedValue([]);
      (passwordHistoryRepository.create as jest.Mock).mockReturnValue({});
      (passwordHistoryRepository.save as jest.Mock).mockResolvedValue({});

      const result = await service.register(registerDto, '127.0.0.1', 'Mozilla/5.0');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register(registerDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'correct-password',
      };

      const userWithRoles = {
        ...mockUser,
        roles: [],
      };

      (userRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(userWithRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (sessionRepository.create as jest.Mock).mockReturnValue(mockSession);
      (sessionRepository.save as jest.Mock).mockResolvedValue(mockSession);
      (sessionRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (userRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.login(loginDto, '127.0.0.1', 'Mozilla/5.0');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password with correct old password', async () => {
      const changePasswordDto = {
        oldPassword: 'old-password',
        newPassword: 'NewSecurePassword123!',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      // First call: compare oldPassword with stored hash (should be true)
      // Second call: compare newPassword with stored hash (should be false - different)
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)  // oldPassword matches
        .mockResolvedValueOnce(false); // newPassword is different
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);
      (passwordHistoryRepository.find as jest.Mock).mockResolvedValue([]);
      (passwordHistoryRepository.create as jest.Mock).mockReturnValue({});
      (passwordHistoryRepository.save as jest.Mock).mockResolvedValue({});

      await expect(
        service.changePassword('user-id', changePasswordDto)
      ).resolves.not.toThrow();

      // Verify password was hashed and user was updated
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with incorrect old password', async () => {
      const changePasswordDto = {
        oldPassword: 'wrong-old-password',
        newPassword: 'NewSecurePassword123!',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-id', changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
