/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TenantDatabaseManager } from '@/lib/database/connection-manager';
import { defaultThemes, validateTheme } from '@/lib/theme/theme-utils';
import { PRESET_THEMES, ThemeColors, ThemeTypography, ThemeSpacing } from '@/types/theme';

interface ThemeData {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  customCSS?: string;
  logo?: string;
  favicon?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantDb = await TenantDatabaseManager.getConnection(session.user.organizationId);
    
    // Get the active theme for the organization
    const theme = await tenantDb.tenantTheme.findFirst({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!theme) {
      // Return default theme if none exists
      const defaultTheme = {
        id: 'default',
        organizationId: session.user.organizationId,
        ...defaultThemes[PRESET_THEMES.DEFAULT],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json(defaultTheme);
    }

    // Parse the theme data from JSON
    const themeData = theme.themeData as ThemeData;
    const themeResponse = {
      id: theme.id,
      organizationId: theme.organizationId,
      themeName: theme.themeName,
      colors: themeData.colors,
      typography: themeData.typography,
      spacing: themeData.spacing,
      customCSS: themeData.customCSS,
      logo: themeData.logo,
      favicon: themeData.favicon,
      isDefault: theme.isDefault,
      isActive: theme.isActive,
      version: theme.version,
      createdAt: theme.createdAt.toISOString(),
      updatedAt: theme.updatedAt.toISOString(),
    };

    return NextResponse.json(themeResponse);
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
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

    const themeData = await request.json();
    
    // Validate theme data
    const validationErrors = validateTheme(themeData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid theme data', details: validationErrors },
        { status: 400 }
      );
    }

    const tenantDb = await TenantDatabaseManager.getConnection(session.user.organizationId);

    // Prepare theme data for storage
    const themePayload = {
      colors: themeData.colors,
      typography: themeData.typography,
      spacing: themeData.spacing,
      customCSS: themeData.customCSS,
      logo: themeData.logo,
      favicon: themeData.favicon,
    };

    // Check if theme already exists
    const existingTheme = await tenantDb.tenantTheme.findFirst({
      where: {
        organizationId: session.user.organizationId,
        themeName: themeData.themeName,
      },
    });

    let savedTheme;

    if (existingTheme) {
      // Update existing theme
      savedTheme = await tenantDb.tenantTheme.update({
        where: { id: existingTheme.id },
        data: {
          themeData: themePayload,
          isActive: true,
          version: themeData.version || existingTheme.version,
          updatedBy: session.user.id,
        },
      });

      // Deactivate other themes for this organization
      await tenantDb.tenantTheme.updateMany({
        where: {
          organizationId: session.user.organizationId,
          id: { not: savedTheme.id },
        },
        data: { isActive: false },
      });
    } else {
      // Create new theme
      savedTheme = await tenantDb.tenantTheme.create({
        data: {
          organizationId: session.user.organizationId,
          themeName: themeData.themeName,
          themeData: themePayload,
          isDefault: false,
          isActive: true,
          version: themeData.version || '1.0.0',
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      });

      // Deactivate other themes for this organization
      await tenantDb.tenantTheme.updateMany({
        where: {
          organizationId: session.user.organizationId,
          id: { not: savedTheme.id },
        },
        data: { isActive: false },
      });
    }

    // Return the saved theme in the expected format
    const savedThemeData = savedTheme.themeData as ThemeData;
    const themeResponse = {
      id: savedTheme.id,
      organizationId: savedTheme.organizationId,
      themeName: savedTheme.themeName,
      colors: savedThemeData.colors,
      typography: savedThemeData.typography,
      spacing: savedThemeData.spacing,
      customCSS: savedThemeData.customCSS || undefined,
      logo: savedThemeData.logo || undefined,
      favicon: savedThemeData.favicon || undefined,
      isDefault: savedTheme.isDefault,
      isActive: savedTheme.isActive,
      version: savedTheme.version,
      createdAt: savedTheme.createdAt.toISOString(),
      updatedAt: savedTheme.updatedAt.toISOString(),
    };

    return NextResponse.json(themeResponse);
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    );
  }
} 