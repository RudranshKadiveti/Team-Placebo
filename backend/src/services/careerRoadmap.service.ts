import OpenAI from 'openai';
import { prisma } from '../config/database.js';
import { extractUserProfile, UserProfile } from './roadmap/profileNormalizer.js';
import { extractJobRequirements, JobRequirements } from './roadmap/jobRequirementExtractor.js';
import { matchSkills, DeterministicMatchOutput } from './roadmap/skillMatcher.js';
import { GeneratedRoadmap, roadmapZodSchema } from './roadmap/roadmapSchema.js';

const getOpenAIClient = (): OpenAI | null => {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() });
  }
  return null;
};

export interface JobDataInput {
  id?: string;
  title: string;
  company?: string;
  description?: string;
  tags?: string[];
  skills?: string[];
  url?: string;
}

export class CareerRoadmapService {
  /**
   * Generates or retrieves a cached structured roadmap for a specific job & user.
   */
  static async getOrGenerateRoadmap(
    userId: string,
    job: JobDataInput,
    forceRegenerate: boolean = false
  ): Promise<GeneratedRoadmap> {
    const jobId = job.id || `job-${Buffer.from(job.title + (job.company || '')).toString('base64').substring(0, 16)}`;

    // 1. Cache Check
    if (!forceRegenerate) {
      const cached = await prisma.careerRoadmap.findFirst({
        where: { userId, jobId }
      });

      if (cached && cached.roadmapContent) {
        try {
          const parsed = JSON.parse(cached.roadmapContent);
          const validated = roadmapZodSchema.safeParse(parsed);
          if (validated.success) {
            console.log(`[CareerRoadmapService] Returning cached roadmap for user ${userId}, job ${jobId}`);
            return validated.data;
          }
        } catch (e) {
          console.warn('[CareerRoadmapService] Cached roadmap failed Zod validation, regenerating...');
        }
      }
    }

    // 2. Extract Candidate Profile & Job Requirements
    const userProfile = await extractUserProfile(userId);
    const jobReqs = extractJobRequirements({
      title: job.title,
      description: job.description || '',
      tags: job.tags,
      skills: job.skills
    });

    // 3. Deterministic Skill Matching
    const skillMatch = matchSkills(userProfile, jobReqs);

    // DEBUG LOGGING
    console.log('\n==================== [ROADMAP DEBUG] ====================');
    console.log(`JOB TITLE: ${job.title}`);
    console.log(`JOB ID: ${jobId}`);
    console.log(`COMPANY: ${job.company || 'N/A'}`);
    console.log(`JOB DESCRIPTION LENGTH: ${job.description?.length || 0} characters`);
    console.log(`EXTRACTED REQUIREMENTS (${jobReqs.technicalSkills.length} skills):`, jobReqs.technicalSkills.map(s => `${s.skill} (${s.importance})`));
    console.log(`USER SKILLS (${userProfile.skills.length} skills):`, userProfile.skills.map(s => `${s.name} [${s.source.join('/')}]`));
    console.log(`DETERMINISTIC MATCH RESULTS: Matched=${skillMatch.matchedSkills.length}, Partials=${skillMatch.partialMatches.length}, Gaps=${skillMatch.skillGaps.length}`);
    console.log(`CALCULATED READINESS SCORE: ${skillMatch.readinessScore}%`);
    console.log('=========================================================\n');

    // 4. Generate Roadmap via LLM (or Fallback)
    const generatedRoadmap = await this.generateRoadmapWithLLM(job, jobReqs, userProfile, skillMatch);

    // 5. Save/Update Cache in Database
    try {
      await prisma.careerRoadmap.upsert({
        where: {
          userId_jobId: { userId, jobId }
        },
        update: {
          targetRole: job.title,
          jobTitle: job.title,
          targetCompany: job.company || 'Unknown Company',
          jobUrl: job.url || '',
          roadmapContent: JSON.stringify(generatedRoadmap),
          updatedAt: new Date()
        },
        create: {
          userId,
          jobId,
          targetRole: job.title,
          jobTitle: job.title,
          targetCompany: job.company || 'Unknown Company',
          jobUrl: job.url || '',
          roadmapContent: JSON.stringify(generatedRoadmap),
          model: 'gpt-4o-mini',
          profileVersion: 'v1'
        }
      });
    } catch (dbErr) {
      console.warn('[CareerRoadmapService] Failed to cache roadmap in DB:', dbErr);
    }

    return generatedRoadmap;
  }

  /**
   * Generates a validated JSON roadmap comparing job requirements against user profile.
   */
  private static async generateRoadmapWithLLM(
    job: JobDataInput,
    jobReqs: JobRequirements,
    userProfile: UserProfile,
    skillMatch: DeterministicMatchOutput
  ): Promise<GeneratedRoadmap> {
    const client = getOpenAIClient();

    if (!client) {
      return this.generateFallbackRoadmap(job, jobReqs, userProfile, skillMatch);
    }

    try {
      console.log(`[CareerRoadmapService] Calling OpenAI for job-specific roadmap: ${job.title}`);

      const systemPrompt = `You are an expert technical career advisor.

Analyze the candidate against the SPECIFIC TARGET JOB provided below.

TARGET JOB:
${job.title}

COMPANY:
${job.company || 'Target Employer'}

JOB DESCRIPTION:
${(job.description || '').substring(0, 3000)}

EXTRACTED JOB REQUIREMENTS:
${JSON.stringify(jobReqs, null, 2)}

CANDIDATE PROFILE:
${JSON.stringify({
  skills: userProfile.skills,
  githubRepos: userProfile.github.notableRepositories,
  resumeExperience: userProfile.resume.experience,
  resumeProjects: userProfile.resume.projects
}, null, 2)}

DETERMINISTIC SKILL MATCH:
${JSON.stringify(skillMatch, null, 2)}

Your task is to determine exactly what this candidate needs to learn to become competitive for THIS SPECIFIC JOB.

Rules:
1. Base your analysis primarily on the actual job description and extracted requirements.
2. Do not generate a generic roadmap based only on the job title.
3. Do not assume the candidate knows a technology unless there is evidence in the candidate profile.
4. Do not claim the candidate lacks a skill if there is credible evidence that they possess it.
5. Distinguish between confirmed skills, partially demonstrated skills, and missing skills.
6. Prioritize skills according to how important they are to THIS job.
7. Do not recommend technologies that are unrelated to this job.
8. Do not recommend learning skills the candidate already demonstrates unless deeper proficiency is required.
9. Consider dependencies between skills when ordering the learning path.
10. The roadmap must be actionable and specific.
11. Recommend projects or practical exercises that directly prepare the candidate for this job.
12. Estimate realistic learning time based on the candidate's existing knowledge.
13. If the candidate is already strong in a required skill, move past basic material.
14. If the job description does not mention a technology, do not invent it as a requirement.
15. Return ONLY valid JSON matching this exact schema:

{
  "jobAnalysis": {
    "role": "${job.title}",
    "readinessPercentage": ${skillMatch.readinessScore},
    "summary": "Detailed summary explaining candidate alignment for ${job.title} at ${job.company || 'employer'}.",
    "keyStrengths": ["List of candidate's key matching skills"],
    "whyThisRoadmap": "You already have: [X, Y]. This job additionally requires: [A, B]. Therefore your roadmap focuses on: [A -> B]."
  },
  "matchedSkills": [
    { "skill": "React", "evidence": "Verified in GitHub & Resume", "confidence": "high" }
  ],
  "skillGaps": [
    {
      "skill": "TypeScript",
      "priority": "high",
      "reason": "Required for target role codebase",
      "jobEvidence": "Strong TypeScript experience required in job description",
      "currentLevel": "beginner",
      "targetLevel": "advanced"
    }
  ],
  "learningPath": [
    {
      "order": 1,
      "title": "Master TypeScript for Enterprise React Applications",
      "reason": "Directly required by ${job.title} posting at ${job.company || 'employer'}.",
      "skillsCovered": ["TypeScript"],
      "estimatedTime": "1 week",
      "prerequisites": ["JavaScript"],
      "topics": ["Generics", "Strict Null Checks", "React Props Typing"],
      "project": "Convert a React component library to strict TypeScript",
      "resources": [
        { "title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/", "type": "documentation" }
      ]
    }
  ],
  "finalAssessment": {
    "biggestGap": "Name of biggest technical gap",
    "mostImportantNextStep": "First actionable step",
    "estimatedTimeToBecomeCompetitive": "3-5 weeks"
  }
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const rawJsonText = response.choices[0]?.message?.content || '{}';
      console.log('\n[ROADMAP DEBUG] FINAL LLM RESPONSE RECEIVED length:', rawJsonText.length);

      const parsedJson = JSON.parse(rawJsonText);
      const validated = roadmapZodSchema.safeParse(parsedJson);

      if (validated.success) {
        return validated.data;
      }

      console.warn('[CareerRoadmapService] LLM output failed Zod schema validation:', validated.error.format());
      return this.generateFallbackRoadmap(job, jobReqs, userProfile, skillMatch);
    } catch (err: any) {
      console.error('[CareerRoadmapService] OpenAI API error during roadmap generation:', err);
      return this.generateFallbackRoadmap(job, jobReqs, userProfile, skillMatch);
    }
  }

  /**
   * Deterministic, 100% validated job-specific fallback roadmap generator.
   */
  private static generateFallbackRoadmap(
    job: JobDataInput,
    jobReqs: JobRequirements,
    userProfile: UserProfile,
    skillMatch: DeterministicMatchOutput
  ): GeneratedRoadmap {
    const matched = skillMatch.matchedSkills.length > 0
      ? skillMatch.matchedSkills
      : [{ skill: 'Core Software Development', evidence: 'Verified in candidate profile', confidence: 'high' as const }];

    const gaps = skillMatch.skillGaps.length > 0
      ? skillMatch.skillGaps
      : jobReqs.technicalSkills.map((req, i) => ({
          skill: req.skill,
          priority: i === 0 ? ('high' as const) : ('medium' as const),
          reason: `Required for ${job.title} posting`,
          jobEvidence: req.evidence,
          currentLevel: 'none' as const,
          targetLevel: 'advanced' as const
        }));

    const topGaps = gaps.slice(0, 3);
    const matchedNames = matched.map(m => m.skill);
    const gapNames = topGaps.map(g => g.skill);

    const whyThisRoadmap = `You already have: ${matchedNames.slice(0, 3).join(', ') || 'General Development'}. This job posting specifically requires: ${gapNames.join(', ') || 'Domain Stack'}. Therefore your roadmap focuses on mastering ${gapNames[0] || 'target tech'} followed by building a project tailored for ${job.company || 'this role'}.`;

    return {
      jobAnalysis: {
        role: job.title,
        readinessPercentage: skillMatch.readinessScore,
        summary: `Targeted match for ${job.title} at ${job.company || 'employer'}. You possess solid foundational skills in ${matchedNames.slice(0, 2).join(', ') || 'software development'}, and closing your gaps in ${gapNames.slice(0, 2).join(' & ')} will make you competitive for this specific role.`,
        keyStrengths: matchedNames.slice(0, 4),
        whyThisRoadmap
      },
      matchedSkills: matched,
      skillGaps: gaps,
      learningPath: topGaps.map((gap, index) => ({
        order: index + 1,
        title: `Master ${gap.skill} for ${job.title}`,
        reason: `Directly specified in ${job.company || 'employer'} posting: ${gap.reason}`,
        skillsCovered: [gap.skill],
        estimatedTime: gap.priority === 'high' ? '1 week' : '3-5 days',
        prerequisites: matchedNames.slice(0, 2),
        topics: [`Core ${gap.skill} concepts`, `Architecture patterns`, `Production deployment`],
        project: `Build a production-grade ${gap.skill} module tailored for ${job.title} workflows`,
        resources: [
          {
            title: `${gap.skill} Official Documentation`,
            url: 'https://developer.mozilla.org',
            type: 'documentation'
          }
        ]
      })),
      finalAssessment: {
        biggestGap: topGaps[0]?.skill || 'Advanced Domain Architecture',
        mostImportantNextStep: `Start Milestone 1: Master ${topGaps[0]?.skill || 'Core Stack'}`,
        estimatedTimeToBecomeCompetitive: skillMatch.readinessScore > 75 ? '2-3 weeks' : '4-6 weeks'
      }
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  static async generateRoadmap(
    targetRole: string,
    jobTitle: string,
    jobDescription: string,
    userSkills: string[],
    githubSkills: string[]
  ): Promise<string> {
    const job: JobDataInput = { title: jobTitle, description: jobDescription };
    const userProfile: UserProfile = {
      skills: userSkills.concat(githubSkills).map(s => ({ name: s, source: ['resume'], confidence: 0.85 })),
      github: { languages: githubSkills, frameworks: [], technologies: githubSkills, repoTopics: [], contributionActivity: {}, notableRepositories: [] },
      resume: { skills: userSkills, roles: [], experience: [], yearsOfExperience: 2, education: [], projects: [] },
      hasProfileData: true,
      hasResume: true,
      hasGithub: true
    };
    const jobPayload = { title: jobTitle || targetRole, description: jobDescription || '' };
    const jobReqs = extractJobRequirements(jobPayload);
    const skillMatch = matchSkills(userProfile, jobReqs);
    const roadmap = await this.generateRoadmapWithLLM(jobPayload, jobReqs, userProfile, skillMatch);
    return JSON.stringify(roadmap, null, 2);
  }

  /**
   * Legacy method for backward compatibility
   */
  static async saveRoadmap(
    userId: string,
    targetRole: string,
    targetCompany: string,
    jobUrl: string,
    roadmapContent: string
  ) {
    return prisma.careerRoadmap.create({
      data: {
        userId,
        targetRole,
        targetCompany,
        jobUrl,
        roadmapContent
      }
    });
  }
}
