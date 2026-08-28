import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

describe('Authentication System API Tests', () => {
  const testUser = {
    name: 'Auth Test User',
    email: 'authtest@example.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    // Clean up test user if exists
    try {
      await prisma.user.deleteMany({
        where: { email: testUser.email.toLowerCase() },
      });
    } catch {
      // Ignore if DB not reached in unit mock mode
    }
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: testUser.email.toLowerCase() },
      });
      await prisma.$disconnect();
    } catch {
      // Ignore cleanup error
    }
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a valid user', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already exists');
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Invalid Email User',
        email: 'invalid-email-format',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid email');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Weak Pass User',
        email: 'weakpass@example.com',
        password: 'short',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('at least 8 characters');
    });

    it('should reject registration with missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'missingname@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistentuser999@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    let validToken: string;

    beforeAll(async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      validToken = loginRes.body.data.token;
    });

    it('should allow access with valid authentication token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    });

    it('should reject access when authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('missing');
    });

    it('should reject access with invalid or tampered token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid or expired');
    });

    it('should reject access with an expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 'some-id', email: 'test@example.com', name: 'Test' },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid or expired');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should process logout request for authenticated user', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      const token = loginRes.body.data.token;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
