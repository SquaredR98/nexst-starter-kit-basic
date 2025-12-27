import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';

// Load environment variables
config({ path: join(__dirname, '../../../.env') });

// Create DataSource instance
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '../entities/**/*.entity.{ts,js}')],
  synchronize: false,
  logging: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);
    const rolePermissionRepository =
      AppDataSource.getRepository(RolePermission);

    // Check if data already exists
    const existingRoles = await roleRepository.count();
    if (existingRoles > 0) {
      console.log('Seed data already exists. Skipping...');
      await AppDataSource.destroy();
      return;
    }

    console.log('Starting seed...');

    // ==================== PERMISSIONS ====================
    console.log('Creating permissions...');

    const permissions = [
      // User permissions
      {
        resource: 'users',
        action: 'read',
        description: 'View user information',
      },
      { resource: 'users', action: 'create', description: 'Create new users' },
      {
        resource: 'users',
        action: 'update',
        description: 'Update user information',
      },
      { resource: 'users', action: 'delete', description: 'Delete users' },

      // Profile permissions
      {
        resource: 'profiles',
        action: 'read',
        description: 'View profiles',
      },
      {
        resource: 'profiles',
        action: 'update',
        description: 'Update profiles',
      },

      // Role permissions
      { resource: 'roles', action: 'read', description: 'View roles' },
      { resource: 'roles', action: 'create', description: 'Create new roles' },
      { resource: 'roles', action: 'update', description: 'Update roles' },
      { resource: 'roles', action: 'delete', description: 'Delete roles' },

      // Permission permissions
      {
        resource: 'permissions',
        action: 'read',
        description: 'View permissions',
      },
      {
        resource: 'permissions',
        action: 'manage',
        description: 'Manage permissions',
      },

      // Session permissions
      {
        resource: 'sessions',
        action: 'read',
        description: 'View sessions',
      },
      {
        resource: 'sessions',
        action: 'delete',
        description: 'Revoke sessions',
      },

      // OAuth permissions
      {
        resource: 'oauth',
        action: 'manage',
        description: 'Manage OAuth accounts',
      },

      // 2FA permissions
      {
        resource: 'two-factor',
        action: 'manage',
        description: 'Manage 2FA settings',
      },
    ];

    const createdPermissions = await permissionRepository.save(permissions);
    console.log(`Created ${createdPermissions.length} permissions`);

    // ==================== ROLES ====================
    console.log('Creating roles...');

    // Super Admin Role
    const superAdminRole = await roleRepository.save({
      name: 'super_admin',
      description:
        'Super administrator with full system access (cannot be modified)',
      priority: 100,
    });

    // Admin Role
    const adminRole = await roleRepository.save({
      name: 'admin',
      description: 'Administrator with management capabilities',
      priority: 50,
    });

    // User Role (default)
    const userRole = await roleRepository.save({
      name: 'user',
      description: 'Default user role with basic permissions',
      priority: 10,
    });

    console.log('Created 3 roles: super_admin, admin, user');

    // ==================== ROLE-PERMISSION ASSIGNMENTS ====================
    console.log('Assigning permissions to roles...');

    // Super Admin gets ALL permissions
    const superAdminPermissions = createdPermissions.map((permission) => ({
      roleId: superAdminRole.id,
      permissionId: permission.id,
    }));
    await rolePermissionRepository.save(superAdminPermissions);
    console.log(
      `Assigned ${superAdminPermissions.length} permissions to super_admin`,
    );

    // Admin gets most permissions (excluding super admin permissions)
    const adminPermissions = createdPermissions
      .filter(
        (p) =>
          !(
            p.resource === 'permissions' ||
            (p.resource === 'roles' && p.action === 'delete')
          ),
      )
      .map((permission) => ({
        roleId: adminRole.id,
        permissionId: permission.id,
      }));
    await rolePermissionRepository.save(adminPermissions);
    console.log(`Assigned ${adminPermissions.length} permissions to admin`);

    // User gets basic permissions
    const basicPermissions = createdPermissions
      .filter(
        (p) =>
          (p.resource === 'profiles' && p.action === 'read') ||
          (p.resource === 'profiles' && p.action === 'update') ||
          (p.resource === 'users' && p.action === 'read') ||
          (p.resource === 'sessions' && p.action === 'read') ||
          (p.resource === 'sessions' && p.action === 'delete') ||
          p.resource === 'oauth' ||
          p.resource === 'two-factor',
      )
      .map((permission) => ({
        roleId: userRole.id,
        permissionId: permission.id,
      }));
    await rolePermissionRepository.save(basicPermissions);
    console.log(`Assigned ${basicPermissions.length} permissions to user`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\nSummary:');
    console.log(`- Permissions: ${createdPermissions.length}`);
    console.log('- Roles: 3 (super_admin, admin, user)');
    console.log(
      `- Role-Permissions: ${superAdminPermissions.length + adminPermissions.length + basicPermissions.length}`,
    );

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
