import OpenAI from 'openai';
import { prisma } from '../config/database.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class CareerRoadmapService {
  /**
   * Generates a step-by-step roadmap to achieve a target job.
   */
  static async generateRoadmap(
    targetRole: string,
    jobTitle: string,
    jobDescription: string,
    userSkills: string[],
    githubSkills: string[]
  ): Promise<string> {
    try {
      console.log(`[CareerRoadmapService] Generating roadmap for ${targetRole}`);

      const systemPrompt = `You are an expert career coach and technical mentor. 
Your task is to provide a highly actionable, step-by-step roadmap for a user trying to get a specific job.

User's Current Skills (from Resume): ${userSkills.join(', ')}
User's Current Skills (from GitHub): ${githubSkills.join(', ')}

Target Job Title: ${jobTitle}
Target Job Description: ${jobDescription}

Compare the user's current skills with the job requirements. Provide a markdown-formatted roadmap with:
1. **Skill Gap Analysis**: What they already know vs. what they are missing.
2. **Phase 1: Short-term Learning**: Specific technologies or concepts to learn immediately.
3. **Phase 2: Portfolio Building**: Specific project ideas they should build to prove these skills.
4. **Phase 3: Application Strategy**: How to tailor their resume and interview prep for this exact role.

Be concise, practical, and highly specific to the provided skills and job description.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      return response.choices[0]?.message?.content || 'Failed to generate roadmap.';
    } catch (error) {
      console.error('[CareerRoadmapService] Error generating roadmap:', error);
      throw new Error('Failed to generate career roadmap');
    }
  }

  /**
   * Saves a generated roadmap to the database.
   */
  static async saveRoadmap(
    userId: string,
    targetRole: string,
    targetCompany: string,
    jobUrl: string,
    roadmapContent: string
  ) {
    try {
      const roadmap = await prisma.careerRoadmap.create({
        data: {
          userId,
          targetRole,
          targetCompany,
          jobUrl,
          roadmapContent,
        },
      });
      return roadmap;
    } catch (error) {
      console.error('[CareerRoadmapService] Error saving roadmap:', error);
      throw new Error('Failed to save career roadmap');
    }
  }
}
