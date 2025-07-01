import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TenantMigrationManager } from '@/lib/database/migration-manager';
import { PRESET_THEME_CONFIGS, THEME_CUSTOMIZATION_OPTIONS } from '@/lib/theme/theme-utils';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const migrationManager = new TenantMigrationManager('./backups', prisma);

async function sendWelcomeEmail(to: string, org: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Welcome to ERP System, ${org}!`,
      text: `Your ERP workspace for ${org} is ready. Login and start managing your business!`,
      html: `<h2>Welcome to ERP System, ${org}!</h2><p>Your ERP workspace is ready. Login and start managing your business.</p>`,
    });
  } catch (e) {
    console.warn('Failed to send welcome email:', e);
  }
}

export async function POST(req: NextRequest) {
  let tenantCreated = false;
  let tenantId = '';
  try {
    const data = await req.json();
    const {
      organizationName,
      contactEmail,
      contactPhone,
      businessType,
      gstNumber,
      theme,
    } = data;

    // 0. Check for duplicate organization/email
    const existing = await prisma.platformTenant.findFirst({
      where: {
        OR: [
          { organizationName: { equals: organizationName, mode: 'insensitive' } },
          { contactEmail: { equals: contactEmail, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Organization or email already exists.' }, { status: 409 });
    }

    // 1. Create tenant in central DB
    tenantId = uuidv4();
    const dbName = `tenant_${tenantId.replace(/-/g, '').slice(0, 16)}`;
    const dbUser = process.env.TENANT_DB_USER || 'postgres';
    const dbPass = process.env.TENANT_DB_PASS || 'postgres';
    const dbHost = process.env.TENANT_DB_HOST || 'localhost';
    const dbPort = process.env.TENANT_DB_PORT || '5432';
    const tenantDbUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

    await prisma.platformTenant.create({
      data: {
        id: tenantId,
        organizationName,
        contactEmail,
        contactPhone,
        businessType,
        gstNumber,
        databaseUrl: tenantDbUrl,
        isActive: true,
      },
    });
    tenantCreated = true;

    // 2. Create tenant DB, run migration, and backup
    const migrationResult = await migrationManager.createTenantDatabase({
      tenantId,
      databaseUrl: tenantDbUrl,
      schemaPath: 'prisma/schemas/tenant.prisma',
      backupDir: './backups',
      migrationType: 'create',
    });

    if (!migrationResult.success) {
      throw new Error(migrationResult.error || 'Migration failed');
    }

    // 3. Save selected theme as JSON with versioning/inheritance
    const preset = PRESET_THEME_CONFIGS[theme.presetId];
    const colorPalette = THEME_CUSTOMIZATION_OPTIONS.colorPalettes.find(c => c.id === theme.colorPalette);
    const borderStyle = THEME_CUSTOMIZATION_OPTIONS.borderStyles.find(b => b.id === theme.borderStyle);
    const fontOption = THEME_CUSTOMIZATION_OPTIONS.fontOptions.find(f => f.id === theme.fontOption);

    const tenantTheme = {
      id: uuidv4(),
      organizationId: tenantId,
      themeName: preset.name,
      baseTheme: theme.presetId,
      colors: { ...preset.colors, ...colorPalette?.colors },
      typography: {
        ...preset.typography,
        fontFamily: {
          ...preset.typography.fontFamily,
          sans: fontOption?.fontFamily || preset.typography.fontFamily.sans,
        },
      },
      spacing: preset.spacing,
      borders: { ...preset.borders, ...borderStyle?.borders },
      isDefault: true,
      isActive: true,
      version: '1.0.0',
      parentVersion: preset.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await prisma.tenantTheme.create({
      data: tenantTheme,
    });

    // 4. Send welcome email (non-blocking)
    sendWelcomeEmail(contactEmail, organizationName);

    // 5. Return success
    return NextResponse.json({ tenantId }, { status: 200 });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    // Rollback if tenant was created but something failed after
    if (tenantCreated && tenantId) {
      await prisma.platformTenant.delete({ where: { id: tenantId } }).catch(() => {});
    }
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
} 