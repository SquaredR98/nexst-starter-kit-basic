import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

/**
 * Create a mock repository for testing
 */
export const createMockRepository = <T = any>(): Partial<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
});

/**
 * Create a mock cache manager for testing
 */
export const createMockCacheManager = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
});

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
  emailVerified: new Date(),
  failedAttempts: 0,
  lockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: [],
  sessions: [],
  oauthAccounts: [],
  profile: null,
  twoFactor: null,
  passwordHistory: [],
};

/**
 * Mock JWT payload for testing
 */
export const mockJwtPayload = {
  sub: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  roles: ['user'],
  sessionId: 'session-123',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

/**
 * Mock tokens for testing
 */
export const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 900,
};

/**
 * Mock session for testing
 */
export const mockSession = {
  id: 'session-123',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  refreshToken: 'mock-refresh-token',
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  lastActiveAt: new Date(),
  revokedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock role for testing
 */
export const mockRole = {
  id: 'role-123',
  name: 'user',
  description: 'Regular user role',
  createdAt: new Date(),
  updatedAt: new Date(),
  users: [],
  permissions: [],
};

/**
 * Mock permission for testing
 */
export const mockPermission = {
  id: 'permission-123',
  resource: 'users',
  action: 'read',
  description: 'Read user data',
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: [],
};
