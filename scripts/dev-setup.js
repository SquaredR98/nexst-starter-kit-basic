#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up ERP System development environment...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Creating from env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from env.example');
    console.log('📝 Please update the database URLs and secrets in .env file\n');
  } else {
    console.log('❌ env.example not found. Please create .env manually\n');
  }
} else {
  console.log('✅ .env file exists\n');
}

// Generate Prisma clients
console.log('🔄 Generating Prisma clients...');
try {
  console.log('  → Generating central database client...');
  execSync('npx prisma generate --schema=prisma/schemas/central.prisma', { stdio: 'inherit' });
  
  console.log('  → Generating tenant database client...');
  execSync('npx prisma generate --schema=prisma/schemas/tenant.prisma', { stdio: 'inherit' });
  
  console.log('✅ Prisma clients generated successfully\n');
} catch (error) {
  console.log('❌ Error generating Prisma clients:', error.message);
  console.log('💡 Make sure your database URLs are correctly set in .env\n');
}

// Check if node_modules exists
if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.log('❌ Error installing dependencies:', error.message);
  }
} else {
  console.log('✅ Dependencies already installed\n');
}

// Verify key files exist
const keyFiles = [
  'src/lib/theme/theme-utils.ts',
  'src/providers/ThemeProvider.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/Card.tsx',
  'src/components/ui/Input.tsx',
  'src/app/globals.css'
];

console.log('🔍 Verifying theme system files...');
let allFilesExist = true;

keyFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('✅ All theme system files are present\n');
} else {
  console.log('❌ Some theme system files are missing. Please check the setup.\n');
}

console.log('🎉 Development environment setup complete!');
console.log('\n📋 Next steps:');
console.log('  1. Update database URLs in .env file');
console.log('  2. Run "npm run dev" to start the development server');
console.log('  3. Visit http://localhost:3000/theme-demo to test the theme system');
console.log('\n💡 Available scripts:');
console.log('  • npm run dev              - Start development server');
console.log('  • npm run dev:clean        - Clean start with CSS rebuild');
console.log('  • npm run db:generate      - Generate both Prisma clients');
console.log('  • npm run db:studio:central - Open central database in Prisma Studio');
console.log('  • npm run db:studio:tenant  - Open tenant database in Prisma Studio'); 