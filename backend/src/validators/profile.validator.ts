import { z } from 'zod';

export const experienceLevelEnum = z.enum([
  'STUDENT',
  'ENTRY_LEVEL',
  'JUNIOR',
  'MID_LEVEL',
  'SENIOR',
]);

export const profileSchema = z.object({
  phone: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  university: z.string().trim().optional().nullable(),
  degree: z.string().trim().optional().nullable(),
  fieldOfStudy: z.string().trim().optional().nullable(),
  graduationYear: z
    .number({ invalid_type_error: 'Graduation year must be a number' })
    .int()
    .min(1950, { message: 'Graduation year must be after 1950' })
    .max(2100, { message: 'Graduation year must be before 2100' })
    .optional()
    .nullable(),
  experienceLevel: experienceLevelEnum.optional().nullable(),
  bio: z.string().trim().optional().nullable(),
});

export const careerGoalSchema = z.object({
  targetRole: z.string({ required_error: 'Target role is required' }).trim().min(1, { message: 'Target role is required' }),
  targetIndustry: z.string().trim().optional().nullable(),
  targetLocation: z.string().trim().optional().nullable(),
  priority: z
    .number({ invalid_type_error: 'Priority must be a number' })
    .int({ message: 'Priority must be an integer' })
    .min(1, { message: 'Priority must be at least 1' })
    .default(1),
});
