import { prisma } from '../../config/database.js';
import { GitHubClient } from './githubClient.js';
import { EvidenceExtractor } from './evidenceExtractor.js';
import { PortfolioScorer, AnalyzedRepoResult, PortfolioAnalysisSummary } from './portfolioScorer.js';
import { SkillMatcher, SkillEvidenceItem } from './skillMatcher.js';
import { AISummarizer } from './aiSummarizer.js';

export interface GitHubStatusResponse {
  connected: boolean;
  username?: string;
  connectedAt?: Date;
  lastSyncedAt?: Date;
  lastAnalyzedAt?: Date;
  repoCount?: number;
}

export class GitHubService {
  /**
   * Get GitHub Connection Status for Authenticated User
   */
  static async getStatus(userId: string): Promise<GitHubStatusResponse> {
    const connection = await prisma.gitHubConnection.findUnique({
      where: { userId },
      include: {
        _count: { select: { repos: true } },
      },
    });

    if (!connection) {
      return { connected: false };
    }

    return {
      connected: true,
      username: connection.username,
      connectedAt: connection.connectedAt,
      lastSyncedAt: connection.lastSyncedAt || undefined,
      lastAnalyzedAt: connection.lastAnalyzedAt || undefined,
      repoCount: connection._count.repos,
    };
  }

  /**
   * Connect GitHub Account by Username / Token
   */
  static async connect(userId: string, username: string, accessToken?: string) {
    const cleanUsername = username.trim();

    // Verify user exists on GitHub
    const githubUser = await GitHubClient.getUser(cleanUsername, accessToken);

    const connection = await prisma.gitHubConnection.upsert({
      where: { userId },
      create: {
        userId,
        username: githubUser.login,
        githubUserId: githubUser.id.toString(),
        accessTokenEncrypted: accessToken || null,
        connectedAt: new Date(),
      },
      update: {
        username: githubUser.login,
        githubUserId: githubUser.id.toString(),
        accessTokenEncrypted: accessToken || null,
        tokenUpdatedAt: new Date(),
      },
    });

    // Automatically trigger initial synchronization
    await this.syncRepositories(userId);

    return {
      success: true,
      message: `GitHub account '${githubUser.login}' connected successfully!`,
      username: githubUser.login,
      avatarUrl: githubUser.avatar_url,
    };
  }

  /**
   * Synchronize & Analyze User GitHub Repositories
   */
  static async syncRepositories(userId: string) {
    const connection = await prisma.gitHubConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new Error('GitHub account is not connected. Please connect your GitHub account first.');
    }

    const rawRepos = await GitHubClient.getUserRepositories(connection.username, connection.accessTokenEncrypted || undefined);

    for (const rawRepo of rawRepos) {
      const evidence = await EvidenceExtractor.extractRepositoryEvidence(
        rawRepo.owner.login,
        rawRepo,
        connection.accessTokenEncrypted || undefined
      );

      const classification = PortfolioScorer.classifyRepository(rawRepo, evidence);
      const relevanceScore = PortfolioScorer.calculateRelevanceScore(rawRepo, evidence);
      const complexityScore = PortfolioScorer.calculateComplexityScore(rawRepo, evidence);
      const healthScore = PortfolioScorer.calculateHealthScore(evidence);

      const analysisPayload = {
        languages: evidence.languages,
        technologies: evidence.technologies,
        hasDockerfile: evidence.hasDockerfile,
        hasDockerCompose: evidence.hasDockerCompose,
        hasCIWorkflow: evidence.hasCIWorkflow,
        hasTests: evidence.hasTests,
        testFrameworks: evidence.testFrameworks,
        securityEvidence: evidence.securityEvidence,
        readmeLength: evidence.readmeLength,
      };

      await prisma.gitHubRepository.upsert({
        where: {
          userId_githubRepoId: {
            userId,
            githubRepoId: rawRepo.id,
          },
        },
        create: {
          userId,
          connectionId: connection.id,
          githubRepoId: rawRepo.id,
          name: rawRepo.name,
          fullName: rawRepo.full_name,
          description: rawRepo.description,
          htmlUrl: rawRepo.html_url,
          cloneUrl: rawRepo.clone_url,
          defaultBranch: rawRepo.default_branch || 'main',
          isPrivate: rawRepo.private || false,
          isFork: rawRepo.fork || false,
          isArchived: rawRepo.archived || false,
          createdAt: new Date(rawRepo.created_at),
          updatedAt: new Date(rawRepo.updated_at),
          pushedAt: new Date(rawRepo.pushed_at),
          size: rawRepo.size || 0,
          stargazersCount: rawRepo.stargazers_count || 0,
          watchersCount: rawRepo.watchers_count || 0,
          forksCount: rawRepo.forks_count || 0,
          openIssuesCount: rawRepo.open_issues_count || 0,
          primaryLanguage: rawRepo.language,
          topicsJson: JSON.stringify(rawRepo.topics || []),
          languagesJson: JSON.stringify(evidence.languages),
          dependenciesJson: JSON.stringify(evidence.technologies),
          relevanceScore,
          classification,
          complexityScore,
          healthScore,
          documentationScore: evidence.documentationScore,
          testingScore: evidence.testingScore,
          cicdScore: evidence.cicdScore,
          analysisJson: JSON.stringify(analysisPayload),
          lastSyncedAt: new Date(),
        },
        update: {
          name: rawRepo.name,
          fullName: rawRepo.full_name,
          description: rawRepo.description,
          htmlUrl: rawRepo.html_url,
          isFork: rawRepo.fork || false,
          isArchived: rawRepo.archived || false,
          pushedAt: new Date(rawRepo.pushed_at),
          size: rawRepo.size || 0,
          stargazersCount: rawRepo.stargazers_count || 0,
          primaryLanguage: rawRepo.language,
          topicsJson: JSON.stringify(rawRepo.topics || []),
          languagesJson: JSON.stringify(evidence.languages),
          dependenciesJson: JSON.stringify(evidence.technologies),
          relevanceScore,
          classification,
          complexityScore,
          healthScore,
          documentationScore: evidence.documentationScore,
          testingScore: evidence.testingScore,
          cicdScore: evidence.cicdScore,
          analysisJson: JSON.stringify(analysisPayload),
          lastSyncedAt: new Date(),
        },
      });
    }

    await prisma.gitHubConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        lastAnalyzedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Successfully synchronized and analyzed ${rawRepos.length} GitHub repositories!`,
      syncedCount: rawRepos.length,
    };
  }

  /**
   * Get Full Portfolio Intelligence Report & Resume Skill Evidence Match
   */
  static async getPortfolioAnalysis(userId: string) {
    const repos = await prisma.gitHubRepository.findMany({
      where: { userId },
      orderBy: { relevanceScore: 'desc' },
    });

    const mappedRepos: AnalyzedRepoResult[] = repos.map((r) => ({
      githubRepoId: r.githubRepoId,
      name: r.name,
      fullName: r.fullName,
      description: r.description,
      htmlUrl: r.htmlUrl,
      defaultBranch: r.defaultBranch,
      isPrivate: r.isPrivate,
      isFork: r.isFork,
      isArchived: r.isArchived,
      isTemplate: r.isTemplate,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      pushedAt: r.pushedAt.toISOString(),
      size: r.size,
      stargazersCount: r.stargazersCount,
      forksCount: r.forksCount,
      openIssuesCount: r.openIssuesCount,
      primaryLanguage: r.primaryLanguage,
      topics: r.topicsJson ? JSON.parse(r.topicsJson) : [],
      languages: r.languagesJson ? JSON.parse(r.languagesJson) : {},
      technologies: r.dependenciesJson ? JSON.parse(r.dependenciesJson) : [],
      classification: r.classification,
      relevanceScore: r.relevanceScore,
      complexityScore: r.complexityScore,
      healthScore: r.healthScore,
      documentationScore: r.documentationScore,
      testingScore: r.testingScore,
      cicdScore: r.cicdScore,
    }));

    const portfolioSummary = PortfolioScorer.calculatePortfolioStrength(mappedRepos);

    // Fetch user's latest parsed resume skills for skill matching
    let resumeSkills: string[] = [];
    const latestResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });

    if (latestResume && latestResume.structuredContent) {
      try {
        const parsed = JSON.parse(latestResume.structuredContent);
        if (Array.isArray(parsed.skills)) {
          resumeSkills = parsed.skills;
        } else if (parsed.skills && typeof parsed.skills === 'object') {
          Object.values(parsed.skills).forEach((val) => {
            if (Array.isArray(val)) resumeSkills.push(...val);
          });
        }
      } catch {
        // Fallback gracefully
      }
    }

    const skillEvidenceMatrix: SkillEvidenceItem[] = SkillMatcher.matchResumeWithGitHub(
      resumeSkills,
      mappedRepos
    );

    return {
      portfolio: portfolioSummary,
      skillMatrix: skillEvidenceMatrix,
      topRepositories: mappedRepos.slice(0, 6),
    };
  }

  /**
   * Get Repository Detail with AI Resume Bullets
   */
  static async getRepositoryDetail(userId: string, repoId: string) {
    const repo = await prisma.gitHubRepository.findFirst({
      where: { userId, id: repoId },
    });

    if (!repo) {
      throw new Error('Repository not found or unauthorized access.');
    }

    const mappedRepo: AnalyzedRepoResult = {
      githubRepoId: repo.githubRepoId,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      htmlUrl: repo.htmlUrl,
      defaultBranch: repo.defaultBranch,
      isPrivate: repo.isPrivate,
      isFork: repo.isFork,
      isArchived: repo.isArchived,
      isTemplate: repo.isTemplate,
      createdAt: repo.createdAt.toISOString(),
      updatedAt: repo.updatedAt.toISOString(),
      pushedAt: repo.pushedAt.toISOString(),
      size: repo.size,
      stargazersCount: repo.stargazersCount,
      forksCount: repo.forksCount,
      openIssuesCount: repo.openIssuesCount,
      primaryLanguage: repo.primaryLanguage,
      topics: repo.topicsJson ? JSON.parse(repo.topicsJson) : [],
      languages: repo.languagesJson ? JSON.parse(repo.languagesJson) : {},
      technologies: repo.dependenciesJson ? JSON.parse(repo.dependenciesJson) : [],
      classification: repo.classification,
      relevanceScore: repo.relevanceScore,
      complexityScore: repo.complexityScore,
      healthScore: repo.healthScore,
      documentationScore: repo.documentationScore,
      testingScore: repo.testingScore,
      cicdScore: repo.cicdScore,
    };

    const bullets = await AISummarizer.generateProjectBullet(mappedRepo);

    return {
      repository: mappedRepo,
      analysis: repo.analysisJson ? JSON.parse(repo.analysisJson) : {},
      bullets,
    };
  }

  /**
   * Disconnect GitHub Account
   */
  static async disconnect(userId: string) {
    await prisma.gitHubConnection.deleteMany({
      where: { userId },
    });
    return {
      success: true,
      message: 'GitHub account disconnected successfully.',
    };
  }
}
