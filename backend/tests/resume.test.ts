import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Resume Intelligence Foundation API (Phase 4A)', () => {
  let tokenUserA: string;
  let userIdA: string;
  let tokenUserB: string;
  let userIdB: string;
  let resumeIdA: string;

  beforeAll(async () => {
    // Clean database tables
    await prisma.resume.deleteMany({});
    await prisma.careerGoal.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.user.deleteMany({});

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User A Resume',
      email: 'usera.resume@example.com',
      password: 'Password123!',
    });
    tokenUserA = resA.body.data.token;
    userIdA = resA.body.data.user.id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User B Resume',
      email: 'userb.resume@example.com',
      password: 'Password123!',
    });
    tokenUserB = resB.body.data.token;
    userIdB = resB.body.data.user.id;

    // Seed a resume record for User A
    const resumeRecord = await prisma.resume.create({
      data: {
        userId: userIdA,
        originalFileName: 'software_engineer_resume.pdf',
        fileType: 'application/pdf',
        fileSize: 1024500,
        storageKey: 'resumes/usera_software_engineer_resume.pdf',
      },
    });
    resumeIdA = resumeRecord.id;
  });

  afterAll(async () => {
    await prisma.resume.deleteMany({});
    await prisma.careerGoal.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/resumes (List User Resumes)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/resumes');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Authentication token missing/i);
    });

    it('should return empty list for user with no resumes', async () => {
      const res = await request(app)
        .get('/api/resumes')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('should return resume metadata list for authenticated user', async () => {
      const res = await request(app)
        .get('/api/resumes')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(resumeIdA);
      expect(res.body.data[0].originalFileName).toBe('software_engineer_resume.pdf');
      expect(res.body.data[0].userId).toBe(userIdA);
    });
  });

  describe('GET /api/resumes/:id (Get Resume By ID & Ownership Security)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get(`/api/resumes/${resumeIdA}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/resumes/invalid-uuid-123')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid resume ID format/i);
    });

    it('should return 404 for nonexistent valid UUID resume ID', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/resumes/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Resume not found/i);
    });

    it('should allow User A to retrieve their own resume metadata', async () => {
      const res = await request(app)
        .get(`/api/resumes/${resumeIdA}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(resumeIdA);
      expect(res.body.data.originalFileName).toBe('software_engineer_resume.pdf');
      expect(res.body.data.fileType).toBe('application/pdf');
    });

    it('should DENY User B from accessing User A\'s resume (Ownership Security)', async () => {
      const res = await request(app)
        .get(`/api/resumes/${resumeIdA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Access denied/i);
    });
  });

  describe('POST /api/resumes/upload (Resume File Upload & Validation)', () => {
    it('should reject unauthenticated upload request with 401', async () => {
      const res = await request(app)
        .post('/api/resumes/upload')
        .attach('resume', Buffer.from('mock pdf content'), 'test.pdf');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject upload request missing resume file with 400', async () => {
      const res = await request(app)
        .post('/api/resumes/upload')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid file type (e.g. .png image) with 400', async () => {
      const res = await request(app)
        .post('/api/resumes/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('resume', Buffer.from('fake png binary data'), 'avatar.png');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid file type/i);
    });

    it('should successfully upload valid PDF resume file and create database metadata record', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 mock pdf content body');
      const res = await request(app)
        .post('/api/resumes/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('resume', pdfBuffer, 'my_john_doe_resume.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.originalFileName).toBe('my_john_doe_resume.pdf');
      expect(res.body.data.userId).toBe(userIdA);
      expect(res.body.data.storageKey).toMatch(/resumes\/.*-my_john_doe_resume.pdf/);
    });
  });

  describe('POST /api/resumes/:id/embed (Phase 4F Resume Embedding Pipeline)', () => {
    let testResumeId: string;

    beforeAll(async () => {
      // Seed a resume with rawText for User A
      const resume = await prisma.resume.create({
        data: {
          userId: userIdA,
          originalFileName: 'senior_backend_engineer.pdf',
          fileType: 'application/pdf',
          fileSize: 2048,
          storageKey: 'resumes/test_senior_backend_engineer.pdf',
          rawText: `
TECHNICAL SKILLS
Python, Node.js, TypeScript, PostgreSQL, Docker, Kubernetes, AWS

PROFESSIONAL EXPERIENCE
Senior Backend Engineer at Tech Corp (2022 - Present)
Architected scalable microservices serving 2M daily active users.
Designed database schemas with PostgreSQL and pgvector for semantic search.

PERSONAL PROJECTS
CareerPilot AI Platform
Built AI-powered career intelligence platform with Express, TypeScript, and pgvector embeddings.

EDUCATION
Bachelor of Science in Computer Science, Stanford University (2021)
          `.trim(),
        },
      });
      testResumeId = resume.id;
    });

    it('should reject unauthenticated embed request with 401', async () => {
      const res = await request(app).post(`/api/resumes/${testResumeId}/embed`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID format in embed route', async () => {
      const res = await request(app)
        .post('/api/resumes/invalid-uuid-format/embed')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent resume ID in embed route', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/resumes/${nonExistentId}/embed`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should DENY User B from generating embeddings for User A\'s resume (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/resumes/${testResumeId}/embed`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Access denied/i);
    });

    it(
      'should successfully generate L2-normalized sentence-transformer embeddings for User A\'s resume',
      async () => {
        const res = await request(app)
          .post(`/api/resumes/${testResumeId}/embed`)
          .set('Authorization', `Bearer ${tokenUserA}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.resumeId).toBe(testResumeId);
        expect(res.body.data.totalChunks).toBeGreaterThan(0);
        expect(res.body.data.generatedChunks).toBeGreaterThan(0);
        expect(res.body.data.embeddingDimension).toBe(384);
        expect(res.body.data.normalized).toBe(true);
        expect(res.body.data.chunkingVersion).toBe('v1');

        // Verify pgvector storage in PostgreSQL database
        const dbChunks = await prisma.resumeChunk.findMany({
          where: { resumeId: testResumeId },
        });
        expect(dbChunks.length).toBe(res.body.data.totalChunks);
        expect(dbChunks[0].embeddingDimension).toBe(384);
        expect(dbChunks[0].normalized).toBe(true);
      },
      30000
    );

    it(
      'should reuse existing chunk embeddings on second embed call if content is unchanged',
      async () => {
        const res = await request(app)
          .post(`/api/resumes/${testResumeId}/embed`)
          .set('Authorization', `Bearer ${tokenUserA}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.reusedChunks).toBe(res.body.data.totalChunks);
        expect(res.body.data.generatedChunks).toBe(0);
      },
      30000
    );
  });
});
