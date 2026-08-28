import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Phase 4E — AI Resume Tailoring & Role Analysis API Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testResumeId: string;

  const testUser = {
    name: 'Tailor Test User',
    email: 'tailortest@example.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: testUser.email.toLowerCase() },
      });
    } catch {
      // Ignore if clean
    }

    const regRes = await request(app).post('/api/auth/register').send(testUser);
    authToken = regRes.body.data.token;
    testUserId = regRes.body.data.user.id;

    // Create a mock resume record
    const resume = await prisma.resume.create({
      data: {
        userId: testUserId,
        originalFileName: 'test_resume.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        storageKey: 'resumes/test_resume.pdf',
        rawText: 'Experienced Software Engineer proficient in React, TypeScript, Node.js, PostgreSQL. Built web applications.',
        structuredContent: JSON.stringify({
          summary: 'Experienced Software Engineer',
          skills: 'React, TypeScript, Node.js, PostgreSQL',
          experience: 'Developed web applications using React and Node.js',
          education: 'BS in Computer Science',
          projects: 'Fullstack E-commerce platform',
          certifications: 'AWS Certified Developer',
        }),
      },
    });
    testResumeId = resume.id;
  });

  afterAll(async () => {
    try {
      await prisma.resume.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { email: testUser.email.toLowerCase() } });
      await prisma.$disconnect();
    } catch {
      // Ignore cleanup error
    }
  });

  describe('POST /api/resume/tailor-bullet', () => {
    it('should tailor a weak bullet point into strong Action Verb structure', async () => {
      const res = await request(app)
        .post('/api/resume/tailor-bullet')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bulletText: 'Worked on a web application using React and Node.js.',
          targetRoleTitle: 'Senior Full-Stack Engineer',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('original');
      expect(res.body.data).toHaveProperty('rewritten');
      expect(res.body.data).toHaveProperty('improvements');
      expect(res.body.data).toHaveProperty('keywords_added');
      expect(res.body.data).toHaveProperty('missing_information');
      expect(Array.isArray(res.body.data.improvements)).toBe(true);
    });

    it('should reject requests with short or empty bullet text', async () => {
      const res = await request(app)
        .post('/api/resume/tailor-bullet')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bulletText: 'a',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/resume/analyze-role', () => {
    it('should perform target role analysis against parsed resume', async () => {
      const res = await request(app)
        .post('/api/resume/analyze-role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resumeId: testResumeId,
          targetRoleTitle: 'Backend Developer',
          targetJobDescription: 'Seeking a Backend Developer with expertise in Node.js, Docker, Kubernetes, and PostgreSQL.',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overallMatchScore');
      expect(res.body.data).toHaveProperty('scoreBreakdown');
      expect(res.body.data).toHaveProperty('strongMatches');
      expect(res.body.data).toHaveProperty('skillGaps');
      expect(res.body.data).toHaveProperty('missingKeywords');
    });

    it('should reject role analysis when neither job title nor job description is provided', async () => {
      const res = await request(app)
        .post('/api/resume/analyze-role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resumeId: testResumeId,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/resume/action-plan', () => {
    it('should generate a structured gap-bridging action plan roadmap', async () => {
      const res = await request(app)
        .post('/api/resume/action-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetRoleTitle: 'Backend Developer',
          skillGaps: [
            { skill: 'Docker', importance: 'Required', isExplicit: true },
          ],
          missingKeywords: ['Docker', 'Kubernetes'],
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('skill');
      expect(res.body.data[0]).toHaveProperty('priority');
      expect(res.body.data[0]).toHaveProperty('action');
      expect(res.body.data[0]).toHaveProperty('project_idea');
      expect(res.body.data[0]).toHaveProperty('evidence_to_add');
      expect(res.body.data[0]).toHaveProperty('estimated_effort');
    });
  });
});
