import NextAuth, { DefaultSession } from 'next-auth';
import { Role, Permission } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      departmentId?: string;
      roles: Role[];
      permissions: Permission[];
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    organizationId: string;
    departmentId?: string;
    roles: Role[];
    permissions: Permission[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    organizationId: string;
    departmentId?: string;
    roles: Role[];
    permissions: Permission[];
  }
} 