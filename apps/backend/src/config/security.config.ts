import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  rateLimiting: {
    ttl: 60, // 1 minute
    limit: 100, // 100 requests per minute
  },
  passwordPolicy: {
    minStrength: 3, // zxcvbn score
    historyCount: 5,
    lockoutAttempts: 5,
    lockoutDuration: 1800, // 30 minutes in seconds
  },
  session: {
    maxConcurrent: 5,
    trackLocation: true,
    suspiciousLoginAlerts: true,
  },
}));
