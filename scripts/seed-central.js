const { PrismaClient } = require('@prisma/client');

const centralDb = new PrismaClient({
  datasources: {
    centralDb: {
      url: process.env.CENTRAL_DATABASE_URL
    }
  }
});

async function seedCentralDatabase() {
  console.log('🌱 Seeding central database...');

  try {
    // Seed Countries
    console.log('📍 Seeding countries...');
    const india = await centralDb.country.upsert({
      where: { code: 'IN' },
      update: {},
      create: {
        name: 'India',
        code: 'IN',
        currency: 'INR',
        timezone: ['Asia/Kolkata'],
        isActive: true,
      },
    });

    // Seed States
    console.log('🏛️ Seeding states...');
    const states = [
      { name: 'Maharashtra', code: 'MH', gstStateCode: '27' },
      { name: 'Karnataka', code: 'KA', gstStateCode: '29' },
      { name: 'Tamil Nadu', code: 'TN', gstStateCode: '33' },
      { name: 'Delhi', code: 'DL', gstStateCode: '07' },
      { name: 'Gujarat', code: 'GJ', gstStateCode: '24' },
      { name: 'Uttar Pradesh', code: 'UP', gstStateCode: '09' },
      { name: 'West Bengal', code: 'WB', gstStateCode: '19' },
      { name: 'Telangana', code: 'TS', gstStateCode: '36' },
      { name: 'Andhra Pradesh', code: 'AP', gstStateCode: '37' },
      { name: 'Kerala', code: 'KL', gstStateCode: '32' },
    ];

    for (const stateData of states) {
      await centralDb.state.upsert({
        where: { code: stateData.code },
        update: {},
        create: {
          countryId: india.id,
          name: stateData.name,
          code: stateData.code,
          gstStateCode: stateData.gstStateCode,
          isActive: true,
        },
      });
    }

    // Seed GST Rates
    console.log('💰 Seeding GST rates...');
    const gstRates = [
      { rate: 0, description: 'Nil Rate' },
      { rate: 0.25, description: '0.25% Rate' },
      { rate: 3, description: '3% Rate' },
      { rate: 5, description: '5% Rate' },
      { rate: 12, description: '12% Rate' },
      { rate: 18, description: '18% Rate' },
      { rate: 28, description: '28% Rate' },
    ];

    for (const rateData of gstRates) {
      await centralDb.gSTRate.upsert({
        where: { rate: rateData.rate },
        update: {},
        create: {
          rate: rateData.rate,
          description: rateData.description,
          isActive: true,
        },
      });
    }

    // Seed Subscription Plans
    console.log('📦 Seeding subscription plans...');
    const plans = [
      {
        name: 'Starter',
        description: 'Perfect for small businesses',
        billingCycle: 'MONTHLY',
        pricePerMonth: 999,
        pricePerYear: 9999,
        maxUsers: 5,
        maxStateBranches: 1,
        features: {
          gst: true,
          invoicing: true,
          basicReporting: true,
          emailSupport: true,
        },
      },
      {
        name: 'Professional',
        description: 'Ideal for growing businesses',
        billingCycle: 'MONTHLY',
        pricePerMonth: 2499,
        pricePerYear: 24999,
        maxUsers: 15,
        maxStateBranches: 3,
        features: {
          gst: true,
          invoicing: true,
          advancedReporting: true,
          multiState: true,
          prioritySupport: true,
          apiAccess: true,
        },
      },
      {
        name: 'Enterprise',
        description: 'For large organizations',
        billingCycle: 'MONTHLY',
        pricePerMonth: 4999,
        pricePerYear: 49999,
        maxUsers: 50,
        maxStateBranches: 10,
        features: {
          gst: true,
          invoicing: true,
          advancedReporting: true,
          multiState: true,
          prioritySupport: true,
          apiAccess: true,
          customIntegrations: true,
          dedicatedSupport: true,
        },
      },
    ];

    for (const planData of plans) {
      await centralDb.subscriptionPlan.upsert({
        where: { name: planData.name },
        update: {},
        create: planData,
      });
    }

    // Seed Platform Configuration
    console.log('⚙️ Seeding platform configuration...');
    await centralDb.platformConfig.upsert({
      where: { key: 'default_theme' },
      update: {},
      create: {
        key: 'default_theme',
        value: {
          name: 'Default',
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          borderRadius: 'medium',
          fontFamily: 'Inter',
        },
        description: 'Default theme for new tenants',
      },
    });

    await centralDb.platformConfig.upsert({
      where: { key: 'gst_compliance' },
      update: {},
      create: {
        key: 'gst_compliance',
        value: {
          enabled: true,
          autoCalculation: true,
          returnReminders: true,
          penaltyAlerts: true,
        },
        description: 'GST compliance settings',
      },
    });

    // Create Super Admin User (if not exists)
    console.log('👑 Creating super admin user...');
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@erp-system.com';
    
    // Note: In a real implementation, you'd create this through the auth system
    // This is just for demonstration
    console.log(`Super admin email: ${superAdminEmail}`);
    console.log('Please create super admin user through the application interface');

    console.log('✅ Central database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding central database:', error);
    throw error;
  } finally {
    await centralDb.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedCentralDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCentralDatabase }; 