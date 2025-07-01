// Legacy Prisma client - bridging to new connection manager
// TODO: Migrate individual APIs to use central/tenant connections directly
import { CentralDatabaseManager } from './database/connection-manager';

// Export central database connection as legacy prisma client
// This maintains backward compatibility while we migrate APIs
export const prisma = CentralDatabaseManager.getInstance(); 