// Shared enums
export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  // Premium tier adds:
  // MICROSOFT = 'microsoft',
  // APPLE = 'apple',
}

export enum TwoFactorMethod {
  TOTP = 'totp',
  // Premium tier adds:
  // SMS = 'sms',
  // EMAIL = 'email',
}

export enum UserStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
  PENDING_VERIFICATION = 'pending_verification',
}
