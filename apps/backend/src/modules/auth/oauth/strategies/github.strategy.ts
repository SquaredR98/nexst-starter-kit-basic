import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

export interface GithubProfile {
  provider: 'github';
  providerId: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.github.clientId') || 'placeholder',
      clientSecret: configService.get<string>('oauth.github.clientSecret') || 'placeholder',
      callbackURL: configService.get<string>('oauth.github.callbackUrl') || 'http://localhost:3000/api/v1/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any) => void,
  ): Promise<any> {
    const { id, displayName, emails, photos, name } = profile;

    // GitHub may not provide email if not public
    const email = emails && emails.length > 0 ? emails[0].value : null;

    // Parse name
    const nameParts = displayName?.split(' ') || [];
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(' ') || null;

    const user: GithubProfile = {
      provider: 'github',
      providerId: id,
      email,
      displayName: displayName || name || 'GitHub User',
      firstName,
      lastName,
      avatarUrl: photos && photos.length > 0 ? photos[0].value : null,
    };

    done(null, user);
  }
}
