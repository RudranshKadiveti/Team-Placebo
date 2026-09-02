/**
 * Resume Parser Service (Phase 4C)
 * Parses raw resume text into structured sections using AI or deterministic regex fallbacks.
 */

export interface StructuredResume {
  summary: string | null;
  skills: string | null;
  experience: string | null;
  education: string | null;
  projects: string | null;
  certifications: string | null;
  [key: string]: string | null;
}

import OpenAI from 'openai';
import { env } from '../config/env.js';
import { extractGitHubInfo } from '../utils/githubExtractor.js';

/**
 * Deterministic Regex-based Resume Section Extractor Fallback
 */

export const parseResumeTextDeterministic = (text: string): StructuredResume => {
  const result: StructuredResume = {
    summary: null,
    skills: null,
    experience: null,
    education: null,
    projects: null,
    certifications: null,
  };

  if (!text || !text.trim()) return result;

  const lines = text.split(/\r?\n/);
  let currentSection: keyof StructuredResume | null = null;
  const sectionBuffers: Record<string, string[]> = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };

  const headerPatterns: Array<{ key: keyof StructuredResume; regex: RegExp }> = [
    { key: 'summary', regex: /^(?:summary|profile|about me|objective|executive summary)/i },
    { key: 'skills', regex: /^(?:skills|technical skills|core competencies|technologies|expertise)/i },
    { key: 'experience', regex: /^(?:experience|work experience|employment history|work history|professional experience)/i },
    { key: 'education', regex: /^(?:education|academic background|qualifications|academic history)/i },
    { key: 'projects', regex: /^(?:projects|academic projects|key projects|featured projects)/i },
    { key: 'certifications', regex: /^(?:certifications|licenses|courses|certificates)/i },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matchedHeader = false;
    for (const { key, regex } of headerPatterns) {
      if (regex.test(trimmed)) {
        currentSection = key;
        matchedHeader = true;
        break;
      }
    }

    if (!matchedHeader && currentSection) {
      sectionBuffers[currentSection].push(trimmed);
    }
  }

  for (const key of Object.keys(sectionBuffers)) {
    if (sectionBuffers[key].length > 0) {
      result[key] = sectionBuffers[key].join('\n');
    }
  }

  // Fallback: If no section headers matched, populate skills and summary from raw text keywords
  if (!result.skills && !result.experience) {
    result.summary = text.substring(0, 500);
    result.skills = text;
  }

  return result;
};

export const parseResumeTextWithAI = async (text: string): Promise<StructuredResume> => {
  if (!text || !text.trim()) {
    return parseResumeTextDeterministic(text);
  }

  const safeText = text.substring(0, 15000);

  if (!env.OPENAI_API_KEY || !env.OPENAI_API_KEY.trim()) {
    return parseResumeTextDeterministic(safeText);
  }

  try {
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    const prompt = `
You are a highly accurate Resume Parser. 
I will provide you with the raw text extracted from a resume PDF. 
Your job is to read the text and extract the content into the following 6 buckets:
- summary
- skills
- experience
- education
- projects
- certifications

Rules:
1. Return strictly a JSON object with these exactly 6 keys. Do not include markdown code block syntax (\`\`\`json).
2. If a section is missing from the resume, leave its value as null.
3. Keep the original wording and formatting (like bullet points) intact within each string.
4. Merge multiple sections if they belong to the same bucket (e.g. "Work History" and "Experience" both go into "experience").

Resume Text:
"""
${safeText}
"""
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    let jsonString = response.choices[0].message.content || '{}';
    jsonString = jsonString.replace(/^```json/mi, '').replace(/```$/m, '').trim();

    const parsedData = JSON.parse(jsonString);

    return {
      summary: parsedData.summary || null,
      skills: parsedData.skills || null,
      experience: parsedData.experience || null,
      education: parsedData.education || null,
      projects: parsedData.projects || null,
      certifications: parsedData.certifications || null,
    };
  } catch (err: any) {
    console.warn('OpenAI parsing unavailable, falling back to deterministic regex parser:', err.message);
    return parseResumeTextDeterministic(safeText);
  }
};

import { prisma } from '../config/database.js';
import { CustomError } from './resume.service.js';
import path from 'path';
import fs from 'fs';
import { extractTextFromPdf } from './pdfParser.service.js';

export const parseResumeRecord = async (resumeId: string, userId: string) => {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
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

  let rawText = resume.rawText || '';

  if (!rawText.trim()) {
    const fullPath = path.resolve(process.cwd(), 'uploads', resume.storageKey);
    if (fs.existsSync(fullPath)) {
      const buffer = await fs.promises.readFile(fullPath);
      if (resume.fileType.includes('pdf') || resume.originalFileName.endsWith('.pdf')) {
        rawText = await extractTextFromPdf(buffer);
      } else {
        rawText = buffer.toString('utf-8');
      }
    }
  }

  if (!rawText.trim()) {
    const error: CustomError = new Error('Unable to extract text content from resume file for parsing');
    error.statusCode = 400;
    throw error;
  }

  const structuredContent = await parseResumeTextWithAI(rawText);
  const githubInfo = extractGitHubInfo(rawText);

  const fullStructuredContent = {
    ...structuredContent,
    detectedGitHubUsername: githubInfo.username,
    detectedGitHubUrl: githubInfo.url,
  };

  const updatedResume = await prisma.resume.update({
    where: { id: resumeId },
    data: { 
      rawText,
      structuredContent: JSON.stringify(fullStructuredContent)
    },
  });

  // Attempt auto-connect if user is not already connected and valid GitHub link detected
  if (githubInfo.username) {
    try {
      const existingConn = await prisma.gitHubConnection.findUnique({ where: { userId } });
      if (!existingConn) {
        const { GitHubService } = await import('./github/github.service.js');
        await GitHubService.connect(userId, githubInfo.username);
      }
    } catch (err: any) {
      console.warn('Auto-connect GitHub from resume failed:', err.message);
    }
  }

  return updatedResume;
};
