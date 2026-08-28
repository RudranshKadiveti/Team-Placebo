import { RawGitHubRepo, GitHubClient } from './githubClient.js';

export interface DetectedTechnology {
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'AI/ML' | 'Security' | 'Testing' | 'Other';
  confidence: 'High' | 'Medium' | 'Low';
  evidenceSource: string;
}

export interface ExtractedRepoEvidence {
  languages: Record<string, number>; // language -> percentage
  totalLanguageBytes: number;
  technologies: DetectedTechnology[];
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  hasCIWorkflow: boolean;
  hasTests: boolean;
  testFrameworks: string[];
  securityEvidence: string[];
  readmeLength: number;
  documentationScore: number;
  testingScore: number;
  cicdScore: number;
}

export class EvidenceExtractor {
  /**
   * Calculate exact language percentages from language bytes
   */
  static calculateLanguagePercentages(languageBytes: Record<string, number>): Record<string, number> {
    const totalBytes = Object.values(languageBytes).reduce((acc, bytes) => acc + bytes, 0);
    if (totalBytes === 0) return {};

    const percentages: Record<string, number> = {};
    for (const [lang, bytes] of Object.entries(languageBytes)) {
      percentages[lang] = Math.round((bytes / totalBytes) * 1000) / 10; // 1 decimal place
    }
    return percentages;
  }

  /**
   * Extract deep evidence from repository files and manifests
   */
  static async extractRepositoryEvidence(
    owner: string,
    repo: RawGitHubRepo,
    accessToken?: string
  ): Promise<ExtractedRepoEvidence> {
    const languageBytes = await GitHubClient.getRepoLanguages(owner, repo.name, accessToken);
    const totalLanguageBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);
    const languages = this.calculateLanguagePercentages(languageBytes);

    const technologies: DetectedTechnology[] = [];
    const securityEvidence: string[] = [];
    const testFrameworks: string[] = [];
    let hasDockerfile = false;
    let hasDockerCompose = false;
    let hasCIWorkflow = false;
    let hasTests = false;

    // Check README
    const readmeText = (await GitHubClient.getRepoFileContent(owner, repo.name, 'README.md', accessToken)) ||
      (await GitHubClient.getRepoFileContent(owner, repo.name, 'readme.md', accessToken)) || '';
    
    const readmeLength = readmeText.length;

    // Check package.json (Node.js / Web)
    const packageJsonStr = await GitHubClient.getRepoFileContent(owner, repo.name, 'package.json', accessToken);
    if (packageJsonStr) {
      try {
        const pkg = JSON.parse(packageJsonStr);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

        technologies.push({ name: 'Node.js', category: 'Backend', confidence: 'High', evidenceSource: 'package.json' });

        if (allDeps.react) technologies.push({ name: 'React', category: 'Frontend', confidence: 'High', evidenceSource: 'package.json' });
        if (allDeps.next) technologies.push({ name: 'Next.js', category: 'Frontend', confidence: 'High', evidenceSource: 'package.json' });
        if (allDeps.vue) technologies.push({ name: 'Vue', category: 'Frontend', confidence: 'High', evidenceSource: 'package.json' });
        if (allDeps['@angular/core']) technologies.push({ name: 'Angular', category: 'Frontend', confidence: 'High', evidenceSource: 'package.json' });
        if (allDeps.tailwindcss) technologies.push({ name: 'Tailwind CSS', category: 'Frontend', confidence: 'High', evidenceSource: 'package.json' });
        
        if (allDeps.express) technologies.push({ name: 'Express', category: 'Backend', confidence: 'High', evidenceSource: 'package.json' });
        if (allDeps['@nestjs/core']) technologies.push({ name: 'NestJS', category: 'Backend', confidence: 'High', evidenceSource: 'package.json' });
        
        if (allDeps.pg || allDeps.postgres) technologies.push({ name: 'PostgreSQL', category: 'Database', confidence: 'High', evidenceSource: 'package.json' });
        if (allDeps.mongodb || allDeps.mongoose) technologies.push({ name: 'MongoDB', category: 'Database', confidence: 'High', evidenceSource: 'package.json' });
        if (allDeps.redis || allDeps.ioredis) technologies.push({ name: 'Redis', category: 'Database', confidence: 'High', evidenceSource: 'package.json' });
        if (allDeps['@prisma/client']) technologies.push({ name: 'Prisma ORM', category: 'Database', confidence: 'High', evidenceSource: 'package.json' });

        if (allDeps.jest || allDeps.vitest || allDeps.mocha || allDeps.cypress) {
          hasTests = true;
          if (allDeps.jest) testFrameworks.push('Jest');
          if (allDeps.vitest) testFrameworks.push('Vitest');
          if (allDeps.cypress) testFrameworks.push('Cypress');
          technologies.push({ name: 'Jest/Automated Testing', category: 'Testing', confidence: 'High', evidenceSource: 'package.json' });
        }

        if (allDeps.jsonwebtoken) securityEvidence.push('JWT Authentication (jsonwebtoken)');
        if (allDeps.bcrypt || allDeps.bcryptjs) securityEvidence.push('Bcrypt Password Hashing');
        if (allDeps.cors) securityEvidence.push('CORS Protection');
      } catch {
        // Fallback gracefully on invalid JSON
      }
    }

    // Check requirements.txt / pyproject.toml (Python)
    const reqsStr = await GitHubClient.getRepoFileContent(owner, repo.name, 'requirements.txt', accessToken);
    if (reqsStr) {
      const reqsLower = reqsStr.toLowerCase();
      if (reqsLower.includes('django')) technologies.push({ name: 'Django', category: 'Backend', confidence: 'High', evidenceSource: 'requirements.txt' });
      if (reqsLower.includes('flask')) technologies.push({ name: 'Flask', category: 'Backend', confidence: 'High', evidenceSource: 'requirements.txt' });
      if (reqsLower.includes('fastapi')) technologies.push({ name: 'FastAPI', category: 'Backend', confidence: 'High', evidenceSource: 'requirements.txt' });
      if (reqsLower.includes('torch') || reqsLower.includes('pytorch')) technologies.push({ name: 'PyTorch', category: 'AI/ML', confidence: 'High', evidenceSource: 'requirements.txt' });
      if (reqsLower.includes('tensorflow')) technologies.push({ name: 'TensorFlow', category: 'AI/ML', confidence: 'High', evidenceSource: 'requirements.txt' });
      if (reqsLower.includes('scikit-learn') || reqsLower.includes('sklearn')) technologies.push({ name: 'scikit-learn', category: 'AI/ML', confidence: 'High', evidenceSource: 'requirements.txt' });
      if (reqsLower.includes('pandas')) technologies.push({ name: 'Pandas', category: 'AI/ML', confidence: 'High', evidenceSource: 'requirements.txt' });
      if (reqsLower.includes('numpy')) technologies.push({ name: 'NumPy', category: 'AI/ML', confidence: 'High', evidenceSource: 'requirements.txt' });
      if (reqsLower.includes('pytest')) {
        hasTests = true;
        testFrameworks.push('PyTest');
        technologies.push({ name: 'PyTest', category: 'Testing', confidence: 'High', evidenceSource: 'requirements.txt' });
      }
    }

    // Check Docker & Docker-Compose
    const dockerfileStr = await GitHubClient.getRepoFileContent(owner, repo.name, 'Dockerfile', accessToken);
    if (dockerfileStr) {
      hasDockerfile = true;
      technologies.push({ name: 'Docker', category: 'DevOps', confidence: 'High', evidenceSource: 'Dockerfile' });
    }

    const composeStr = await GitHubClient.getRepoFileContent(owner, repo.name, 'docker-compose.yml', accessToken) ||
      await GitHubClient.getRepoFileContent(owner, repo.name, 'docker-compose.yaml', accessToken);
    if (composeStr) {
      hasDockerCompose = true;
      technologies.push({ name: 'Docker Compose', category: 'DevOps', confidence: 'High', evidenceSource: 'docker-compose.yml' });
    }

    // Check GitHub Workflows (CI/CD)
    const ciStr = await GitHubClient.getRepoFileContent(owner, repo.name, '.github/workflows/main.yml', accessToken) ||
      await GitHubClient.getRepoFileContent(owner, repo.name, '.github/workflows/ci.yml', accessToken) ||
      await GitHubClient.getRepoFileContent(owner, repo.name, '.github/workflows/build.yml', accessToken);
    if (ciStr) {
      hasCIWorkflow = true;
      technologies.push({ name: 'GitHub Actions (CI/CD)', category: 'DevOps', confidence: 'High', evidenceSource: '.github/workflows' });
    }

    // Add Primary Language as Technology
    if (repo.language && !technologies.some(t => t.name.toLowerCase() === repo.language?.toLowerCase())) {
      technologies.push({ name: repo.language, category: 'Backend', confidence: 'High', evidenceSource: 'Primary Language' });
    }

    // Deduplicate technologies
    const uniqueTechs = technologies.filter((tech, idx, self) =>
      idx === self.findIndex((t) => t.name.toLowerCase() === tech.name.toLowerCase())
    );

    // Calculate Documentation Score (0-100)
    let documentationScore = 0;
    if (readmeLength > 0) documentationScore += 30;
    if (readmeLength > 500) documentationScore += 25;
    if (readmeLength > 1500) documentationScore += 25;
    if (readmeText.toLowerCase().includes('installation') || readmeText.toLowerCase().includes('getting started')) documentationScore += 10;
    if (readmeText.toLowerCase().includes('usage') || readmeText.toLowerCase().includes('license')) documentationScore += 10;
    documentationScore = Math.min(100, documentationScore);

    // Calculate Testing Score (0-100)
    let testingScore = hasTests ? 60 : 10;
    if (testFrameworks.length > 1) testingScore += 20;
    if (hasCIWorkflow && hasTests) testingScore += 20;
    testingScore = Math.min(100, testingScore);

    // Calculate CI/CD Score (0-100)
    let cicdScore = hasCIWorkflow ? 70 : 10;
    if (hasDockerfile) cicdScore += 15;
    if (hasDockerCompose) cicdScore += 15;
    cicdScore = Math.min(100, cicdScore);

    return {
      languages,
      totalLanguageBytes,
      technologies: uniqueTechs,
      hasDockerfile,
      hasDockerCompose,
      hasCIWorkflow,
      hasTests,
      testFrameworks,
      securityEvidence,
      readmeLength,
      documentationScore,
      testingScore,
      cicdScore,
    };
  }
}
