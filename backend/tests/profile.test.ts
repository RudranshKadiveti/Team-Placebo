import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Profile & Career Goals API Tests', () => {
  const userA = {
    name: 'User Alpha',
    email: 'useralpha@example.com',
    password: 'Password123!',
  };

  const userB = {
    name: 'User Beta',
    email: 'userbeta@example.com',
    password: 'Password123!',
  };

  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email.toLowerCase(), userB.email.toLowerCase()] },
      },
    });

    // Register test users and extract JWT tokens
    const regA = await request(app).post('/api/auth/register').send(userA);
    tokenA = regA.body.data.token;

    const regB = await request(app).post('/api/auth/register').send(userB);
    tokenB = regB.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email.toLowerCase(), userB.email.toLowerCase()] },
      },
    });
    await prisma.$disconnect();
  });

  describe('Unauthenticated Access Control', () => {
    it('should reject unauthenticated profile GET request', async () => {
      const res = await request(app).get('/api/profile');
      expect(res.statusCode).toBe(401);
    });

    it('should reject unauthenticated career goals GET request', async () => {
      const res = await request(app).get('/api/profile/career-goals');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Profile CRUD Operations', () => {
    it('should return null profile when no profile created yet', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeNull();
      expect(res.body.data.completionPercentage).toBe(0);
    });

    it('should allow authenticated user to create a profile', async () => {
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          phone: '+1 555-0199',
          location: 'Bengaluru, India',
          university: 'Indian Institute of Technology',
          degree: 'Bachelor of Technology',
          fieldOfStudy: 'Computer Science',
          graduationYear: 2024,
          experienceLevel: 'ENTRY_LEVEL',
          bio: 'Aspiring software developer passionate about building web apps.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toHaveProperty('id');
      expect(res.body.data.profile.location).toBe('Bengaluru, India');
      expect(res.body.data.profile.experienceLevel).toBe('ENTRY_LEVEL');
      expect(res.body.data.completionPercentage).toBeGreaterThan(0);
    });

    it('should reject creation of duplicate profile for same user', async () => {
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          location: 'Delhi, India',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already exists');
    });

    it('should allow authenticated user to retrieve their profile', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.university).toBe('Indian Institute of Technology');
    });

    it('should allow authenticated user to update their profile', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          location: 'Mumbai, India',
          experienceLevel: 'JUNIOR',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.location).toBe('Mumbai, India');
      expect(res.body.data.profile.experienceLevel).toBe('JUNIOR');
    });
  });

  describe('Validation Enforcement', () => {
    it('should reject profile with invalid graduation year', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          graduationYear: 1800,
        });

      expect(res.statusCode).toBe(500); // Caught by centralized handler / Zod
      expect(res.body.success).toBe(false);
    });

    it('should reject profile with invalid experience level enum value', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          experienceLevel: 'SUPER_EXPERT_INVALID',
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should reject career goal creation with missing targetRole', async () => {
      const res = await request(app)
        .post('/api/profile/career-goals')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          targetIndustry: 'Technology',
          priority: 1,
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should reject career goal creation with invalid priority (0 or negative)', async () => {
      const res = await request(app)
        .post('/api/profile/career-goals')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          targetRole: 'Software Engineer',
          priority: 0,
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Career Goals CRUD & Multi-User Ownership Security Isolation', () => {
    let goalAId: string;

    it('should allow user A to add a career goal', async () => {
      const res = await request(app)
        .post('/api/profile/career-goals')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          targetRole: 'Machine Learning Engineer',
          targetIndustry: 'Technology',
          targetLocation: 'India',
          priority: 1,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetRole).toBe('Machine Learning Engineer');
      goalAId = res.body.data.id;
    });

    it('should retrieve user A career goals', async () => {
      const res = await request(app)
        .get('/api/profile/career-goals')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].targetRole).toBe('Machine Learning Engineer');
    });

    it('should allow user A to update their career goal', async () => {
      const res = await request(app)
        .put(`/api/profile/career-goals/${goalAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          targetRole: 'Senior Machine Learning Engineer',
          priority: 1,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetRole).toBe('Senior Machine Learning Engineer');
    });

    it('SECURITY TEST: Prevent User B from updating User A career goal', async () => {
      const res = await request(app)
        .put(`/api/profile/career-goals/${goalAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          targetRole: 'Hacked Role Title',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('SECURITY TEST: Prevent User B from deleting User A career goal', async () => {
      const res = await request(app)
        .delete(`/api/profile/career-goals/${goalAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should allow user A to delete their career goal', async () => {
      const res = await request(app)
        .delete(`/api/profile/career-goals/${goalAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
