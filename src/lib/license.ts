// ============================================================================
// LICENSE VALIDATION SYSTEM - On-Premises Deployment
// ============================================================================

import { createVerify } from 'crypto';
import { z } from 'zod';

export interface LicenseInfo {
  organizationId: string;
  organizationName: string;
  licensedUsers: number;
  features: string[];
  expiryDate: Date;
  deploymentType: 'onpremise' | 'hybrid';
  version: string;
}

export interface LicenseValidationResult {
  isValid: boolean;
  license?: LicenseInfo;
  error?: string;
  expiresInDays?: number;
}

const licenseSchema = z.object({
  organizationId: z.string(),
  organizationName: z.string(),
  licensedUsers: z.number().positive(),
  features: z.array(z.string()),
  expiryDate: z.string().transform(str => new Date(str)),
  deploymentType: z.enum(['onpremise', 'hybrid']),
  version: z.string(),
  signature: z.string()
});

export class LicenseManager {
  private publicKey: string;
  private cachedLicense: LicenseInfo | null = null;
  private lastValidation: Date | null = null;
  private validationCacheMinutes = 60; // Cache for 1 hour

  constructor() {
    this.publicKey = process.env.LICENSE_PUBLIC_KEY || '';
    if (!this.publicKey && process.env.DEPLOYMENT_TYPE === 'onpremise') {
      console.warn('LICENSE_PUBLIC_KEY not configured for on-premise deployment');
    }
  }

  /**
   * Validate license from environment or database
   */
  async validateLicense(forceRefresh = false): Promise<LicenseValidationResult> {
    // Check cache first
    if (!forceRefresh && this.isCacheValid()) {
      return {
        isValid: true,
        license: this.cachedLicense!,
        expiresInDays: this.calculateExpiryDays(this.cachedLicense!.expiryDate)
      };
    }

    try {
      // For cloud deployment, always return valid
      if (process.env.DEPLOYMENT_TYPE === 'cloud') {
        return { isValid: true };
      }

      // Load license from environment or file
      const licenseData = await this.loadLicenseData();
      if (!licenseData) {
        return { isValid: false, error: 'License data not found' };
      }

      // Validate license structure
      const validatedLicense = licenseSchema.parse(JSON.parse(licenseData));
      
      // Verify signature
      const isSignatureValid = await this.verifySignature(validatedLicense);
      if (!isSignatureValid) {
        return { isValid: false, error: 'Invalid license signature' };
      }

      // Check expiry
      if (validatedLicense.expiryDate < new Date()) {
        return { isValid: false, error: 'License has expired' };
      }

      // Cache the validated license
      this.cachedLicense = {
        organizationId: validatedLicense.organizationId,
        organizationName: validatedLicense.organizationName,
        licensedUsers: validatedLicense.licensedUsers,
        features: validatedLicense.features,
        expiryDate: validatedLicense.expiryDate,
        deploymentType: validatedLicense.deploymentType,
        version: validatedLicense.version
      };
      this.lastValidation = new Date();

      return {
        isValid: true,
        license: this.cachedLicense,
        expiresInDays: this.calculateExpiryDays(this.cachedLicense.expiryDate)
      };

    } catch (error) {
      console.error('License validation error:', error);
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'License validation failed' 
      };
    }
  }

  /**
   * Check if user count is within license limits
   */
  async validateUserLimit(organizationId: string, currentUserCount: number): Promise<boolean> {
    const validation = await this.validateLicense();
    
    if (!validation.isValid || !validation.license) {
      return false;
    }

    return currentUserCount <= validation.license.licensedUsers;
  }

  /**
   * Check if feature is licensed
   */
  async isFeatureLicensed(featureCode: string): Promise<boolean> {
    const validation = await this.validateLicense();
    
    if (!validation.isValid || !validation.license) {
      return false;
    }

    return validation.license.features.includes(featureCode) || 
           validation.license.features.includes('*');
  }

  /**
   * Get license information for admin display
   */
  async getLicenseInfo(): Promise<LicenseInfo | null> {
    const validation = await this.validateLicense();
    return validation.license || null;
  }

  /**
   * Load license data from environment or file
   */
  private async loadLicenseData(): Promise<string | null> {
    // Try environment variable first
    const envLicense = process.env.LICENSE_DATA;
    if (envLicense) {
      return envLicense;
    }

    // Try loading from file system (for on-premise)
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const licensePath = path.join(process.cwd(), 'license.json');
      const licenseFile = await fs.readFile(licensePath, 'utf-8');
      return licenseFile;
    } catch {
      return null;
    }
  }

  /**
   * Verify license signature using public key
   */
  private async verifySignature(license: z.infer<typeof licenseSchema>): Promise<boolean> {
    if (!this.publicKey) {
      console.warn('No public key available for license verification');
      return process.env.NODE_ENV === 'development'; // Allow in development
    }

    try {
      const { signature, ...licenseData } = license;
      const dataToVerify = JSON.stringify(licenseData);
      
      const verify = createVerify('RSA-SHA256');
      verify.update(dataToVerify);
      
      return verify.verify(this.publicKey, signature, 'base64');
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Check if cached license is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cachedLicense || !this.lastValidation) {
      return false;
    }

    const cacheAge = Date.now() - this.lastValidation.getTime();
    const cacheLimit = this.validationCacheMinutes * 60 * 1000;
    
    return cacheAge < cacheLimit;
  }

  /**
   * Calculate days until license expiry
   */
  private calculateExpiryDays(expiryDate: Date): number {
    const now = new Date();
    const timeDiff = expiryDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}

// Singleton instance
export const licenseManager = new LicenseManager();

/**
 * Middleware for license validation
 */
export async function requireValidLicense() {
  const validation = await licenseManager.validateLicense();
  
  if (!validation.isValid) {
    throw new Error(`License validation failed: ${validation.error}`);
  }

  return validation.license;
}

/**
 * Feature flag middleware with license checking
 */
export async function requireLicensedFeature(featureCode: string) {
  const isLicensed = await licenseManager.isFeatureLicensed(featureCode);
  
  if (!isLicensed) {
    throw new Error(`Feature '${featureCode}' is not licensed`);
  }

  return true;
} 