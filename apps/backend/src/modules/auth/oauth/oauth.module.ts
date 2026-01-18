import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { User } from '../../../database/entities/user.entity';
import { OAuthAccount } from '../../../database/entities/oauth-account.entity';
import { Profile } from '../../../database/entities/profile.entity';
import { Session } from '../../../database/entities/session.entity';
import { JwtAuthModule } from '../jwt/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OAuthAccount, Profile, Session]),
    JwtAuthModule,
  ],
  controllers: [OAuthController],
  providers: [OAuthService, GoogleStrategy, GithubStrategy],
  exports: [OAuthService],
})
export class OAuthModule {}
