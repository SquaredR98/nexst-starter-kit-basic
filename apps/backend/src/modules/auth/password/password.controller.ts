import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import type { Request } from 'express';
import { PasswordService } from './password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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
}
