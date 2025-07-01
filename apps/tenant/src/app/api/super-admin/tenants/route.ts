import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CentralDatabaseManager } from '@/lib/database/connection-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const centralDb = CentralDatabaseManager.getInstance();
    const tenants = await centralDb.platformTenant.findMany({
      select: {
        id: true,
        companyName: true,
        contactEmail: true,
        isActive: true,
        createdAt: true,
        lastConnectedAt: true,
        databaseStatus: true,
        // Add more fields as needed
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to dashboard format
    const result = tenants.map((tenant: any) => ({
      id: tenant.id,
      organizationName: tenant.companyName,
      contactEmail: tenant.contactEmail,
      status: tenant.isActive ? 'active' : 'inactive',
      subscriptionPlan: 'N/A', // TODO: join with subscription
      createdAt: tenant.createdAt,
      lastLoginAt: tenant.lastConnectedAt,
      themeName: 'Default', // TODO: join with theme config
      databaseStatus: tenant.databaseStatus?.toLowerCase() || 'unknown',
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 