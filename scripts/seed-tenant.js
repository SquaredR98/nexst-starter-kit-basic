const { PrismaClient } = require('@prisma/client');

async function seedTenantDatabase(databaseUrl) {
  console.log('🌱 Seeding tenant database...');

  const tenantDb = new PrismaClient({
    datasources: {
      tenantDb: {
        url: databaseUrl
      }
    }
  });

  try {
    // Seed GST Configuration
    console.log('💰 Seeding GST configuration...');
    await tenantDb.gSTConfiguration.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        businessName: 'Sample Business',
        gstNumber: '27AABCS1234Z1Z5',
        panNumber: 'AABCS1234Z',
        businessType: 'PROPRIETORSHIP',
        address: {
          street: '123 Business Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        contactInfo: {
          email: 'contact@samplebusiness.com',
          phone: '+91-9876543210',
        },
        gstSettings: {
          compositionScheme: false,
          reverseCharge: false,
          eInvoice: true,
          qrCode: true,
        },
        isActive: true,
      },
    });

    // Seed Product Categories
    console.log('📦 Seeding product categories...');
    const categories = [
      { name: 'Electronics', description: 'Electronic goods and gadgets' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Food & Beverages', description: 'Food products and beverages' },
      { name: 'Services', description: 'Professional services' },
      { name: 'Raw Materials', description: 'Industrial raw materials' },
    ];

    for (const categoryData of categories) {
      await tenantDb.productCategory.upsert({
        where: { name: categoryData.name },
        update: {},
        create: categoryData,
      });
    }

    // Seed Sample Products
    console.log('🛍️ Seeding sample products...');
    const products = [
      {
        name: 'Laptop Computer',
        description: 'High-performance laptop for business use',
        sku: 'LAP001',
        categoryId: 'Electronics',
        hsnCode: '8471',
        gstRate: 18,
        unitPrice: 45000,
        unit: 'Piece',
        isActive: true,
      },
      {
        name: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt',
        sku: 'TSH001',
        categoryId: 'Clothing',
        hsnCode: '6104',
        gstRate: 5,
        unitPrice: 500,
        unit: 'Piece',
        isActive: true,
      },
      {
        name: 'Consulting Service',
        description: 'Professional business consulting',
        sku: 'CON001',
        categoryId: 'Services',
        hsnCode: '9983',
        gstRate: 18,
        unitPrice: 5000,
        unit: 'Hour',
        isActive: true,
      },
    ];

    for (const productData of products) {
      await tenantDb.product.upsert({
        where: { sku: productData.sku },
        update: {},
        create: productData,
      });
    }

    // Seed Sample Customers
    console.log('👥 Seeding sample customers...');
    const customers = [
      {
        name: 'ABC Corporation',
        email: 'accounts@abccorp.com',
        phone: '+91-9876543211',
        gstNumber: '27AABCC1234Z1Z6',
        address: {
          street: '456 Corporate Avenue',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India',
        },
        customerType: 'BUSINESS',
        isActive: true,
      },
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+91-9876543212',
        address: {
          street: '789 Residential Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002',
          country: 'India',
        },
        customerType: 'INDIVIDUAL',
        isActive: true,
      },
    ];

    for (const customerData of customers) {
      await tenantDb.customer.upsert({
        where: { email: customerData.email },
        update: {},
        create: customerData,
      });
    }

    // Seed Sample Suppliers
    console.log('🏭 Seeding sample suppliers...');
    const suppliers = [
      {
        name: 'XYZ Suppliers Ltd',
        email: 'purchase@xyzsuppliers.com',
        phone: '+91-9876543213',
        gstNumber: '27AABCS5678Z1Z7',
        address: {
          street: '321 Supplier Street',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India',
        },
        isActive: true,
      },
    ];

    for (const supplierData of suppliers) {
      await tenantDb.supplier.upsert({
        where: { email: supplierData.email },
        update: {},
        create: supplierData,
      });
    }

    // Seed Sample Invoices
    console.log('🧾 Seeding sample invoices...');
    const invoices = [
      {
        invoiceNumber: 'INV-2024-001',
        customerId: 'accounts@abccorp.com',
        invoiceDate: new Date('2024-01-15'),
        dueDate: new Date('2024-01-30'),
        subtotal: 45000,
        gstAmount: 8100,
        totalAmount: 53100,
        status: 'PAID',
        paymentTerms: 'Net 15',
        notes: 'Thank you for your business!',
      },
      {
        invoiceNumber: 'INV-2024-002',
        customerId: 'john.doe@email.com',
        invoiceDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-04'),
        subtotal: 500,
        gstAmount: 25,
        totalAmount: 525,
        status: 'PENDING',
        paymentTerms: 'Net 15',
        notes: 'Please pay within due date.',
      },
    ];

    for (const invoiceData of invoices) {
      await tenantDb.invoice.upsert({
        where: { invoiceNumber: invoiceData.invoiceNumber },
        update: {},
        create: invoiceData,
      });
    }

    // Seed Sample Purchase Orders
    console.log('📋 Seeding sample purchase orders...');
    const purchaseOrders = [
      {
        poNumber: 'PO-2024-001',
        supplierId: 'purchase@xyzsuppliers.com',
        orderDate: new Date('2024-01-10'),
        expectedDelivery: new Date('2024-01-25'),
        subtotal: 10000,
        gstAmount: 1800,
        totalAmount: 11800,
        status: 'CONFIRMED',
        notes: 'Please deliver as per specifications.',
      },
    ];

    for (const poData of purchaseOrders) {
      await tenantDb.purchaseOrder.upsert({
        where: { poNumber: poData.poNumber },
        update: {},
        create: poData,
      });
    }

    // Seed Theme Configuration
    console.log('🎨 Seeding theme configuration...');
    await tenantDb.themeConfiguration.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'Default Theme',
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderRadius: 'medium',
        fontFamily: 'Inter',
        version: '1.0.0',
        isActive: true,
      },
    });

    console.log('✅ Tenant database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding tenant database:', error);
    throw error;
  } finally {
    await tenantDb.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  const databaseUrl = process.env.TENANT_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ TENANT_DATABASE_URL environment variable is required');
    process.exit(1);
  }

  seedTenantDatabase(databaseUrl)
    .then(() => {
      console.log('🎉 Tenant seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Tenant seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTenantDatabase }; 