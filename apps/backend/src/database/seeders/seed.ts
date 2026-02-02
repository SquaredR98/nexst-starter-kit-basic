import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../../../.env') });

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'auth_user',
    password: process.env.DB_PASSWORD || 'secure_password',
    database: process.env.DB_DATABASE || 'auth_db',
    entities: [join(__dirname, '../entities/**/*.entity{.ts,.js}')],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Start transaction
    await queryRunner.startTransaction();

    try {
      // 1. Create Roles
      console.log('Creating roles...');

      const superAdminRole = await queryRunner.manager.query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = $2
         RETURNING id`,
        ['super_admin', 'Super administrator with all permissions']
      );

      const adminRole = await queryRunner.manager.query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = $2
         RETURNING id`,
        ['admin', 'System administrator with admin permissions']
      );

      const userRole = await queryRunner.manager.query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = $2
         RETURNING id`,
        ['user', 'Standard user with basic permissions']
      );

      const moderatorRole = await queryRunner.manager.query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = $2
         RETURNING id`,
        ['moderator', 'Moderator with limited admin permissions']
      );

      const superAdminRoleId = superAdminRole[0].id;
      const adminRoleId = adminRole[0].id;
      const userRoleId = userRole[0].id;
      const moderatorRoleId = moderatorRole[0].id;

      console.log('✓ Roles created');

      // 2. Create Permissions
      console.log('Creating permissions...');

      const permissions = [
        // Admin permissions
        { resource: 'admin', action: 'read', description: 'View admin panel and statistics' },
        { resource: 'admin', action: 'write', description: 'Manage users and perform admin actions' },
        { resource: 'admin', action: 'delete', description: 'Delete users and critical data' },

        // User permissions
        { resource: 'user', action: 'read', description: 'View own user profile' },
        { resource: 'user', action: 'write', description: 'Update own user profile' },

        // Session permissions
        { resource: 'session', action: 'manage', description: 'Manage own sessions' },
      ];

      const permissionIds: Record<string, string> = {};

      for (const perm of permissions) {
        const result = await queryRunner.manager.query(
          `INSERT INTO permissions (resource, action, description)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [perm.resource, perm.action, perm.description]
        );

        // If conflict occurred, fetch the existing permission
        if (result.length === 0) {
          const existing = await queryRunner.manager.query(
            `SELECT id FROM permissions WHERE resource = $1 AND action = $2`,
            [perm.resource, perm.action]
          );
          permissionIds[`${perm.resource}:${perm.action}`] = existing[0].id;
        } else {
          permissionIds[`${perm.resource}:${perm.action}`] = result[0].id;
        }
      }

      console.log('✓ Permissions created');

      // 3. Assign Permissions to Roles
      console.log('Assigning permissions to roles...');

      // Super Admin gets all permissions
      for (const permName of Object.keys(permissionIds)) {
        await queryRunner.manager.query(
          `INSERT INTO "role-permissions" (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [superAdminRoleId, permissionIds[permName]]
        );
      }

      // Admin gets all permissions
      for (const permName of Object.keys(permissionIds)) {
        await queryRunner.manager.query(
          `INSERT INTO "role-permissions" (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [adminRoleId, permissionIds[permName]]
        );
      }

      // Moderator gets read and write admin permissions (not delete)
      await queryRunner.manager.query(
        `INSERT INTO "role-permissions" (role_id, permission_id)
         VALUES ($1, $2), ($1, $3), ($1, $4), ($1, $5), ($1, $6)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [
          moderatorRoleId,
          permissionIds['admin:read'],
          permissionIds['admin:write'],
          permissionIds['user:read'],
          permissionIds['user:write'],
          permissionIds['session:manage'],
        ]
      );

      // User gets basic permissions
      await queryRunner.manager.query(
        `INSERT INTO "role-permissions" (role_id, permission_id)
         VALUES ($1, $2), ($1, $3), ($1, $4)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [
          userRoleId,
          permissionIds['user:read'],
          permissionIds['user:write'],
          permissionIds['session:manage'],
        ]
      );

      console.log('✓ Permissions assigned to roles');

      // 4. Create Super Admin User
      console.log('Creating super admin user...');

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@nexst.dev';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
      const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Super';
      const adminLastName = process.env.ADMIN_LAST_NAME || 'Admin';

      // Check if admin exists
      const existingAdmin = await queryRunner.manager.query(
        `SELECT id FROM users WHERE email = $1`,
        [adminEmail]
      );

      let adminUserId: string;

      if (existingAdmin.length > 0) {
        adminUserId = existingAdmin[0].id;
        console.log('⚠ Admin user already exists, skipping creation');
      } else {
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        const adminUser = await queryRunner.manager.query(
          `INSERT INTO users (email, password_hash, email_verified)
           VALUES ($1, $2, NOW())
           RETURNING id`,
          [adminEmail, passwordHash]
        );

        adminUserId = adminUser[0].id;

        // Create admin profile
        await queryRunner.manager.query(
          `INSERT INTO profiles (user_id, first_name, last_name)
           VALUES ($1, $2, $3)`,
          [adminUserId, adminFirstName, adminLastName]
        );

        console.log('✓ Super admin user created');
      }

      // 5. Assign Super Admin Role to Super Admin User
      await queryRunner.manager.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [adminUserId, superAdminRoleId]
      );

      console.log('✓ Super admin role assigned to super admin user');

      // Commit transaction
      await queryRunner.commitTransaction();

      console.log('\n========================================');
      console.log('✅ Database seeded successfully!');
      console.log('========================================');
      console.log('\nSuper Admin Credentials:');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log('\n⚠️  IMPORTANT: Change the password after first login!');
      console.log('========================================\n');

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error during seeding:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

seed();
