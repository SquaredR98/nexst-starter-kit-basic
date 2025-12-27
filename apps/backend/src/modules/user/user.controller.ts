import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CurrentUser } from '../auth/jwt/decorators/current-user.decorator';
import { Roles } from '../rbac/decorators/roles.decorator';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UserResponseDto,
  UserListResponseDto,
} from './dto/user-response.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current user's profile
   */
  @Get('me')
  async getCurrentUser(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.userService.getCurrentUser(user.id);
  }

  /**
   * Update current user's profile
   */
  @Patch('me')
  async updateCurrentUser(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateOwnProfile(user.id, updateProfileDto);
  }

  /**
   * Delete current user's account
   */
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteCurrentUser(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.userService.deleteUser(user.id, user.id, false);
    return { message: 'Account deleted successfully' };
  }

  /**
   * List all users (admin only)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async listUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ): Promise<UserListResponseDto> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.userService.listUsers(pageNum, limitNum);
  }

  /**
   * Get user by ID (admin only)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getUserById(@Param('id') userId: string): Promise<UserResponseDto> {
    return this.userService.getUserById(userId);
  }

  /**
   * Update user profile (admin only)
   */
  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('users:update')
  async updateUserProfile(
    @Param('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUserProfile(userId, updateProfileDto);
  }

  /**
   * Delete user (admin only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<{ message: string }> {
    // Check if current user has admin role
    const isAdmin = currentUser.roles.some(
      (userRole) =>
        userRole.role.name === 'admin' ||
        userRole.role.name === 'super_admin',
    );

    await this.userService.deleteUser(userId, currentUser.id, isAdmin);
    return { message: 'User deleted successfully' };
  }
}
