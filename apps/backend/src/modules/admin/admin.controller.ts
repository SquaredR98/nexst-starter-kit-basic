import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Permissions('admin:read')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @Permissions('admin:read')
  @HttpCode(HttpStatus.OK)
  async listUsers(@Query() dto: ListUsersDto) {
    return this.adminService.listUsers(dto);
  }

  @Get('users/:id')
  @Permissions('admin:read')
  @HttpCode(HttpStatus.OK)
  async getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Post('users/:id/ban')
  @Permissions('admin:write')
  @HttpCode(HttpStatus.OK)
  async banUser(@Param('id') userId: string, @Body('hours') hours?: number) {
    await this.adminService.banUser(userId, hours);
    return { message: 'User banned successfully' };
  }

  @Post('users/:id/unban')
  @Permissions('admin:write')
  @HttpCode(HttpStatus.OK)
  async unbanUser(@Param('id') userId: string) {
    await this.adminService.unbanUser(userId);
    return { message: 'User unbanned successfully' };
  }

  @Patch('users/:id/roles')
  @Permissions('admin:write')
  @HttpCode(HttpStatus.OK)
  async assignRoles(
    @Param('id') userId: string,
    @Body('roleIds') roleIds: string[],
  ) {
    await this.adminService.assignRoles(userId, roleIds);
    return { message: 'Roles updated successfully' };
  }

  @Delete('users/:id')
  @Permissions('admin:delete')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') userId: string) {
    await this.adminService.deleteUser(userId);
    return { message: 'User deleted successfully' };
  }

  @Get('sessions')
  @Permissions('admin:read')
  @HttpCode(HttpStatus.OK)
  async getAllActiveSessions() {
    return this.adminService.getAllActiveSessions();
  }

  @Delete('sessions/:id')
  @Permissions('admin:write')
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Param('id') sessionId: string) {
    await this.adminService.revokeSession(sessionId);
    return { message: 'Session revoked successfully' };
  }

  @Get('roles')
  @Permissions('admin:read')
  @HttpCode(HttpStatus.OK)
  async getAllRoles() {
    return this.adminService.getAllRoles();
  }
}
