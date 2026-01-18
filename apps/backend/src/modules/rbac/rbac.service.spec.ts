import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RbacService } from './rbac.service';
import { User } from '../../database/entities/user.entity';
import {
  createMockRepository,
  mockUser,
  mockRole,
  mockPermission,
} from '../../test-utils/test-helpers';

describe('RbacService', () => {
  let service: RbacService;
  let userRepository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    userRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hasRole', () => {
    it('should return true if user has the role', async () => {
      const userWithRole = {
        ...mockUser,
        roles: [
          {
            role: { ...mockRole, name: 'admin' },
          },
        ],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithRole);

      const result = await service.hasRole('user-id', 'admin');

      expect(result).toBe(true);
    });

    it('should return false if user does not have the role', async () => {
      const userWithRole = {
        ...mockUser,
        roles: [
          {
            role: { ...mockRole, name: 'user' },
          },
        ],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithRole);

      const result = await service.hasRole('user-id', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any of the specified roles', async () => {
      const userWithRole = {
        ...mockUser,
        roles: [
          {
            role: { ...mockRole, name: 'user' },
          },
        ],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithRole);

      const result = await service.hasAnyRole('user-id', ['admin', 'user', 'moderator']);

      expect(result).toBe(true);
    });

    it('should return false if user has none of the specified roles', async () => {
      const userWithRole = {
        ...mockUser,
        roles: [
          {
            role: { ...mockRole, name: 'user' },
          },
        ],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithRole);

      const result = await service.hasAnyRole('user-id', ['admin', 'moderator']);

      expect(result).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has the permission', async () => {
      const userWithPermission = {
        ...mockUser,
        roles: [
          {
            role: {
              ...mockRole,
              permissions: [
                {
                  permission: { ...mockPermission, resource: 'users', action: 'read' },
                },
              ],
            },
          },
        ],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithPermission);

      const result = await service.hasPermission('user-id', { resource: 'users', action: 'read' });

      expect(result).toBe(true);
    });

    it('should return false if user does not have the permission', async () => {
      const userWithPermission = {
        ...mockUser,
        roles: [
          {
            role: {
              ...mockRole,
              permissions: [
                {
                  permission: { ...mockPermission, resource: 'users', action: 'read' },
                },
              ],
            },
          },
        ],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithPermission);

      const result = await service.hasPermission('user-id', { resource: 'users', action: 'delete' });

      expect(result).toBe(false);
    });
  });

  describe('getUserRoles', () => {
    it('should return array of user role names', async () => {
      const userWithRoles = {
        ...mockUser,
        roles: [
          { role: { ...mockRole, name: 'user' } },
          { role: { ...mockRole, name: 'admin' } },
        ],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithRoles);

      const result = await service.getUserRoles('user-id');

      expect(result).toEqual(['user', 'admin']);
    });

    it('should return empty array if user has no roles', async () => {
      const userWithNoRoles = {
        ...mockUser,
        roles: [],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithNoRoles);

      const result = await service.getUserRoles('user-id');

      expect(result).toEqual([]);
    });
  });

  describe('getUserPermissions', () => {
    it('should return unique permissions from all roles', async () => {
      const userWithPermissions = {
        ...mockUser,
        roles: [
          {
            role: {
              ...mockRole,
              permissions: [
                {
                  permission: { resource: 'users', action: 'read' },
                },
                {
                  permission: { resource: 'users', action: 'create' },
                },
              ],
            },
          },
        ],
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithPermissions);

      const result = await service.getUserPermissions('user-id');

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ resource: 'users', action: 'read' });
      expect(result).toContainEqual({ resource: 'users', action: 'create' });
    });
  });
});
