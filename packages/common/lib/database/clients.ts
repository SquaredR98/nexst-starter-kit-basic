// Prisma Client Exports for Central and Tenant Databases
// This file handles the correct import paths for generated Prisma clients

// Import the generated Prisma clients from the correct paths
export { PrismaClient as CentralPrismaClient } from '../../../node_modules/.prisma/central';
export { PrismaClient as TenantPrismaClient } from '../../../node_modules/.prisma/tenant';

// Types exports
export type { Prisma as CentralPrisma } from '../../../node_modules/.prisma/central';
export type { Prisma as TenantPrisma } from '../../../node_modules/.prisma/tenant'; 