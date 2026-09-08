import { z } from 'zod';

export const jobAnalysisSchema = z.object({
  role: z.string().min(1),
  readinessPercentage: z.number().min(0).max(100),
  summary: z.string().min(1),
  keyStrengths: z.array(z.string()).default([]),
  whyThisRoadmap: z.string().optional().default('')
});

export const matchedSkillSchema = z.object({
  skill: z.string().min(1),
  evidence: z.string().min(1),
  confidence: z.enum(['high', 'medium', 'low']).default('high')
});

export const skillGapSchema = z.object({
  skill: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  reason: z.string().min(1),
  jobEvidence: z.string().optional().default(''),
  currentLevel: z.enum(['none', 'beginner', 'intermediate', 'advanced']).default('none'),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate')
});

export const resourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal('')),
  type: z.enum(['documentation', 'tutorial', 'course', 'article', 'book']).default('documentation')
});

export const milestoneSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1),
  reason: z.string().min(1),
  skillsCovered: z.array(z.string()).default([]),
  estimatedTime: z.string().min(1),
  prerequisites: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  project: z.string().min(1),
  resources: z.array(resourceSchema).default([])
});

export const finalAssessmentSchema = z.object({
  biggestGap: z.string().min(1),
  mostImportantNextStep: z.string().min(1),
  estimatedTimeToBecomeCompetitive: z.string().min(1)
});

export const roadmapZodSchema = z.object({
  jobAnalysis: jobAnalysisSchema,
  matchedSkills: z.array(matchedSkillSchema).default([]),
  skillGaps: z.array(skillGapSchema).default([]),
  learningPath: z.array(milestoneSchema).default([]),
  finalAssessment: finalAssessmentSchema
});

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;
export type MatchedSkill = z.infer<typeof matchedSkillSchema>;
export type SkillGap = z.infer<typeof skillGapSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type FinalAssessment = z.infer<typeof finalAssessmentSchema>;
export type GeneratedRoadmap = z.infer<typeof roadmapZodSchema>;
