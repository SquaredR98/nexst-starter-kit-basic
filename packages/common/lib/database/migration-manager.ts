import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { TenantPrismaClient } from './clients';
import { TenantDatabaseManager } from './connection-manager';

const execAsync = promisify(exec);

export interface MigrationConfig {
  tenantId: string;
  databaseUrl: string;
  schemaPath: string;
  backupDir: string;
  migrationType: 'create' | 'update' | 'rollback';
  version?: string;
}

export interface MigrationResult {
  success: boolean;
  tenantId: string;
  migrationId: string;
  backupPath?: string;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface MigrationStatus {
  tenantId: string;
  currentVersion: string;
  pendingMigrations: string[];
  lastMigration?: Date;
  status: 'up_to_date' | 'pending' | 'failed' | 'migrating';
  databaseStatus: 'connected' | 'disconnected' | 'error';
}

export class TenantMigrationManager {
  private backupDir: string;
  private centralDb: PrismaClient;

  constructor(backupDir: string = './backups', centralDb: PrismaClient) {
    this.backupDir = backupDir;
    this.centralDb = centralDb;
  }

  /**
   * Create a new tenant database with initial migration
   */
  async createTenantDatabase(config: MigrationConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    const migrationId = this.generateMigrationId(config.tenantId, 'create');

    try {
      // 1. Create backup directory if it doesn't exist
      await this.ensureBackupDirectory();

      // 2. Create the database
      await this.createDatabase(config.databaseUrl);

      // 3. Run initial migration
      await this.runMigration(config, migrationId);

      // 4. Create initial backup
      const backupPath = await this.createBackup(config, migrationId);

      // 5. Record migration in central database
      await this.recordMigration({
        tenantId: config.tenantId,
        migrationId,
        type: 'create',
        status: 'success',
        backupPath,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        tenantId: config.tenantId,
        migrationId,
        backupPath,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

    } catch (error) {
      // 6. Cleanup on failure
      await this.cleanupFailedMigration(config, migrationId);

      // 7. Record failed migration
      await this.recordMigration({
        tenantId: config.tenantId,
        migrationId,
        type: 'create',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        tenantId: config.tenantId,
        migrationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update tenant database schema
   */
  async updateTenantDatabase(config: MigrationConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    const migrationId = this.generateMigrationId(config.tenantId, 'update');

    try {
      // 1. Create backup before migration
      const backupPath = await this.createBackup(config, migrationId);

      // 2. Run migration
      await this.runMigration(config, migrationId);

      // 3. Record successful migration
      await this.recordMigration({
        tenantId: config.tenantId,
        migrationId,
        type: 'update',
        status: 'success',
        backupPath,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        tenantId: config.tenantId,
        migrationId,
        backupPath,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

    } catch (error) {
      // 4. Rollback on failure
      await this.rollbackMigration(config, backupPath);

      // 5. Record failed migration
      await this.recordMigration({
        tenantId: config.tenantId,
        migrationId,
        type: 'update',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        tenantId: config.tenantId,
        migrationId,
        backupPath,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Rollback tenant database to previous version
   */
  async rollbackTenantDatabase(config: MigrationConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    const migrationId = this.generateMigrationId(config.tenantId, 'rollback');

    try {
      // 1. Find the latest backup
      const latestBackup = await this.findLatestBackup(config.tenantId);
      if (!latestBackup) {
        throw new Error('No backup found for rollback');
      }

      // 2. Restore from backup
      await this.restoreFromBackup(config.databaseUrl, latestBackup);

      // 3. Record rollback
      await this.recordMigration({
        tenantId: config.tenantId,
        migrationId,
        type: 'rollback',
        status: 'success',
        backupPath: latestBackup,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        tenantId: config.tenantId,
        migrationId,
        backupPath: latestBackup,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

    } catch (error) {
      await this.recordMigration({
        tenantId: config.tenantId,
        migrationId,
        type: 'rollback',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        tenantId: config.tenantId,
        migrationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get migration status for all tenants
   */
  async getMigrationStatus(): Promise<MigrationStatus[]> {
    const tenants = await this.centralDb.platformTenant.findMany({
      include: {
        migrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return tenants.map(tenant => ({
      tenantId: tenant.id,
      currentVersion: tenant.migrations[0]?.version || '0.0.0',
      pendingMigrations: [], // TODO: Implement pending migration detection
      lastMigration: tenant.migrations[0]?.createdAt,
      status: this.determineMigrationStatus(tenant.migrations[0]),
      databaseStatus: 'connected',
    }));
  }

  /**
   * Bulk migration for all tenants
   */
  async bulkMigrateTenants(schemaPath: string): Promise<MigrationResult[]> {
    const tenants = await this.centralDb.platformTenant.findMany({
      where: { isActive: true },
    });

    const results: MigrationResult[] = [];

    for (const tenant of tenants) {
      const config: MigrationConfig = {
        tenantId: tenant.id,
        databaseUrl: await this.getTenantDatabaseUrl(tenant.id),
        schemaPath,
        backupDir: this.backupDir,
        migrationType: 'update',
      };

      const result = await this.updateTenantDatabase(config);
      results.push(result);

      // Add delay between migrations to avoid overwhelming the system
      await this.delay(1000);
    }

    return results;
  }

  // Private helper methods

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  private async createDatabase(databaseUrl: string): Promise<void> {
    // Extract database name from URL
    const dbName = this.extractDatabaseName(databaseUrl);
    const baseUrl = this.getBaseDatabaseUrl(databaseUrl);

    // Create database using psql
    const createDbCommand = `psql "${baseUrl}" -c "CREATE DATABASE ${dbName};"`;
    await execAsync(createDbCommand);
  }

  private async runMigration(config: MigrationConfig, migrationId: string): Promise<void> {
    const { stdout, stderr } = await execAsync(
      `npx prisma migrate deploy --schema=${config.schemaPath} --preview-feature`,
      {
        env: {
          ...process.env,
          DATABASE_URL: config.databaseUrl,
        },
      }
    );

    if (stderr && !stderr.includes('warning')) {
      throw new Error(`Migration failed: ${stderr}`);
    }
  }

  private async createBackup(config: MigrationConfig, migrationId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${config.tenantId}_${migrationId}_${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, backupFileName);

    // Create backup using pg_dump
    const backupCommand = `pg_dump "${config.databaseUrl}" > "${backupPath}"`;
    await execAsync(backupCommand);

    return backupPath;
  }

  private async restoreFromBackup(databaseUrl: string, backupPath: string): Promise<void> {
    // Drop and recreate database
    const dbName = this.extractDatabaseName(databaseUrl);
    const baseUrl = this.getBaseDatabaseUrl(databaseUrl);

    // Drop database
    await execAsync(`psql "${baseUrl}" -c "DROP DATABASE IF EXISTS ${dbName};"`);
    
    // Create database
    await execAsync(`psql "${baseUrl}" -c "CREATE DATABASE ${dbName};"`);
    
    // Restore from backup
    await execAsync(`psql "${databaseUrl}" < "${backupPath}"`);
  }

  private async findLatestBackup(tenantId: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.backupDir);
      const tenantBackups = files
        .filter(file => file.startsWith(`${tenantId}_`))
        .sort()
        .reverse();

      return tenantBackups.length > 0 ? path.join(this.backupDir, tenantBackups[0]) : null;
    } catch {
      return null;
    }
  }

  private async cleanupFailedMigration(config: MigrationConfig, migrationId: string): Promise<void> {
    try {
      // Drop the database if it was created
      const dbName = this.extractDatabaseName(config.databaseUrl);
      const baseUrl = this.getBaseDatabaseUrl(config.databaseUrl);
      await execAsync(`psql "${baseUrl}" -c "DROP DATABASE IF EXISTS ${dbName};"`);
    } catch (error) {
      console.error('Failed to cleanup database:', error);
    }
  }

  private async recordMigration(data: {
    tenantId: string;
    migrationId: string;
    type: string;
    status: string;
    backupPath?: string;
    error?: string;
    duration: number;
  }): Promise<void> {
    await this.centralDb.tenantMigration.create({
      data: {
        tenantId: data.tenantId,
        migrationId: data.migrationId,
        migrationType: data.type,
        status: data.status,
        backupPath: data.backupPath,
        errorMessage: data.error,
        duration: data.duration,
        version: '1.0.0', // TODO: Get from schema
      },
    });
  }

  private async getTenantDatabaseUrl(tenantId: string): Promise<string> {
    const tenant = await this.centralDb.platformTenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // TODO: Decrypt database credentials
    return tenant.databaseUrl;
  }

  private generateMigrationId(tenantId: string, type: string): string {
    const timestamp = Date.now();
    const hash = createHash('md5').update(`${tenantId}_${type}_${timestamp}`).digest('hex');
    return `${type}_${timestamp}_${hash.substring(0, 8)}`;
  }

  private extractDatabaseName(databaseUrl: string): string {
    const match = databaseUrl.match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    return match ? match[5] : 'unknown';
  }

  private getBaseDatabaseUrl(databaseUrl: string): string {
    return databaseUrl.replace(/\/[^\/]+$/, '/postgres');
  }

  private determineMigrationStatus(lastMigration: any): 'up_to_date' | 'pending' | 'failed' | 'migrating' {
    if (!lastMigration) return 'pending';
    if (lastMigration.status === 'failed') return 'failed';
    return 'up_to_date';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 