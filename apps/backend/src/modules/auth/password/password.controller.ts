import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { PasswordService } from './password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto, TokenResponseDto } from '../jwt/dto/tokens.dto';
import { JwtAuthService } from '../jwt/jwt.service';
import { Public } from '../jwt/decorators/public.decorator';
import { JwtAuthGuard } from '../jwt/guards/jwt-auth.guard';
import { CurrentUser } from '../jwt/decorators/current-user.decorator';
import { User } from '../../../database/entities/user.entity';

@Controller('auth')
export class PasswordController {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<TokenResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const tokens = await this.passwordService.register(
      registerDto,
      ipAddress,
      userAgent,
    );

    return {
      ...tokens,
      tokenType: 'Bearer',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<TokenResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const tokens = await this.passwordService.login(
      loginDto,
      ipAddress,
      userAgent,
    );

    return {
      ...tokens,
      tokenType: 'Bearer',
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    const tokens = await this.jwtAuthService.refreshAccessToken(
      refreshTokenDto.refreshToken,
    );

    return {
      ...tokens,
      tokenType: 'Bearer',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.passwordService.changePassword(user.id, changePasswordDto);
    return { message: 'Password changed successfully. Please login again.' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request): Promise<{ message: string }> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const payload = await this.jwtAuthService.verifyAccessToken(token);
      if (payload.sessionId) {
        await this.jwtAuthService.revokeSession(payload.sessionId);
      }
    }
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string): Promise<{ message: string }> {
    await this.passwordService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.passwordService.resendVerificationEmail(user.id);
    return { message: 'Verification email sent' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.passwordService.forgotPassword(forgotPasswordDto);
    return { message: 'If your email exists in our system, you will receive a password reset link' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.passwordService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successfully. Please login with your new password.' };
  }
}
