import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Permission } from './decorators/permissions.decorator';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      return false;
    }

    return user.roles.some((userRole) => userRole.role.name === roleName);
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      return false;
    }

    return user.roles.some((userRole) =>
      roleNames.includes(userRole.role.name),
    );
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission'],
    });

    if (!user) {
      return false;
    }

    // Check all roles for the permission
    for (const userRole of user.roles) {
      const hasPermission = userRole.role.permissions?.some(
        (rolePermission) =>
          rolePermission.permission.resource === permission.resource &&
          rolePermission.permission.action === permission.action,
      );

      if (hasPermission) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(
    userId: string,
    permissions: Permission[],
  ): Promise<boolean> {
    for (const permission of permissions) {
      const hasPermission = await this.hasPermission(userId, permission);
      if (!hasPermission) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    userId: string,
    permissions: Permission[],
  ): Promise<boolean> {
    for (const permission of permissions) {
      const hasPermission = await this.hasPermission(userId, permission);
      if (hasPermission) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      return [];
    }

    return user.roles.map((userRole) => userRole.role.name);
  }

  /**
   * Get all permissions for a user (from all their roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission'],
    });

    if (!user) {
      return [];
    }

    const permissions: Permission[] = [];
    const permissionSet = new Set<string>();

    for (const userRole of user.roles) {
      for (const rolePermission of userRole.role.permissions || []) {
        const key = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
        if (!permissionSet.has(key)) {
          permissionSet.add(key);
          permissions.push({
            resource: rolePermission.permission.resource,
            action: rolePermission.permission.action,
          });
        }
      }
    }

    return permissions;
  }
}
