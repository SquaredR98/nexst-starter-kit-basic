import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import { User } from '../../database/entities/user.entity';
import { TwoFactor } from '../../database/entities/two-factor.entity';
import {
  Setup2faResponseDto,
  BackupCodesResponseDto,
  Verify2faResponseDto,
  TwoFactorStatusDto,
} from './dto/two-factor-response.dto';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TwoFactor)
    private readonly twoFactorRepository: Repository<TwoFactor>,
  ) {}

  /**
   * Generate TOTP secret and QR code for 2FA setup
   */
  async setup2fa(userId: string): Promise<Setup2faResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['twoFactor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactor?.isEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Auth Starter Kit (${user.email})`,
      issuer: 'Auth Starter Kit',
      length: 32,
    });

    // Create or update TwoFactor record with temporary secret
    let twoFactor = user.twoFactor;
    if (!twoFactor) {
      twoFactor = this.twoFactorRepository.create({
        userId,
        secret: secret.base32,
        isEnabled: false,
        backupCodes: [],
      });
    } else {
      twoFactor.secret = secret.base32;
    }
    await this.twoFactorRepository.save(twoFactor);

    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = await this.generateBackupCodesForUser(userId);

    this.logger.log(`2FA setup initiated for user: ${userId}`);

    return {
      secret: secret.base32,
      qrCodeDataUrl,
      backupCodes: backupCodes.backupCodes,
    };
  }

  /**
   * Verify the TOTP code and enable 2FA
   */
  async enable2fa(userId: string, code: string): Promise<Verify2faResponseDto> {
    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId },
    });

    if (!twoFactor) {
      throw new BadRequestException('2FA setup not initiated. Call setup endpoint first');
    }

    if (twoFactor.isEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Verify the TOTP code
    const isValid = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps in either direction
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA
    twoFactor.isEnabled = true;
    twoFactor.enabledAt = new Date();
    await this.twoFactorRepository.save(twoFactor);

    this.logger.log(`2FA enabled for user: ${userId}`);

    return {
      success: true,
      message: '2FA has been successfully enabled',
    };
  }

  /**
   * Disable 2FA for a user
   */
  async disable2fa(userId: string, code: string): Promise<Verify2faResponseDto> {
    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId },
    });

    if (!twoFactor) {
      throw new NotFoundException('2FA not found');
    }

    if (!twoFactor.isEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify the TOTP code before disabling
    const isValid = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Delete the 2FA record entirely
    await this.twoFactorRepository.remove(twoFactor);

    this.logger.log(`2FA disabled for user: ${userId}`);

    return {
      success: true,
      message: '2FA has been successfully disabled',
    };
  }

  /**
   * Verify TOTP code during login
   */
  async verify2faCode(userId: string, code: string): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId, isEnabled: true },
    });

    if (!twoFactor) {
      return false;
    }

    const isValid = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    return isValid;
  }

  /**
   * Generate new backup codes for a user
   */
  async generateBackupCodesForUser(
    userId: string,
  ): Promise<BackupCodesResponseDto> {
    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId },
    });

    if (!twoFactor) {
      throw new NotFoundException('2FA not found');
    }

    const codes: string[] = [];
    const hashedCodes: string[] = [];

    // Generate 10 backup codes
    for (let i = 0; i < 10; i++) {
      const code = this.generateBackupCode();
      codes.push(code);

      const hashedCode = crypto
        .createHash('sha256')
        .update(code)
        .digest('hex');

      hashedCodes.push(hashedCode);
    }

    // Store hashed codes in JSONB column
    twoFactor.backupCodes = hashedCodes;
    await this.twoFactorRepository.save(twoFactor);

    this.logger.log(`Generated ${codes.length} backup codes for user: ${userId}`);

    return { backupCodes: codes };
  }

  /**
   * Use a backup code for authentication
   */
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId, isEnabled: true },
    });

    if (!twoFactor || !twoFactor.backupCodes.length) {
      return false;
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Check if code exists in backup codes array
    const codeIndex = twoFactor.backupCodes.indexOf(hashedCode);
    if (codeIndex === -1) {
      return false;
    }

    // Remove the used backup code from the array
    twoFactor.backupCodes.splice(codeIndex, 1);
    await this.twoFactorRepository.save(twoFactor);

    this.logger.log(`Backup code used for user: ${userId}`);

    return true;
  }

  /**
   * Get 2FA status for a user
   */
  async get2faStatus(userId: string): Promise<TwoFactorStatusDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId },
    });

    return {
      enabled: twoFactor?.isEnabled ?? false,
      backupCodesRemaining: twoFactor?.backupCodes.length ?? 0,
    };
  }

  /**
   * Generate a random backup code
   */
  private generateBackupCode(): string {
    // Generate 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    const randomBytes = crypto.randomBytes(8);

    for (let i = 0; i < 8; i++) {
      code += chars[randomBytes[i] % chars.length];
    }

    // Format as XXXX-XXXX
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }
}
