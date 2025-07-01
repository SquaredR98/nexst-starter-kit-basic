import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CentralDatabaseManager } from '@/lib/database/connection-manager';
import { TenantMigrationManager } from '@/lib/database/migration-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = params;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const centralDb = CentralDatabaseManager.getInstance();
    const migrationManager = new TenantMigrationManager('./backups', centralDb);

    // Get tenant details
    const tenant = await centralDb.platformTenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        companyName: true,
        slug: true,
        databaseConfig: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Extract database configuration
    const dbConfig = tenant.databaseConfig as any;
    const databaseUrl = dbConfig?.url || process.env.TENANT_DATABASE_URL?.replace('tenant_db', tenant.slug);

    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'Database URL not configured for tenant' },
        { status: 400 }
      );
    }

    const config = {
      tenantId: tenant.id,
      databaseUrl,
      schemaPath: './prisma/schemas/tenant.prisma',
      backupDir: './backups',
      migrationType: 'rollback' as const,
    };

    const result = await migrationManager.rollbackTenantDatabase(config);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Rollback failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 