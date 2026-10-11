import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';
import type { AuthPayload } from '../types';

const SALT_ROUNDS = 12;

function generateTokenPair(payload: AuthPayload): {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
} {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = uuidv4();
  return { accessToken, refreshToken, expiresIn: env.JWT_EXPIRES_IN };
}

function getRefreshTokenExpiry(): Date {
  // Parse e.g. "7d" -> 7 days from now
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [, amount, unit] = match;
  const ms = {
    d: 86400000,
    h: 3600000,
    m: 60000,
    s: 1000,
  }[unit!] ?? 86400000;
  return new Date(Date.now() + parseInt(amount!) * ms);
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: (input.role as UserRole) || 'VIEWER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  logger.info('User registered', { userId: user.id, email: user.email });

  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
  const { accessToken, refreshToken, expiresIn } = generateTokenPair(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { user, accessToken, refreshToken, expiresIn };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Account is deactivated', 'ACCOUNT_INACTIVE');
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
  const { accessToken, refreshToken, expiresIn } = generateTokenPair(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  logger.info('User logged in', { userId: user.id });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken, expiresIn };
}

export async function refreshAccessToken(token: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (storedToken.revokedAt) {
    throw new AppError(401, 'Refresh token has been revoked', 'TOKEN_REVOKED');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token has expired', 'TOKEN_EXPIRED');
  }

  if (!storedToken.user.isActive) {
    throw new AppError(403, 'Account is deactivated', 'ACCOUNT_INACTIVE');
  }

  // Rotate refresh token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  const payload: AuthPayload = {
    userId: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
  };

  const { accessToken, refreshToken: newRefreshToken, expiresIn } = generateTokenPair(payload);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken: newRefreshToken, expiresIn };
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revokedAt: new Date() },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  }

  return user;
}
