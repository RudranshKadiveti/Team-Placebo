import { prisma } from '../config/database.js';
import { profileSchema, careerGoalSchema } from '../validators/profile.validator.js';

export interface ProfileData {
  phone?: string | null;
  location?: string | null;
  university?: string | null;
  degree?: string | null;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  experienceLevel?: string | null;
  bio?: string | null;
}

export interface CareerGoalData {
  targetRole: string;
  targetIndustry?: string | null;
  targetLocation?: string | null;
  priority?: number;
}

interface CustomError extends Error {
  statusCode?: number;
}

export const calculateProfileCompletion = (
  profile: {
    phone?: string | null;
    location?: string | null;
    university?: string | null;
    degree?: string | null;
    fieldOfStudy?: string | null;
    graduationYear?: number | null;
    experienceLevel?: string | null;
    bio?: string | null;
  } | null,
  goalsCount: number = 0
): number => {
  if (!profile) return 0;

  let score = 0;

  // Basic Info (20%: 10% phone, 10% location)
  if (profile.phone && profile.phone.trim().length > 0) score += 10;
  if (profile.location && profile.location.trim().length > 0) score += 10;

  // Education (30%: 7.5% each for university, degree, fieldOfStudy, graduationYear)
  if (profile.university && profile.university.trim().length > 0) score += 7.5;
  if (profile.degree && profile.degree.trim().length > 0) score += 7.5;
  if (profile.fieldOfStudy && profile.fieldOfStudy.trim().length > 0) score += 7.5;
  if (profile.graduationYear) score += 7.5;

  // Experience Level (20%)
  if (profile.experienceLevel) score += 20;

  // Bio (10%)
  if (profile.bio && profile.bio.trim().length > 0) score += 10;

  // Career Goals (20%)
  if (goalsCount > 0) score += 20;

  return Math.min(100, Math.round(score));
};

export const getProfile = async (userId: string) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      careerGoals: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  if (!profile) {
    return {
      profile: null,
      completionPercentage: 0,
    };
  }

  const completionPercentage = calculateProfileCompletion(profile, profile.careerGoals.length);

  return {
    profile,
    completionPercentage,
  };
};

export const createProfile = async (userId: string, data: ProfileData) => {
  const parsed = profileSchema.parse(data);

  const existing = await prisma.profile.findUnique({
    where: { userId },
  });

  if (existing) {
    const error: CustomError = new Error('Profile already exists for this user');
    error.statusCode = 400;
    throw error;
  }

  const newProfile = await prisma.profile.create({
    data: {
      userId,
      ...parsed,
    },
    include: {
      careerGoals: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  const completionPercentage = calculateProfileCompletion(newProfile, newProfile.careerGoals.length);

  return {
    profile: newProfile,
    completionPercentage,
  };
};

export const updateProfile = async (userId: string, data: ProfileData) => {
  const parsed = profileSchema.parse(data);

  let profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId,
        ...parsed,
      },
    });
  } else {
    profile = await prisma.profile.update({
      where: { userId },
      data: parsed,
    });
  }

  const updatedProfile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      careerGoals: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  const completionPercentage = calculateProfileCompletion(
    updatedProfile,
    updatedProfile?.careerGoals.length || 0
  );

  return {
    profile: updatedProfile,
    completionPercentage,
  };
};

export const deleteProfile = async (userId: string) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    const error: CustomError = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.profile.delete({
    where: { userId },
  });

  return { message: 'Profile deleted successfully' };
};

// --- Career Goals Services ---

export const getCareerGoals = async (userId: string) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      careerGoals: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  if (!profile) {
    return [];
  }

  return profile.careerGoals;
};

export const createCareerGoal = async (userId: string, data: CareerGoalData) => {
  const parsed = careerGoalSchema.parse(data);

  let profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId },
    });
  }

  const newGoal = await prisma.careerGoal.create({
    data: {
      profileId: profile.id,
      ...parsed,
    },
  });

  return newGoal;
};

export const updateCareerGoal = async (
  userId: string,
  goalId: string,
  data: Partial<CareerGoalData>
) => {
  const goal = await prisma.careerGoal.findUnique({
    where: { id: goalId },
    include: { profile: true },
  });

  if (!goal || goal.profile.userId !== userId) {
    const error: CustomError = new Error('Career goal not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const updatedGoal = await prisma.careerGoal.update({
    where: { id: goalId },
    data: {
      ...(data.targetRole !== undefined && { targetRole: data.targetRole.trim() }),
      ...(data.targetIndustry !== undefined && { targetIndustry: data.targetIndustry?.trim() ?? null }),
      ...(data.targetLocation !== undefined && { targetLocation: data.targetLocation?.trim() ?? null }),
      ...(data.priority !== undefined && { priority: Number(data.priority) }),
    },
  });

  return updatedGoal;
};

export const deleteCareerGoal = async (userId: string, goalId: string) => {
  const goal = await prisma.careerGoal.findUnique({
    where: { id: goalId },
    include: { profile: true },
  });

  if (!goal || goal.profile.userId !== userId) {
    const error: CustomError = new Error('Career goal not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  await prisma.careerGoal.delete({
    where: { id: goalId },
  });

  return { message: 'Career goal deleted successfully' };
};
