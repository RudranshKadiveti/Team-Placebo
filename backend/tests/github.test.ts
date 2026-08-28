import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { generateToken } from '../src/services/auth.service.js';
import { EvidenceExtractor } from '../src/services/github/evidenceExtractor.js';
import { PortfolioScorer } from '../src/services/github/portfolioScorer.js';
import { SkillMatcher } from '../src/services/github/skillMatcher.js';

describe('Phase 8 — GitHub Repository & Portfolio Intelligence Suite', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'GitHub Test User',
        email: `github_test_${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
      },
    });
    userId = user.id;
    authToken = generateToken({ id: user.id, email: user.email, name: user.name });
  });

  afterAll(async () => {
    await prisma.gitHubRepository.deleteMany({ where: { userId } });
    await prisma.gitHubConnection.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  describe('1. Programmatic Evidence Extraction & Language Calculations', () => {
    it('should accurately calculate language percentages from byte counts', () => {
      const bytes = { JavaScript: 5000, TypeScript: 3000, HTML: 2000 };
      const percentages = EvidenceExtractor.calculateLanguagePercentages(bytes);

      expect(percentages.JavaScript).toBe(50);
      expect(percentages.TypeScript).toBe(30);
      expect(percentages.HTML).toBe(20);
    });

    it('should return empty object for 0 total language bytes', () => {
      const percentages = EvidenceExtractor.calculateLanguagePercentages({});
      expect(percentages).toEqual({});
    });
  });

  describe('2. Portfolio Scoring & Classification Logic', () => {
    const mockRepo: any = {
      id: 101,
      name: 'react-express-app',
      description: 'A full stack application',
      fork: false,
      archived: false,
      size: 500,
      language: 'TypeScript',
    };

    const mockEvidence: any = {
      languages: { TypeScript: 60, JavaScript: 40 },
      technologies: [
        { name: 'React', category: 'Frontend', confidence: 'High' },
        { name: 'Express', category: 'Backend', confidence: 'High' },
        { name: 'Docker', category: 'DevOps', confidence: 'High' },
      ],
      hasDockerfile: true,
      hasDockerCompose: false,
      hasCIWorkflow: true,
      hasTests: true,
      documentationScore: 80,
      testingScore: 70,
      cicdScore: 75,
    };

    it('should correctly classify full stack application', () => {
      const classification = PortfolioScorer.classifyRepository(mockRepo, mockEvidence);
      expect(classification).toBe('Full Stack Web App');
    });

    it('should calculate high relevance score for active original project', () => {
      const relevance = PortfolioScorer.calculateRelevanceScore(mockRepo, mockEvidence);
      expect(relevance).toBeGreaterThanOrEqual(70);
    });

    it('should penalize forked repositories in relevance score', () => {
      const forkedRepo = { ...mockRepo, fork: true };
      const relevance = PortfolioScorer.calculateRelevanceScore(forkedRepo, mockEvidence);
      expect(relevance).toBeLessThan(70);
    });

    it('should calculate overall Portfolio Strength Score (0-100)', () => {
      const analyzedRepos: any[] = [
        {
          githubRepoId: 101,
          name: 'project-1',
          classification: 'Full Stack Web App',
          relevanceScore: 90,
          complexityScore: 85,
          healthScore: 80,
          documentationScore: 80,
          testingScore: 70,
          cicdScore: 75,
          isFork: false,
          languages: { TypeScript: 70, Python: 30 },
          technologies: [{ name: 'React', category: 'Frontend' }, { name: 'Express', category: 'Backend' }],
        },
      ];

      const portfolio = PortfolioScorer.calculatePortfolioStrength(analyzedRepos);

      expect(portfolio.portfolioStrengthScore).toBeGreaterThanOrEqual(0);
      expect(portfolio.portfolioStrengthScore).toBeLessThanOrEqual(100);
      expect(portfolio.topLanguages.length).toBeGreaterThan(0);
      expect(portfolio.strengths.length).toBeGreaterThan(0);
    });
  });

  describe('3. Resume ↔ GitHub Skill Evidence Matrix Matching', () => {
    it('should classify skills into Strong Evidence, Moderate Evidence, and GitHub Only', () => {
      const resumeSkills = ['React', 'Python', 'Kubernetes'];
      const githubRepos: any[] = [
        {
          name: 'repo-1',
          languages: { Python: 100 },
          technologies: [{ name: 'React' }],
        },
        {
          name: 'repo-2',
          languages: { JavaScript: 100 },
          technologies: [{ name: 'React' }, { name: 'Docker' }],
        },
      ];

      const matrix = SkillMatcher.matchResumeWithGitHub(resumeSkills, githubRepos);

      const reactMatch = matrix.find((m) => m.skill === 'React');
      expect(reactMatch?.category).toBe('Strong Evidence');
      expect(reactMatch?.repoCount).toBe(2);

      const k8sMatch = matrix.find((m) => m.skill === 'Kubernetes');
      expect(k8sMatch?.category).toBe('Resume Only');

      const dockerMatch = matrix.find((m) => m.skill === 'Docker');
      expect(dockerMatch?.category).toBe('GitHub Only');
    });
  });

  describe('4. GitHub Express REST API Endpoints', () => {
    it('GET /api/github/status — should return disconnected status initially', async () => {
      const res = await request(app)
        .get('/api/github/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connected).toBe(false);
    });

    it('POST /api/github/connect — should reject request missing username', async () => {
      const res = await request(app)
        .post('/api/github/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('DELETE /api/github/disconnect — should disconnect user account', async () => {
      const res = await request(app)
        .delete('/api/github/disconnect')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });
});
