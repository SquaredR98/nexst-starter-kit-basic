import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../database/entities/user.entity';
import { Profile } from '../../../database/entities/profile.entity';
import { Session } from '../../../database/entities/session.entity';
import { PasswordHistory } from '../../../database/entities/password-history.entity';
import { UserRole } from '../../../database/entities/user-role.entity';
import { Role } from '../../../database/entities/role.entity';
import { JwtAuthService } from '../jwt/jwt.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TokenPair } from '../jwt/interfaces/jwt-payload.interface';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly bcryptRounds: number;
  private readonly maxFailedAttempts = 5;
  private readonly lockDuration = 15 * 60 * 1000; // 15 minutes in ms
  private readonly passwordHistoryLimit = 5;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepository: Repository<PasswordHistory>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtAuthService: JwtAuthService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
  }

  /**
   * Register a new user with email and password
   */
  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check rate limiting for registration
    await this.checkRateLimit(`register:${ipAddress}`, 5, 3600); // 5 attempts per hour

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      emailVerified: null, // Email verification will be implemented later
    });

    const savedUser = await this.userRepository.save(user);

    // Create profile
    const profile = this.profileRepository.create({
      userId: savedUser.id,
      firstName: firstName || null,
      lastName: lastName || null,
    });

    await this.profileRepository.save(profile);

    // Assign default 'user' role
    const userRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    });

    if (userRole) {
      const userRoleAssignment = this.userRoleRepository.create({
        userId: savedUser.id,
        roleId: userRole.id,
      });
      await this.userRoleRepository.save(userRoleAssignment);
    }

    // Add password to history
    await this.addPasswordToHistory(savedUser.id, passwordHash);

    // Create session and generate tokens
    const session = await this.createSession(
      savedUser.id,
      ipAddress,
      userAgent,
    );

    // Fetch user with roles for token generation
    const userWithRoles = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['roles', 'roles.role'],
    });

    if (!userWithRoles) throw new Error('User not found after registration');

    const tokens = await this.jwtAuthService.generateTokenPair(
      userWithRoles,
      session.id,
      ipAddress,
      userAgent,
    );

    // Update session with refresh token
    await this.sessionRepository.update(
      { id: session.id },
      { refreshToken: tokens.refreshToken },
    );

    this.logger.log(`User registered successfully: ${email}`);

    return tokens;
  }

  /**
   * Login with email and password
   */
  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const { email, password } = loginDto;

    // Check rate limiting for login attempts
    const rateLimitKey = `login:${email}:${ipAddress}`;
    await this.checkRateLimit(rateLimitKey, 10, 900); // 10 attempts per 15 minutes

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['roles', 'roles.role'],
    });

    if (!user || !user.passwordHash) {
      // Generic error to prevent user enumeration
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${remainingTime} minutes`,
      );
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    if (user.failedAttempts > 0) {
      await this.userRepository.update(
        { id: user.id },
        { failedAttempts: 0, lockedUntil: null },
      );
    }

    // Create session and generate tokens
    const session = await this.createSession(user.id, ipAddress, userAgent);


    const tokens = await this.jwtAuthService.generateTokenPair(
      user,
      session.id,
      ipAddress,
      userAgent,
    );

    // Update session with refresh token
    await this.sessionRepository.update(
      { id: session.id },
      { refreshToken: tokens.refreshToken },
    );

    this.logger.log(`User logged in successfully: ${email}`);

    return tokens;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await this.verifyPassword(
      newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Check password history
    await this.checkPasswordHistory(userId, newPassword);

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await this.userRepository.update({ id: userId }, { passwordHash: newPasswordHash });

    // Add to password history
    await this.addPasswordToHistory(userId, newPasswordHash);

    // Revoke all existing sessions (force re-login)
    await this.jwtAuthService.revokeAllUserSessions(userId);

    this.logger.log(`Password changed successfully for user: ${userId}`);
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(user: User): Promise<void> {
    const newFailedAttempts = user.failedAttempts + 1;

    if (newFailedAttempts >= this.maxFailedAttempts) {
      const lockedUntil = new Date(Date.now() + this.lockDuration);

      await this.userRepository.update(
        { id: user.id },
        {
          failedAttempts: newFailedAttempts,
          lockedUntil,
        },
      );

      this.logger.warn(`Account locked due to failed attempts: ${user.email}`);
    } else {
      await this.userRepository.update(
        { id: user.id },
        { failedAttempts: newFailedAttempts },
      );
    }
  }

  /**
   * Create a new session
   */
  private async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = this.sessionRepository.create({
      userId,
      refreshToken: '', // Will be updated after token generation
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
      lastActiveAt: new Date(),
    });

    return this.sessionRepository.save(session);
  }

  /**
   * Add password to history
   */
  private async addPasswordToHistory(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    // Create new history entry
    const historyEntry = this.passwordHistoryRepository.create({
      userId,
      passwordHash,
    });

    await this.passwordHistoryRepository.save(historyEntry);

    // Keep only last N passwords in history
    const allHistory = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (allHistory.length > this.passwordHistoryLimit) {
      const toDelete = allHistory.slice(this.passwordHistoryLimit);
      await this.passwordHistoryRepository.remove(toDelete);
    }
  }

  /**
   * Check if password was used recently
   */
  private async checkPasswordHistory(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const history = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: this.passwordHistoryLimit,
    });

    for (const entry of history) {
      const isSamePassword = await this.verifyPassword(
        newPassword,
        entry.passwordHash,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          `Password was used recently. Please choose a different password`,
        );
      }
    }
  }

  /**
   * Rate limiting check using Redis
   */
  private async checkRateLimit(
    key: string,
    maxAttempts: number,
    windowSeconds: number,
  ): Promise<void> {
    const cacheKey = `ratelimit:${key}`;
    const current = (await this.cacheManager.get<number>(cacheKey)) || 0;

    if (current >= maxAttempts) {
      throw new UnauthorizedException(
        'Too many attempts. Please try again later',
      );
    }

    await this.cacheManager.set(cacheKey, current + 1, windowSeconds * 1000);
  }
}
