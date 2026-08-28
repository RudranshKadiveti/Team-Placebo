/**
 * Resume Parser Service (Phase 4C)
 * Parses raw resume text into structured sections using heuristics and regex.
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

export const parseResumeTextWithAI = async (text: string): Promise<StructuredResume> => {
  const result: StructuredResume = {
    summary: null,
    skills: null,
    experience: null,
    education: null,
    projects: null,
    certifications: null,
  };

  if (!text || !text.trim()) {
    return result;
  }

  // PDFs with corrupted text layers or images can extract hundreds of thousands of garbage characters.
  // We strictly limit the text to 15,000 characters (approx 3,000-4,000 tokens) which is more than enough for a standard resume.
  const safeText = text.substring(0, 15000);

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
    
    // Strip markdown formatting if the model accidentally included it
    jsonString = jsonString.replace(/^```json/mi, '').replace(/```$/m, '').trim();
    
    const parsedData = JSON.parse(jsonString);
    
    // Map data back securely
    result.summary = parsedData.summary || null;
    result.skills = parsedData.skills || null;
    result.experience = parsedData.experience || null;
    result.education = parsedData.education || null;
    result.projects = parsedData.projects || null;
    result.certifications = parsedData.certifications || null;

    return result;
  } catch (err: any) {
    console.error('OpenAI Parsing Error:', err.message);
    const error = new Error('Oops! Our AI parser is currently unavailable. Please try again in a few moments.') as any;
    error.statusCode = 503;
    throw error;
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

  const updatedResume = await prisma.resume.update({
    where: { id: resumeId },
    data: { 
      rawText,
      structuredContent: structuredContent as any 
    },
  });

  return updatedResume;
};
