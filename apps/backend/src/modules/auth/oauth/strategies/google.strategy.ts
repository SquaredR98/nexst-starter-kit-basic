import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleProfile {
  provider: 'google';
  providerId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.google.clientId') || 'placeholder',
      clientSecret: configService.get<string>('oauth.google.clientSecret') || 'placeholder',
      callbackURL: configService.get<string>('oauth.google.callbackUrl') || 'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user: GoogleProfile = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      displayName: profile.displayName,
      firstName: name.givenName,
      lastName: name.familyName,
      avatarUrl: photos[0]?.value || null,
    };

    done(null, user);
  }
}
