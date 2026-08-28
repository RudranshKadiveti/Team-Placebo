import { prisma } from '../config/database.js';
import { CustomError } from './resume.service.js';
import { StructuredResume, parseResumeRecord } from './resumeParser.service.js';
import { generateEmbedding } from './embedding.service.js';

export interface AtsScore {
  overallScore: number;
  pointBreakdown: {
    sectionPoints: number;
    formattingPoints: number;
    keywordPoints: number;
    lostSectionPoints: number;
    lostFormattingPoints: number;
    lostKeywordPoints: number;
  };
  semanticMatch: {
    score: number;
    similarityPercent: number;
  };
  formattingCheck: {
    passed: boolean;
    issues: string[];
  };
  sectionCompleteness: {
    score: number;
    missingSections: string[];
  };
  readability: {
    status: 'Poor' | 'Moderate' | 'Optimal';
    suggestions: string[];
  };
  actionableSuggestions: string[];
}

export const calculateAtsScore = async (resumeId: string, userId: string): Promise<AtsScore> => {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      user: {
        include: { profile: { include: { careerGoals: true } } },
      },
    },
  });

  if (!resume) {
    const error: CustomError = new Error('Resume not found');
    error.statusCode = 404;
    throw error;
  }

  if (resume.userId !== userId) {
    const error: CustomError = new Error('Access denied: You do not own this resume');
    error.statusCode = 403;
    throw error;
  }

  let structuredContentObj: StructuredResume | null = null;

  if (resume.structuredContent) {
    if (typeof resume.structuredContent === 'string') {
      try {
        structuredContentObj = JSON.parse(resume.structuredContent);
      } catch {
        structuredContentObj = null;
      }
    } else {
      structuredContentObj = resume.structuredContent as unknown as StructuredResume;
    }
  }

  // Auto-parse if structured content is missing
  if (!structuredContentObj) {
    const updated = await parseResumeRecord(resumeId, userId);
    if (typeof updated.structuredContent === 'string') {
      structuredContentObj = JSON.parse(updated.structuredContent);
    } else {
      structuredContentObj = updated.structuredContent as unknown as StructuredResume;
    }
  }

  const rawText = resume.rawText || '';
  const actionableSuggestions: string[] = [];
  let lostSectionPoints = 0;
  let lostFormattingPoints = 0;
  let lostKeywordPoints = 0;

  // 1. Section Completeness (Max 30 points)
  const expectedSections = ['summary', 'skills', 'experience', 'education'];
  const missingSections: string[] = [];
  let sectionPoints = 0;

  expectedSections.forEach(section => {
    const val = structuredContentObj?.[section];
    if (val && typeof val === 'string' && val.trim().length > 5) {
      sectionPoints += (30 / expectedSections.length);
    } else {
      missingSections.push(section);
      lostSectionPoints += (30 / expectedSections.length);
    }
  });

  if (missingSections.length > 0) {
    actionableSuggestions.push(`Add or expand the following sections: ${missingSections.join(', ')}.`);
  }

  // 2. Formatting Check & Readability (Max 30 points)
  let formattingPoints = 30;
  const formattingIssues: string[] = [];
  let readabilityStatus: 'Poor' | 'Moderate' | 'Optimal' = 'Optimal';
  
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) {
    formattingPoints -= 10;
    lostFormattingPoints += 10;
    formattingIssues.push('Resume is too short. Try to add more details about your experience.');
    readabilityStatus = 'Poor';
  } else if (wordCount > 1000) {
    formattingPoints -= 10;
    lostFormattingPoints += 10;
    formattingIssues.push('Resume is very long. Consider condensing it to the most relevant points.');
    readabilityStatus = 'Moderate';
  }

  const bulletPointsCount = (rawText.match(/(?:•|- |\* |◦|‣|⁃|➔|➢|—|‒|–|―)/g) || []).length;
  if (bulletPointsCount < 3) {
    formattingPoints -= 5;
    lostFormattingPoints += 5;
    formattingIssues.push('Too few bullet points. Use bullet points to describe your experience for better readability.');
    if (readabilityStatus === 'Optimal') readabilityStatus = 'Moderate';
  }

  if (formattingIssues.length > 0) {
    actionableSuggestions.push(...formattingIssues);
  }

  // 3. Semantic Vector Search / Match (Max 40 points)
  let targetProfile = "javascript typescript react node python sql aws docker kubernetes agile architecture system design software engineering algorithms data structures";
  
  const careerGoals = resume.user.profile?.careerGoals;
  if (careerGoals && careerGoals.length > 0) {
    targetProfile += " " + careerGoals[0].targetRole.toLowerCase();
  }

  const idealVector = await generateEmbedding(targetProfile);
  const resumeContext = [structuredContentObj?.skills || '', structuredContentObj?.summary || '', structuredContentObj?.experience || ''].join(' ');
  const textToEmbed = resumeContext.trim().length > 50 ? resumeContext : rawText.substring(0, 500);
  const resumeVector = await generateEmbedding(textToEmbed);
  
  const dotProduct = idealVector.reduce((sum, val, i) => sum + val * resumeVector[i], 0);
  const similarityPercent = Math.min(Math.max((dotProduct - 0.1) / 0.5, 0), 1) * 100;
  const keywordPoints = Math.min(20 + 20 * (similarityPercent / 100), 40);
  lostKeywordPoints = 40 - keywordPoints;

  if (similarityPercent < 50) {
    actionableSuggestions.push('Your semantic match is quite low. Ensure your resume accurately reflects the core skills of your target industry.');
  }

  const overallScore = Math.round(sectionPoints + formattingPoints + keywordPoints);

  const atsScore: AtsScore = {
    overallScore: Math.min(Math.max(overallScore, 0), 100),
    pointBreakdown: {
      sectionPoints: Math.round(sectionPoints),
      formattingPoints: Math.round(formattingPoints),
      keywordPoints: Math.round(keywordPoints),
      lostSectionPoints: Math.round(lostSectionPoints),
      lostFormattingPoints: Math.round(lostFormattingPoints),
      lostKeywordPoints: Math.round(lostKeywordPoints),
    },
    semanticMatch: {
      score: Math.round(keywordPoints),
      similarityPercent: Math.round(similarityPercent),
    },
    formattingCheck: {
      passed: formattingIssues.length === 0,
      issues: formattingIssues,
    },
    sectionCompleteness: {
      score: Math.round(sectionPoints),
      missingSections,
    },
    readability: {
      status: readabilityStatus,
      suggestions: [],
    },
    actionableSuggestions,
  };

  await prisma.resume.update({
    where: { id: resumeId },
    data: { atsScore: JSON.stringify(atsScore) },
  });

  return atsScore;
};
