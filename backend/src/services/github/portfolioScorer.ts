import { RawGitHubRepo } from './githubClient.js';
import { ExtractedRepoEvidence } from './evidenceExtractor.js';

export interface AnalyzedRepoResult {
  githubRepoId: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  primaryLanguage: string | null;
  topics: string[];
  languages: Record<string, number>;
  technologies: Array<{ name: string; category: string; confidence: string }>;
  classification: string;
  relevanceScore: number;
  complexityScore: number;
  healthScore: number;
  documentationScore: number;
  testingScore: number;
  cicdScore: number;
}

export interface PortfolioAnalysisSummary {
  portfolioStrengthScore: number;
  technicalDepthScore: number;
  projectQualityScore: number;
  engineeringPracticesScore: number;
  documentationScore: number;
  testingScore: number;
  maintenanceScore: number;
  totalRepositoriesCount: number;
  analyzedRepositoriesCount: number;
  topLanguages: Array<{ language: string; percentage: number }>;
  detectedTechnologies: Array<{ name: string; category: string; confidence: string }>;
  strengths: string[];
  improvements: string[];
}

export class PortfolioScorer {
  /**
   * Classify repository category deterministically
   */
  static classifyRepository(repo: RawGitHubRepo | AnalyzedRepoResult, evidence: ExtractedRepoEvidence): string {
    const nameLower = repo.name.toLowerCase();
    const descLower = (repo.description || '').toLowerCase();
    const techNames = evidence.technologies.map(t => t.name.toLowerCase());
    const isFork = Boolean(('fork' in repo && repo.fork) || ('isFork' in repo && repo.isFork));

    if (techNames.some(t => ['pytorch', 'tensorflow', 'scikit-learn', 'pandas', 'numpy'].includes(t))) {
      return 'Machine Learning / AI';
    }
    if (techNames.includes('react') && techNames.includes('express')) {
      return 'Full Stack Web App';
    }
    if (techNames.some(t => ['react', 'next.js', 'vue', 'angular', 'tailwind css'].includes(t))) {
      return 'Frontend Web App';
    }
    if (techNames.some(t => ['express', 'nestjs', 'django', 'flask', 'fastapi'].includes(t))) {
      return 'Backend API / Service';
    }
    if (evidence.hasDockerfile || evidence.hasCIWorkflow) {
      return 'DevOps / Cloud Infrastructure';
    }
    if (nameLower.includes('cli') || nameLower.includes('tool')) {
      return 'CLI / Utility Tool';
    }
    if (isFork) {
      return 'Forked Repository';
    }
    if (nameLower.includes('tutorial') || nameLower.includes('practice') || nameLower.includes('course')) {
      return 'Tutorial / Practice';
    }

    return repo.primaryLanguage || ('language' in repo && repo.language) ? `${repo.primaryLanguage || (repo as any).language} Project` : 'Software Project';
  }

  /**
   * Calculate 0-100 Relevance Score
   */
  static calculateRelevanceScore(repo: RawGitHubRepo | AnalyzedRepoResult, evidence: ExtractedRepoEvidence): number {
    let score = 70;
    const isFork = Boolean(('fork' in repo && repo.fork) || ('isFork' in repo && repo.isFork));
    const isArchived = Boolean(('archived' in repo && repo.archived) || ('isArchived' in repo && repo.isArchived));

    if (isFork) score -= 40;
    if (isArchived) score -= 30;
    if (repo.size < 20) score -= 25; // Tiny/empty repo
    
    if (evidence.technologies.length > 2) score += 10;
    if (evidence.hasTests) score += 10;
    if (evidence.hasCIWorkflow) score += 10;
    if (evidence.documentationScore > 60) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate 0-100 Complexity Score
   */
  static calculateComplexityScore(repo: RawGitHubRepo | AnalyzedRepoResult, evidence: ExtractedRepoEvidence): number {
    let score = 35;

    // Source volume & languages
    const langCount = Object.keys(evidence.languages).length;
    score += Math.min(20, langCount * 5);

    // Technology breadth
    score += Math.min(25, evidence.technologies.length * 5);

    // Architecture depth signals
    if (evidence.hasDockerfile) score += 10;
    if (evidence.hasDockerCompose) score += 10;
    if (evidence.securityEvidence.length > 0) score += 10;

    return Math.max(10, Math.min(100, score));
  }

  /**
   * Calculate 0-100 Health Score
   */
  static calculateHealthScore(evidence: ExtractedRepoEvidence): number {
    const score = Math.round(
      evidence.documentationScore * 0.4 +
      evidence.testingScore * 0.3 +
      evidence.cicdScore * 0.3
    );
    return Math.max(10, Math.min(100, score));
  }

  /**
   * Calculate overall 0-100 Portfolio Strength Score across all repos
   */
  static calculatePortfolioStrength(repositories: AnalyzedRepoResult[]): PortfolioAnalysisSummary {
    if (repositories.length === 0) {
      return {
        portfolioStrengthScore: 0,
        technicalDepthScore: 0,
        projectQualityScore: 0,
        engineeringPracticesScore: 0,
        documentationScore: 0,
        testingScore: 0,
        maintenanceScore: 0,
        totalRepositoriesCount: 0,
        analyzedRepositoriesCount: 0,
        topLanguages: [],
        detectedTechnologies: [],
        strengths: ['Connect a GitHub account with public repositories to evaluate your portfolio.'],
        improvements: ['Upload public repositories to showcase your technical skills.'],
      };
    }

    const nonForks = repositories.filter(r => !r.isFork);
    const targetRepos = nonForks.length > 0 ? nonForks : repositories;

    // Aggregate metrics
    const avgComplexity = Math.round(targetRepos.reduce((acc, r) => acc + r.complexityScore, 0) / targetRepos.length);
    const avgHealth = Math.round(targetRepos.reduce((acc, r) => acc + r.healthScore, 0) / targetRepos.length);
    const avgDoc = Math.round(targetRepos.reduce((acc, r) => acc + r.documentationScore, 0) / targetRepos.length);
    const avgTesting = Math.round(targetRepos.reduce((acc, r) => acc + r.testingScore, 0) / targetRepos.length);
    const avgCicd = Math.round(targetRepos.reduce((acc, r) => acc + r.cicdScore, 0) / targetRepos.length);

    // Compute Overall Portfolio Strength Score (0-100)
    const portfolioStrengthScore = Math.round(
      avgComplexity * 0.35 +
      avgHealth * 0.30 +
      avgDoc * 0.15 +
      avgCicd * 0.10 +
      avgTesting * 0.10
    );

    // Aggregate language percentages
    const langTotals: Record<string, number> = {};
    targetRepos.forEach((repo) => {
      Object.entries(repo.languages).forEach(([lang, percent]) => {
        langTotals[lang] = (langTotals[lang] || 0) + percent;
      });
    });

    const totalLangWeight = Object.values(langTotals).reduce((a, b) => a + b, 0);
    const topLanguages = Object.entries(langTotals)
      .map(([language, sum]) => ({
        language,
        percentage: Math.round((sum / (totalLangWeight || 1)) * 1000) / 10,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Aggregate unique technologies
    const techMap = new Map<string, { name: string; category: string; confidence: string }>();
    targetRepos.forEach((r) => {
      r.technologies.forEach((t) => {
        if (!techMap.has(t.name)) {
          techMap.set(t.name, t);
        }
      });
    });
    const detectedTechnologies = Array.from(techMap.values());

    // Compute strengths & improvements
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (avgComplexity >= 65) strengths.push('✓ High technical complexity and multi-tier architecture detected across repositories.');
    if (detectedTechnologies.length >= 4) strengths.push(`✓ Demonstrated proficiency across ${detectedTechnologies.length} distinct frameworks & technologies.`);
    if (targetRepos.some(r => r.cicdScore > 50)) strengths.push('✓ Verified GitHub Actions CI/CD automated workflow integration.');
    if (avgDoc >= 60) strengths.push('✓ Solid README documentation and setup instructions provided.');

    if (avgTesting < 40) improvements.push('⚠ Add automated test suites (e.g. Jest, PyTest, JUnit) to increase portfolio quality.');
    if (!targetRepos.some(r => r.cicdScore > 50)) improvements.push('⚠ Implement GitHub Actions CI/CD build workflows for automated testing.');
    if (avgDoc < 50) improvements.push('⚠ Enhance project README files with setup guides, architecture diagrams, and usage examples.');

    if (strengths.length === 0) strengths.push('✓ GitHub repositories discovered and analyzed.');
    if (improvements.length === 0) improvements.push('✓ Outstanding engineering practices detected across your GitHub repositories!');

    return {
      portfolioStrengthScore: Math.max(10, Math.min(100, portfolioStrengthScore)),
      technicalDepthScore: avgComplexity,
      projectQualityScore: avgHealth,
      engineeringPracticesScore: Math.round((avgTesting + avgCicd) / 2),
      documentationScore: avgDoc,
      testingScore: avgTesting,
      maintenanceScore: 80,
      totalRepositoriesCount: repositories.length,
      analyzedRepositoriesCount: targetRepos.length,
      topLanguages,
      detectedTechnologies,
      strengths,
      improvements,
    };
  }
}
