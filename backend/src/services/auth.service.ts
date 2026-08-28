import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

const BCRYPT_SALT_ROUNDS = 10;

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const generateToken = (payload: { id: string; email: string; name: string }): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

interface CustomError extends Error {
  statusCode?: number;
}

/**
 * Register user enforcing strictly 1 account per unique email address
 */
export const registerUser = async (data: RegisterDTO): Promise<AuthResponse> => {
  const { name, email, password } = data;

  if (!name || name.trim().length === 0) {
    const error: CustomError = new Error('Name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    const error: CustomError = new Error('Invalid email format');
    error.statusCode = 400;
    throw error;
  }

  if (!password || password.length < 8) {
    const error: CustomError = new Error('Password must be at least 8 characters long');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Enforce single account per email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error: CustomError = new Error('User with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    },
  });

  const sanitized = sanitizeUser(newUser);
  const token = generateToken({
    id: sanitized.id,
    email: sanitized.email,
    name: sanitized.name,
  });

  return { user: sanitized, token };
};

/**
 * Authenticate user with normalized email lookup
 */
export const loginUser = async (data: LoginDTO): Promise<AuthResponse> => {
  const { email, password } = data;

  if (!email || !password) {
    const error: CustomError = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    const error: CustomError = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const error: CustomError = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const sanitized = sanitizeUser(user);
  const token = generateToken({
    id: sanitized.id,
    email: sanitized.email,
    name: sanitized.name,
  });

  return { user: sanitized, token };
};

export const getUserById = async (id: string): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error: CustomError = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
};
