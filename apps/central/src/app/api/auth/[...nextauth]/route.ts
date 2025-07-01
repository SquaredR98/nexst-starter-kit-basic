/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { TenantDatabaseManager, CentralDatabaseManager } from '@/lib/database/connection-manager'
import { z } from 'zod'

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().min(1, 'Tenant is required')
})

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantSlug: { label: 'Tenant', type: 'text' }
      },
      async authorize(credentials) {
        try {
          if (!credentials) {
            throw new Error('No credentials provided')
          }

          // Validate input
          const validatedData = loginSchema.parse(credentials)
          
          // First, get tenant info from central database
          const central = CentralDatabaseManager.getInstance()
          const tenant = await central.platformTenant.findUnique({
            where: { 
              slug: validatedData.tenantSlug,
              isActive: true 
            },
            select: {
              id: true,
              companyName: true,
              slug: true,
              databaseStatus: true
            }
          })

          if (!tenant) {
            throw new Error('Invalid tenant or tenant is deactivated')
          }

          if (tenant.databaseStatus !== 'CONNECTED') {
            throw new Error('Tenant database is not available')
          }

          // Get tenant database connection
          const tenantDb = await TenantDatabaseManager.getConnection(tenant.id)
          
          // Find user in tenant database
          const user = await tenantDb.user.findUnique({
            where: { 
              email: validatedData.email,
              isActive: true 
            },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  isActive: true
                }
              },
              stateBranch: {
                select: {
                  id: true,
                  stateName: true,
                  stateCode: true,
                  branchName: true,
                  branchCode: true
                }
              },
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              }
            }
          })

          if (!user) {
            throw new Error('Invalid email or password')
          }

          if (!user.organization || !user.organization.isActive) {
            throw new Error('Organization is not active')
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash)
          if (!isValidPassword) {
            throw new Error('Invalid email or password')
          }

          // Update last login
          await tenantDb.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })

          // Get user permissions
          const permissions = user.userRoles.flatMap((userRole: any) => 
            userRole.role.rolePermissions.map((rp: any) => rp.permission.name)
          )

          // Get user's accessible state branches
          let accessibleStates: string[] = []
          if (user.isStateRestricted && user.stateBranch) {
            accessibleStates = [user.stateBranch.stateCode]
          } else {
            // Tenant admin - get all states for this organization
            const allBranches = await tenantDb.stateBranch.findMany({
              where: { 
                organizationId: user.organizationId,
                isActive: true 
              },
              select: { stateCode: true }
            })
            accessibleStates = allBranches.map((branch: any) => branch.stateCode)
          }

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`,
            employeeId: user.employeeId,
            designation: user.designation,
            isActive: user.isActive,
            isStateRestricted: user.isStateRestricted,
            phone: user.phone,
            
            // Tenant context
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            tenantName: tenant.companyName,
            
            // Organization context
            organizationId: user.organizationId,
            organizationName: user.organization.name,
            organizationSlug: user.organization.slug,
            
            // State context
            stateBranchId: user.stateBranchId,
            stateBranch: user.stateBranch,
            accessibleStates,
            
            // Permissions
            permissions,
            roles: user.userRoles.map((ur: any) => ur.role.name)
          }

        } catch (error) {
          console.error('Authentication error:', error)
          throw new Error(error instanceof Error ? error.message : 'Authentication failed')
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Store user data in JWT token
        token.userId = user.id
        token.email = user.email
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.employeeId = user.employeeId
        token.designation = user.designation
        token.isStateRestricted = user.isStateRestricted
        token.phone = user.phone
        
        // Tenant context
        token.tenantId = user.tenantId
        token.tenantSlug = user.tenantSlug
        token.tenantName = user.tenantName
        
        // Organization context
        token.organizationId = user.organizationId
        token.organizationName = user.organizationName
        token.organizationSlug = user.organizationSlug
        
        // State context
        token.stateBranchId = user.stateBranchId
        token.stateBranch = user.stateBranch
        token.accessibleStates = user.accessibleStates
        
        // Permissions
        token.permissions = user.permissions
        token.roles = user.roles
      }
      return token
    },
    
    async session({ session, token }) {
      // Send properties to the client
      session.user = {
        id: token.userId as string,
        email: token.email as string,
        firstName: token.firstName as string,
        lastName: token.lastName as string,
        name: `${token.firstName} ${token.lastName}`,
        employeeId: token.employeeId as string,
        designation: token.designation as string,
        isStateRestricted: token.isStateRestricted as boolean,
        phone: token.phone as string,
        
        // Tenant context
        tenantId: token.tenantId as string,
        tenantSlug: token.tenantSlug as string,
        tenantName: token.tenantName as string,
        
        // Organization context
        organizationId: token.organizationId as string,
        organizationName: token.organizationName as string,
        organizationSlug: token.organizationSlug as string,
        
        // State context
        stateBranchId: token.stateBranchId as string,
        stateBranch: token.stateBranch as any,
        accessibleStates: token.accessibleStates as string[],
        
        // Permissions
        permissions: token.permissions as string[],
        roles: token.roles as string[]
      }
      
      return session
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login'
  },
  
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST } 