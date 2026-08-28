import { AnalyzedRepoResult } from './portfolioScorer.js';

export interface SkillEvidenceItem {
  skill: string;
  category: 'Strong Evidence' | 'Moderate Evidence' | 'GitHub Only' | 'Resume Only';
  repoCount: number;
  evidenceRepos: string[];
  recommendation: string;
}

export class SkillMatcher {
  /**
   * Match Parsed Resume Skills against GitHub Code Evidence
   */
  static matchResumeWithGitHub(
    resumeSkills: string[],
    githubRepos: AnalyzedRepoResult[]
  ): SkillEvidenceItem[] {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Map GitHub skills to repositories
    const githubSkillMap = new Map<string, { originalName: string; repos: Set<string> }>();

    githubRepos.forEach((repo) => {
      // Primary & secondary languages
      Object.keys(repo.languages).forEach((lang) => {
        const key = normalize(lang);
        if (!githubSkillMap.has(key)) {
          githubSkillMap.set(key, { originalName: lang, repos: new Set() });
        }
        githubSkillMap.get(key)?.repos.add(repo.name);
      });

      // Detected technologies
      repo.technologies.forEach((tech) => {
        const key = normalize(tech.name);
        if (!githubSkillMap.has(key)) {
          githubSkillMap.set(key, { originalName: tech.name, repos: new Set() });
        }
        githubSkillMap.get(key)?.repos.add(repo.name);
      });
    });

    const results: SkillEvidenceItem[] = [];
    const processedGitHubKeys = new Set<string>();

    // 1. Process Resume Skills
    resumeSkills.forEach((resumeSkill) => {
      const key = normalize(resumeSkill);
      const gitHubMatch = githubSkillMap.get(key);

      if (gitHubMatch) {
        processedGitHubKeys.add(key);
        const repoList = Array.from(gitHubMatch.repos);
        const isStrong = repoList.length >= 2;

        results.push({
          skill: resumeSkill,
          category: isStrong ? 'Strong Evidence' : 'Moderate Evidence',
          repoCount: repoList.length,
          evidenceRepos: repoList,
          recommendation: isStrong
            ? `Proven technical evidence in ${repoList.length} repository manifests.`
            : `Detected in 1 repository manifest.`,
        });
      } else {
        results.push({
          skill: resumeSkill,
          category: 'Resume Only',
          repoCount: 0,
          evidenceRepos: [],
          recommendation: `Listed on your resume, but strong GitHub code evidence was not detected.`,
        });
      }
    });

    // 2. Identify GitHub Only Skills (Technologies verified in code but missing on resume)
    githubSkillMap.forEach((val, key) => {
      if (!processedGitHubKeys.has(key)) {
        const repoList = Array.from(val.repos);
        results.push({
          skill: val.originalName,
          category: 'GitHub Only',
          repoCount: repoList.length,
          evidenceRepos: repoList,
          recommendation: `Consider adding ${val.originalName} to your resume if this accurately reflects your experience (proven in ${repoList.length} repositories).`,
        });
      }
    });

    return results;
  }
}
