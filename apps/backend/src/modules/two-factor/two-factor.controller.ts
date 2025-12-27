import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../auth/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/jwt/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { Enable2faDto, Verify2faDto, UseBackupCodeDto } from './dto/enable-2fa.dto';
import {
  Setup2faResponseDto,
  BackupCodesResponseDto,
  Verify2faResponseDto,
  TwoFactorStatusDto,
} from './dto/two-factor-response.dto';

@Controller('2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  /**
   * Get 2FA status for current user
   */
  @Get('status')
  async get2faStatus(@CurrentUser() user: User): Promise<TwoFactorStatusDto> {
    return this.twoFactorService.get2faStatus(user.id);
  }

  /**
   * Initiate 2FA setup - generates secret and QR code
   */
  @Post('setup')
  async setup2fa(@CurrentUser() user: User): Promise<Setup2faResponseDto> {
    return this.twoFactorService.setup2fa(user.id);
  }

  /**
   * Enable 2FA after verifying the TOTP code
   */
  @Post('enable')
  @HttpCode(HttpStatus.OK)
  async enable2fa(
    @CurrentUser() user: User,
    @Body() enable2faDto: Enable2faDto,
  ): Promise<Verify2faResponseDto> {
    return this.twoFactorService.enable2fa(user.id, enable2faDto.code);
  }

  /**
   * Disable 2FA (requires verification code)
   */
  @Delete('disable')
  @HttpCode(HttpStatus.OK)
  async disable2fa(
    @CurrentUser() user: User,
    @Body() verify2faDto: Verify2faDto,
  ): Promise<Verify2faResponseDto> {
    return this.twoFactorService.disable2fa(user.id, verify2faDto.code);
  }

  /**
   * Generate new backup codes
   */
  @Post('backup-codes')
  async generateBackupCodes(
    @CurrentUser() user: User,
  ): Promise<BackupCodesResponseDto> {
    return this.twoFactorService.generateBackupCodesForUser(user.id);
  }

  /**
   * Verify 2FA code (used during login flow)
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify2faCode(
    @CurrentUser() user: User,
    @Body() verify2faDto: Verify2faDto,
  ): Promise<Verify2faResponseDto> {
    const isValid = await this.twoFactorService.verify2faCode(
      user.id,
      verify2faDto.code,
    );

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid verification code',
      };
    }

    return {
      success: true,
      message: 'Code verified successfully',
    };
  }

  /**
   * Use backup code (used during login flow)
   */
  @Post('backup-code')
  @HttpCode(HttpStatus.OK)
  async useBackupCode(
    @CurrentUser() user: User,
    @Body() useBackupCodeDto: UseBackupCodeDto,
  ): Promise<Verify2faResponseDto> {
    const isValid = await this.twoFactorService.useBackupCode(
      user.id,
      useBackupCodeDto.backupCode,
    );

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid or already used backup code',
      };
    }

    return {
      success: true,
      message: 'Backup code accepted',
    };
  }
}
