import { z } from 'zod';

export const tailorBulletSchema = z.object({
  bulletText: z.string().min(3, { message: 'Original bullet point text must be at least 3 characters long' }),
  targetRoleTitle: z.string().optional(),
  targetJobDescription: z.string().optional(),
  additionalContext: z.string().optional(),
});

export const analyzeRoleSchema = z.object({
  resumeId: z.string().uuid({ message: 'Valid resume ID is required' }),
  targetRoleTitle: z.string().optional(),
  targetJobDescription: z.string().optional(),
}).refine(data => data.targetRoleTitle || data.targetJobDescription, {
  message: 'Either targetRoleTitle or targetJobDescription must be provided',
  path: ['targetRoleTitle']
});

export const actionPlanSchema = z.object({
  targetRoleTitle: z.string().optional(),
  targetJobDescription: z.string().optional(),
  skillGaps: z.array(z.object({
    skill: z.string(),
    importance: z.enum(['Required', 'Preferred', 'Nice-to-have']).default('Required'),
    isExplicit: z.boolean().default(true),
  })).default([]),
  partialMatches: z.array(z.object({
    skill: z.string(),
    reason: z.string(),
  })).default([]),
  missingKeywords: z.array(z.string()).default([]),
  experienceGaps: z.array(z.string()).default([]),
});
