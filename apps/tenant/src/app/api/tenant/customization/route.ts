/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TenantDatabaseManager } from '@/lib/database/connection-manager';
import { TenantCustomization, BrandingConfig, DashboardConfig, CustomFieldConfig, WorkflowConfig, UserPreferences } from '@/types/theme';

interface CustomizationData {
  branding: BrandingConfig;
  dashboard: DashboardConfig;
  customFields: CustomFieldConfig;
  workflows: WorkflowConfig;
  preferences: UserPreferences;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantDb = await TenantDatabaseManager.getConnection(session.user.organizationId);
    
    // Get the active customization for the organization
    const customization = await tenantDb.tenantCustomization.findFirst({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!customization) {
      // Return default customization if none exists
      const defaultCustomization = {
        id: 'default',
        organizationId: session.user.organizationId,
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#64748B',
          accentColor: '#F59E0B',
          fontFamily: 'Inter',
          theme: 'light',
        },
        dashboard: {
          layout: 'grid',
          widgets: [],
          defaultView: 'dashboard',
          quickActions: [],
          showWelcomeCard: true,
          showRecentActivity: true,
          compactMode: false,
        },
        customFields: {
          customers: [],
          products: [],
          transactions: [],
          suppliers: [],
        },
        workflows: {
          approvals: [],
          notifications: [],
          automations: [],
        },
        preferences: {
          dateFormat: 'DD/MM/YYYY',
          numberFormat: {
            decimalSeparator: '.',
            thousandsSeparator: ',',
            currencyPosition: 'before',
            negativeFormat: 'minus',
          },
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          language: 'en',
          theme: 'light',
          compactMode: false,
          showAnimations: true,
        },
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json(defaultCustomization);
    }

    return NextResponse.json(customization);
  } catch (error) {
    console.error('Error fetching customization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customization' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customizationData = await request.json();
    const tenantDb = await TenantDatabaseManager.getConnection(session.user.organizationId);

    // Check if customization already exists
    const existingCustomization = await tenantDb.tenantCustomization.findFirst({
      where: {
        organizationId: session.user.organizationId,
      },
    });

    let savedCustomization;

    if (existingCustomization) {
      // Update existing customization
      savedCustomization = await tenantDb.tenantCustomization.update({
        where: { id: existingCustomization.id },
        data: {
          branding: customizationData.branding,
          dashboard: customizationData.dashboard,
          customFields: customizationData.customFields,
          workflows: customizationData.workflows,
          preferences: customizationData.preferences,
          version: (customizationData.version || existingCustomization.version) + 1,
          updatedBy: session.user.id,
        },
      });
    } else {
      // Create new customization
      savedCustomization = await tenantDb.tenantCustomization.create({
        data: {
          organizationId: session.user.organizationId,
          branding: customizationData.branding,
          dashboard: customizationData.dashboard,
          customFields: customizationData.customFields,
          workflows: customizationData.workflows,
          preferences: customizationData.preferences,
          version: 1,
          isActive: true,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      });
    }

    return NextResponse.json(savedCustomization);
  } catch (error) {
    console.error('Error updating customization:', error);
    return NextResponse.json(
      { error: 'Failed to update customization' },
      { status: 500 }
    );
  }
} 