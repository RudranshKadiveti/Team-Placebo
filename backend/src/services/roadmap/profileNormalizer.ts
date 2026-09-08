import { prisma } from '../../config/database.js';
import { normalizeSkillList, normalizeSkill } from './skillNormalizer.js';

export interface CandidateSkill {
  name: string;
  source: string[];
  confidence: number;
}

export interface UserProfile {
  skills: CandidateSkill[];
  github: {
    languages: string[];
    frameworks: string[];
    technologies: string[];
    repoTopics: string[];
    contributionActivity: Record<string, any>;
    notableRepositories: Array<{
      name: string;
      description?: string;
      primaryLanguage?: string;
      stars: number;
    }>;
  };
  resume: {
    skills: string[];
    roles: string[];
    experience: Array<{
      title?: string;
      company?: string;
      duration?: string;
      description?: string;
    }>;
    yearsOfExperience: number;
    education: string[];
    projects: Array<{
      name?: string;
      techStack?: string[];
      description?: string;
    }>;
  };
  hasProfileData: boolean;
  hasResume: boolean;
  hasGithub: boolean;
}

export async function extractUserProfile(userId: string): Promise<UserProfile> {
  // 1. Fetch latest structured resume
  const latestResume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { uploadedAt: 'desc' }
  });

  let rawResumeSkills: string[] = [];
  let roles: string[] = [];
  let experience: any[] = [];
  let education: string[] = [];
  let projects: any[] = [];
  let yearsOfExperience = 0;
  let hasResume = false;

  if (latestResume && latestResume.structuredContent) {
    hasResume = true;
    try {
      const parsed = JSON.parse(latestResume.structuredContent);
      rawResumeSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
      experience = Array.isArray(parsed.experience) ? parsed.experience : [];
      education = Array.isArray(parsed.education) ? parsed.education.map((e: any) => typeof e === 'string' ? e : e.degree || e.school || '') : [];
      projects = Array.isArray(parsed.projects) ? parsed.projects : [];

      roles = experience.map((exp: any) => exp.title || exp.role).filter(Boolean);
      yearsOfExperience = Math.min(15, Math.max(1, experience.length * 2));
    } catch (e) {
      console.warn('[ProfileNormalizer] Failed to parse resume structured content:', e);
    }
  }

  // 2. Fetch GitHub repos
  const githubConn = await prisma.gitHubConnection.findUnique({
    where: { userId },
    include: { repos: true }
  });

  const rawLanguages: string[] = [];
  const rawTopics: string[] = [];
  const notableRepositories: any[] = [];
  let hasGithub = false;

  if (githubConn && githubConn.repos && githubConn.repos.length > 0) {
    hasGithub = true;
    githubConn.repos.forEach((repo) => {
      if (repo.primaryLanguage) {
        rawLanguages.push(repo.primaryLanguage);
      }
      if (repo.topicsJson) {
        try {
          const topics = JSON.parse(repo.topicsJson);
          if (Array.isArray(topics)) {
            rawTopics.push(...topics);
          }
        } catch (e) {}
      }
      if (repo.stargazersCount > 0 || repo.name) {
        notableRepositories.push({
          name: repo.name,
          description: repo.description || undefined,
          primaryLanguage: repo.primaryLanguage || undefined,
          stars: repo.stargazersCount || 0
        });
      }
    });
  }

  const normalizedResumeSkills = normalizeSkillList(rawResumeSkills);
  const normalizedGithubLangs = normalizeSkillList(rawLanguages);
  const normalizedGithubTopics = normalizeSkillList(rawTopics);

  // Build unified confidence-scored skill profile
  const skillMap = new Map<string, CandidateSkill>();

  normalizedResumeSkills.forEach((s) => {
    skillMap.set(s.toLowerCase(), {
      name: s,
      source: ['resume'],
      confidence: 0.85
    });
  });

  [...normalizedGithubLangs, ...normalizedGithubTopics].forEach((s) => {
    const key = s.toLowerCase();
    if (skillMap.has(key)) {
      const existing = skillMap.get(key)!;
      if (!existing.source.includes('github')) {
        existing.source.push('github');
        existing.confidence = 0.95;
      }
    } else {
      skillMap.set(key, {
        name: s,
        source: ['github'],
        confidence: 0.80
      });
    }
  });

  const candidateSkills = Array.from(skillMap.values());

  return {
    skills: candidateSkills,
    github: {
      languages: normalizedGithubLangs,
      frameworks: [],
      technologies: [...normalizedGithubLangs, ...normalizedGithubTopics],
      repoTopics: normalizedGithubTopics,
      contributionActivity: { totalRepos: githubConn?.repos.length || 0 },
      notableRepositories: notableRepositories.slice(0, 5)
    },
    resume: {
      skills: normalizedResumeSkills,
      roles,
      experience,
      yearsOfExperience,
      education,
      projects
    },
    hasProfileData: hasResume || hasGithub,
    hasResume,
    hasGithub
  };
}
