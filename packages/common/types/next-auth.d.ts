import { DefaultSession } from 'next-auth';

interface StateBranch {
  id: string
  stateName: string
  stateCode: string
  branchName: string
  branchCode: string
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      name: string
      employeeId: string
      designation: string
      isStateRestricted: boolean
      phone: string
      
      // Tenant context
      tenantId: string
      tenantSlug: string
      tenantName: string
      
      // Organization context
      organizationId: string
      organizationName: string
      organizationSlug: string
      
      // State context
      stateBranchId: string
      stateBranch: any
      accessibleStates: string[]
      
      // Permissions
      permissions: string[]
      roles: string[]
    } & DefaultSession['user'];
  }

  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    name: string
    employeeId: string
    designation: string
    isActive: boolean
    isStateRestricted: boolean
    phone: string
    
    // Tenant context
    tenantId: string
    tenantSlug: string
    tenantName: string
    
    // Organization context
    organizationId: string
    organizationName: string
    organizationSlug: string
    
    // State context
    stateBranchId: string
    stateBranch: any
    accessibleStates: string[]
    
    // Permissions
    permissions: string[]
    roles: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    email: string
    firstName: string
    lastName: string
    employeeId: string
    designation: string
    isStateRestricted: boolean
    phone: string
    
    // Tenant context
    tenantId: string
    tenantSlug: string
    tenantName: string
    
    // Organization context
    organizationId: string
    organizationName: string
    organizationSlug: string
    
    // State context
    stateBranchId: string
    stateBranch: any
    accessibleStates: string[]
    
    // Permissions
    permissions: string[]
    roles: string[]
  }
} 