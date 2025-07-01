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
    // Example: fetch all platform theme configs
    const themes = await centralDb.platformConfig.findMany({
      where: { key: { contains: 'theme' } },
      select: {
        key: true,
        value: true,
        description: true,
      },
    });

    // Map to dashboard format
    const result = themes.map((theme: any, idx: number) => ({
      id: theme.key,
      name: theme.value?.name || theme.key,
      category: theme.value?.category || 'General',
      isDefault: theme.key === 'default_theme',
      isActive: true, // TODO: add active/inactive logic
      usageCount: 0, // TODO: calculate usage count
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch themes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 