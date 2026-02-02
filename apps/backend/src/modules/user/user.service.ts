import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UserResponseDto,
  ProfileResponseDto,
  UserListResponseDto,
} from './dto/user-response.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  /**
   * Get current user's profile
   */
  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'profile',
        'roles',
        'roles.role',
        'roles.role.permissions',
        'roles.role.permissions.permission',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserResponse(user);
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'profile',
        'roles',
        'roles.role',
        'roles.role.permissions',
        'roles.role.permissions.permission',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserResponse(user);
  }

  /**
   * List all users (admin only)
   */
  async listUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<UserListResponseDto> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      relations: [
        'profile',
        'roles',
        'roles.role',
        'roles.role.permissions',
        'roles.role.permissions.permission',
      ],
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      users: users.map((user) => this.mapToUserResponse(user)),
      total,
      page,
      limit,
    };
  }

  /**
   * Update user's own profile
   */
  async updateOwnProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update or create profile
    if (user.profile) {
      await this.profileRepository.update(
        { userId },
        {
          firstName: updateProfileDto.firstName ?? user.profile.firstName,
          lastName: updateProfileDto.lastName ?? user.profile.lastName,
          avatarUrl: updateProfileDto.avatarUrl ?? user.profile.avatarUrl,
          phone: updateProfileDto.phone ?? user.profile.phone,
        },
      );
    } else {
      const profile = this.profileRepository.create({
        userId,
        firstName: updateProfileDto.firstName || null,
        lastName: updateProfileDto.lastName || null,
        avatarUrl: updateProfileDto.avatarUrl || null,
        phone: updateProfileDto.phone || null,
      });
      await this.profileRepository.save(profile);
    }

    this.logger.log(`Profile updated for user: ${userId}`);

    return this.getCurrentUser(userId);
  }

  /**
   * Update any user's profile (admin only)
   */
  async updateUserProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.updateOwnProfile(userId, updateProfileDto);
  }

  /**
   * Delete user account (admin only or self-deletion)
   */
  async deleteUser(
    userId: string,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is trying to delete themselves (allowed)
    const isSelfDeletion = userId === requestingUserId;

    // Check if trying to delete a super_admin
    const isSuperAdmin = user.roles.some(
      (userRole) => userRole.role.name === 'super_admin',
    );

    if (isSuperAdmin && !isSelfDeletion) {
      throw new ForbiddenException('Cannot delete super admin accounts');
    }

    // Non-admins can only delete their own account
    if (!isAdmin && !isSelfDeletion) {
      throw new ForbiddenException('You can only delete your own account');
    }

    await this.userRepository.remove(user);

    this.logger.log(`User deleted: ${userId}`);
  }

  /**
   * Map User entity to UserResponseDto
   */
  private mapToUserResponse(user: User): UserResponseDto {
    const profile: ProfileResponseDto | null = user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          avatarUrl: user.profile.avatarUrl,
          phone: user.profile.phone,
          phoneVerified: user.profile.phoneVerified,
        }
      : null;

    const roles = user.roles?.map((userRole) => ({
      role: {
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description ?? null,
        permissions: userRole.role.permissions?.map((rolePermission) => ({
          permission: {
            id: rolePermission.permission.id,
            resource: rolePermission.permission.resource,
            action: rolePermission.permission.action,
            description: rolePermission.permission.description ?? null,
          },
        })) || [],
      },
    })) || [];

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      profile,
      roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
