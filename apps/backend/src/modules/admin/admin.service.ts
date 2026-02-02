import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, IsNull, Not } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Session } from '../../database/entities/session.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { Role } from '../../database/entities/role.entity';
import { ListUsersDto, UserSortField, SortOrder } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  lockedUsers: number;
  activeSessions: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Get paginated list of users with filters
   */
  async listUsers(dto: ListUsersDto): Promise<PaginatedUsers> {
    const { page = 1, limit = 10, search, sortBy, sortOrder, role, emailVerified, isLocked } = dto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.roles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR profile.firstName LIKE :search OR profile.lastName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Role filter
    if (role) {
      queryBuilder.andWhere('role.name = :role', { role });
    }

    // Email verified filter
    if (emailVerified !== undefined) {
      if (emailVerified) {
        queryBuilder.andWhere('user.emailVerified IS NOT NULL');
      } else {
        queryBuilder.andWhere('user.emailVerified IS NULL');
      }
    }

    // Locked status filter
    if (isLocked !== undefined) {
      if (isLocked) {
        queryBuilder.andWhere('user.lockedUntil IS NOT NULL AND user.lockedUntil > :now', {
          now: new Date(),
        });
      } else {
        queryBuilder.andWhere('(user.lockedUntil IS NULL OR user.lockedUntil <= :now)', {
          now: new Date(),
        });
      }
    }

    // Sorting
    const sortField = sortBy || UserSortField.CREATED_AT;
    const order = sortOrder || SortOrder.DESC;
    queryBuilder.orderBy(`user.${sortField}`, order);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'roles', 'roles.role', 'sessions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Ban/lock a user account
   */
  async banUser(userId: string, hours: number = 24 * 365): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const lockedUntil = new Date();
    lockedUntil.setHours(lockedUntil.getHours() + hours);

    await this.userRepository.update(
      { id: userId },
      { lockedUntil },
    );

    // Revoke all sessions
    await this.sessionRepository.update(
      { userId },
      { revokedAt: new Date() },
    );

    this.logger.log(`User ${user.email} banned until ${lockedUntil.toISOString()}`);
  }

  /**
   * Unban/unlock a user account
   */
  async unbanUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(
      { id: userId },
      {
        lockedUntil: null,
        failedAttempts: 0,
      },
    );

    this.logger.log(`User ${user.email} unbanned`);
  }

  /**
   * Assign roles to a user
   */
  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify all roles exist
    const roles = await this.roleRepository.findBy({ id: In(roleIds) });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more roles not found');
    }

    // Remove existing roles
    await this.userRoleRepository.delete({ userId });

    // Assign new roles
    const userRoles = roleIds.map(roleId =>
      this.userRoleRepository.create({ userId, roleId }),
    );

    await this.userRoleRepository.save(userRoles);

    this.logger.log(`Roles updated for user ${user.email}: ${roles.map(r => r.name).join(', ')}`);
  }

  /**
   * Delete a user account permanently
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete related data (cascade should handle this, but being explicit)
    await this.userRoleRepository.delete({ userId });
    await this.sessionRepository.delete({ userId });
    await this.profileRepository.delete({ userId });
    await this.userRepository.delete({ id: userId });

    this.logger.log(`User ${user.email} permanently deleted`);
  }

  /**
   * Get all active sessions across all users
   */
  async getAllActiveSessions(): Promise<Session[]> {
    return this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('session.revokedAt IS NULL')
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .orderBy('session.lastActiveAt', 'DESC')
      .getMany();
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionRepository.update(
      { id: sessionId },
      { revokedAt: new Date() },
    );

    this.logger.log(`Session ${sessionId} revoked by admin`);
  }

  /**
   * Get admin dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      lockedUsers,
      activeSessions,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { emailVerified: Not(IsNull()) } }),
      this.userRepository.count({ where: { emailVerified: IsNull() } }),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.lockedUntil IS NOT NULL')
        .andWhere('user.lockedUntil > :now', { now })
        .getCount(),
      this.sessionRepository
        .createQueryBuilder('session')
        .where('session.revokedAt IS NULL')
        .andWhere('session.expiresAt > :now', { now })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :today', { today })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :weekAgo', { weekAgo })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :monthAgo', { monthAgo })
        .getCount(),
    ]);

    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      lockedUsers,
      activeSessions,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    };
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }
}
