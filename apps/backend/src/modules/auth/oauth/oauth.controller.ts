import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { GithubOAuthGuard } from './guards/github-oauth.guard';
import { JwtAuthGuard } from '../jwt/guards/jwt-auth.guard';
import { CurrentUser } from '../jwt/decorators/current-user.decorator';
import { Public } from '../jwt/decorators/public.decorator';
import { User } from '../../../database/entities/user.entity';
import type { GoogleProfile } from './strategies/google.strategy';
import type { GithubProfile } from './strategies/github.strategy';
import { OAuthAccountListDto } from './dto/oauth-response.dto';

@Controller('auth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  /**
   * Google OAuth - Initiate authentication
   */
  @Get('google')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // This route initiates the Google OAuth flow
    // Passport will handle the redirect
  }

  /**
   * Google OAuth - Callback
   */
  @Get('google/callback')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfile;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.oauthService.handleOAuthLogin(
      profile,
      ipAddress,
      userAgent,
    );

    // In production, redirect to frontend with tokens in URL or cookies
    // For now, return JSON response
    return res.status(HttpStatus.OK).json(result);
  }

  /**
   * GitHub OAuth - Initiate authentication
   */
  @Get('github')
  @Public()
  @UseGuards(GithubOAuthGuard)
  async githubAuth() {
    // This route initiates the GitHub OAuth flow
    // Passport will handle the redirect
  }

  /**
   * GitHub OAuth - Callback
   */
  @Get('github/callback')
  @Public()
  @UseGuards(GithubOAuthGuard)
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GithubProfile;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.oauthService.handleOAuthLogin(
      profile,
      ipAddress,
      userAgent,
    );

    // In production, redirect to frontend with tokens in URL or cookies
    // For now, return JSON response
    return res.status(HttpStatus.OK).json(result);
  }

  /**
   * Get linked OAuth accounts for current user
   */
  @Get('oauth/accounts')
  @UseGuards(JwtAuthGuard)
  async getLinkedAccounts(
    @CurrentUser() user: User,
  ): Promise<OAuthAccountListDto> {
    return this.oauthService.getLinkedAccounts(user.id);
  }

  /**
   * Unlink OAuth account from current user
   */
  @Delete('oauth/:provider')
  @UseGuards(JwtAuthGuard)
  async unlinkOAuthAccount(
    @CurrentUser() user: User,
    @Param('provider') provider: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.oauthService.unlinkOAuthAccount(user.id, provider);
  }
}
