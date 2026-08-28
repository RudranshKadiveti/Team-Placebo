import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { ACTION_PLAN_SYSTEM_PROMPT } from './prompts.js';
import { SkillGap, PartialMatch } from './roleAnalysis.service.js';

export interface ActionPlanItem {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  action: string;
  project_idea: string;
  evidence_to_add: string;
  estimated_effort: string;
}

export interface ActionPlanInput {
  targetRoleTitle?: string;
  targetJobDescription?: string;
  skillGaps: SkillGap[];
  partialMatches?: PartialMatch[];
  missingKeywords?: string[];
  experienceGaps?: string[];
}

export const generateActionPlanFallback = (input: ActionPlanInput): ActionPlanItem[] => {
  const plan: ActionPlanItem[] = [];

  // Convert skill gaps
  if (input.skillGaps && input.skillGaps.length > 0) {
    input.skillGaps.forEach((gap, index) => {
      const priority = gap.importance === 'Required' ? 'High' : (index === 0 ? 'High' : 'Medium');
      plan.push({
        skill: gap.skill,
        priority: priority as 'High' | 'Medium' | 'Low',
        reason: `${gap.skill} is a ${gap.importance.toLowerCase()} skill for ${input.targetRoleTitle || 'the target role'}, but is not demonstrated in your resume.`,
        action: `Build a practical hands-on project integrating ${gap.skill} into your existing tech stack.`,
        project_idea: `Build and deploy a full-stack application featuring ${gap.skill} with automated unit tests and documentation.`,
        evidence_to_add: `Add project bullet: 'Implemented ${gap.skill} in production architecture, improving system scalability and deployment efficiency.'`,
        estimated_effort: priority === 'High' ? '3-5 days' : '1-2 weeks'
      });
    });
  }

  // Convert partial matches
  if (input.partialMatches && input.partialMatches.length > 0 && plan.length < 5) {
    input.partialMatches.forEach((partial) => {
      plan.push({
        skill: partial.skill,
        priority: 'Medium',
        reason: partial.reason || `Your resume mentions ${partial.skill} conceptually but lacks production metrics.`,
        action: `Enhance your existing ${partial.skill} project with explicit performance metrics and benchmarks.`,
        project_idea: `Refactor an existing API or component to measure memory/latency impact of ${partial.skill}.`,
        evidence_to_add: `Add achievement bullet: 'Optimized ${partial.skill} architecture, achieving a 35% reduction in query response latency.'`,
        estimated_effort: '2-3 days'
      });
    });
  }

  // Default fallback if no gaps supplied
  if (plan.length === 0) {
    plan.push({
      skill: 'Cloud Deployment & Containerization',
      priority: 'High',
      reason: 'Modern target roles require hands-on cloud and container orchestration experience.',
      action: 'Containerize one of your existing backend projects and deploy it using Docker Compose.',
      project_idea: 'Dockerize a Node.js REST API, connect it to PostgreSQL, and write a setup guide in README.md.',
      evidence_to_add: 'Containerized Node.js REST API with PostgreSQL using Docker Compose, establishing multi-container local orchestration.',
      estimated_effort: '3-5 days'
    });
  }

  return plan;
};

export const generateSkillGapActionPlan = async (input: ActionPlanInput): Promise<ActionPlanItem[]> => {
  if (!env.OPENAI_API_KEY || !env.OPENAI_API_KEY.trim()) {
    return generateActionPlanFallback(input);
  }

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    let userPrompt = `Target Role Title: ${input.targetRoleTitle || 'Software Engineer'}\n`;
    if (input.targetJobDescription) {
      userPrompt += `Target Job Description:\n${input.targetJobDescription.substring(0, 2000)}\n`;
    }
    userPrompt += `\nIdentified Skill Gaps:\n${JSON.stringify(input.skillGaps || [])}\n`;
    userPrompt += `\nPartial Matches:\n${JSON.stringify(input.partialMatches || [])}\n`;
    userPrompt += `\nMissing Keywords:\n${JSON.stringify(input.missingKeywords || [])}\n`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: ACTION_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
    });

    let jsonString = response.choices[0].message.content || '[]';
    jsonString = jsonString.replace(/^```json/mi, '').replace(/```$/m, '').trim();

    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(item => ({
        skill: item.skill || 'Technical Skill',
        priority: ['High', 'Medium', 'Low'].includes(item.priority) ? item.priority : 'Medium',
        reason: item.reason || 'Required for target role.',
        action: item.action || 'Build a project using this technology.',
        project_idea: item.project_idea || 'Develop a functional application.',
        evidence_to_add: item.evidence_to_add || 'Add project to resume.',
        estimated_effort: item.estimated_effort || '3-5 days'
      }));
    }

    return generateActionPlanFallback(input);
  } catch (err: any) {
    console.warn('AI action plan generation error, using fallback roadmap:', err.message);
    return generateActionPlanFallback(input);
  }
};
