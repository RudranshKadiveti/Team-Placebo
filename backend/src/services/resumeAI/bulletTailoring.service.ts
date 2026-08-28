import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { BULLET_TAILORING_SYSTEM_PROMPT } from './prompts.js';

export interface BulletTailoringInput {
  bulletText: string;
  targetRoleTitle?: string;
  targetJobDescription?: string;
  additionalContext?: string;
}

export interface BulletTailoringResult {
  original: string;
  rewritten: string;
  improvements: string[];
  keywords_added: string[];
  missing_information: string[];
}

/**
 * Deterministic fallback bullet point enhancer when AI model API is unavailable.
 */
export const tailorBulletFallback = (input: BulletTailoringInput): BulletTailoringResult => {
  const original = input.bulletText.trim();
  let rewritten = original;

  // Replace weak openings
  const weakOpenings: Array<[RegExp, string]> = [
    [/^worked on\s+/i, 'Engineered '],
    [/^helped\s+(?:with|to)?\s+/i, 'Collaborated to develop '],
    [/^responsible for\s+/i, 'Spearheaded implementation of '],
    [/^involved in\s+/i, 'Contributed to architectural design of '],
    [/^did\s+/i, 'Executed '],
    [/^made\s+/i, 'Developed '],
    [/^built\s+/i, 'Architected and built '],
  ];

  let actionVerbAdded = false;
  for (const [regex, replacement] of weakOpenings) {
    if (regex.test(rewritten)) {
      rewritten = rewritten.replace(regex, replacement);
      actionVerbAdded = true;
      break;
    }
  }

  if (!actionVerbAdded && !/^[A-Z][a-z]+ed\b/.test(rewritten)) {
    rewritten = 'Developed ' + rewritten.charAt(0).toLowerCase() + rewritten.slice(1);
  }

  // Ensure high-impact technical structure
  if (input.targetRoleTitle && !rewritten.toLowerCase().includes(input.targetRoleTitle.toLowerCase())) {
    rewritten += `, supporting ${input.targetRoleTitle} objectives and system reliability`;
  } else if (!rewritten.includes('implementing') && !rewritten.includes('enhancing')) {
    rewritten += ', implementing modular architecture to enhance code maintainability and user experience';
  }

  const hasMetrics = /\d+[%kM$]?|\b[XN]%\b/i.test(original);
  if (!hasMetrics) {
    rewritten += ' [improving performance by X%]';
  }

  const keywordsAdded: string[] = [];
  if (input.targetRoleTitle) keywordsAdded.push(input.targetRoleTitle);
  if (input.targetJobDescription) {
    const extractedTech = (input.targetJobDescription.match(/\b(React|Node\.js|Python|Docker|AWS|TypeScript|PostgreSQL|GraphQL|REST API|Kubernetes)\b/gi) || []);
    keywordsAdded.push(...Array.from(new Set(extractedTech)));
  }

  return {
    original,
    rewritten,
    improvements: [
      'Replaced weak opening with a strong technical action verb.',
      'Enhanced context with domain-specific architecture details.',
      hasMetrics ? 'Preserved existing performance metric.' : 'Added metric placeholder [X%] without inventing fabricated results.'
    ],
    keywords_added: keywordsAdded.slice(0, 5),
    missing_information: hasMetrics ? [] : ['Specific performance metrics (e.g. latency reduction %, user count, throughput).']
  };
};

export const tailorBulletPoint = async (input: BulletTailoringInput): Promise<BulletTailoringResult> => {
  const { bulletText, targetRoleTitle, targetJobDescription, additionalContext } = input;

  if (!bulletText || !bulletText.trim()) {
    throw new Error('Original bullet point text is required');
  }

  if (!env.OPENAI_API_KEY || !env.OPENAI_API_KEY.trim()) {
    return tailorBulletFallback(input);
  }

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    let userPrompt = `Original Bullet Point:\n"${bulletText.trim()}"\n`;
    if (targetRoleTitle) userPrompt += `Target Job Title:\n${targetRoleTitle.trim()}\n`;
    if (targetJobDescription) userPrompt += `Target Job Description:\n${targetJobDescription.trim().substring(0, 3000)}\n`;
    if (additionalContext) userPrompt += `Candidate Additional Context:\n${additionalContext.trim()}\n`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: BULLET_TAILORING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
    });

    let jsonString = response.choices[0].message.content || '{}';
    jsonString = jsonString.replace(/^```json/mi, '').replace(/```$/m, '').trim();

    const parsed = JSON.parse(jsonString);

    return {
      original: parsed.original || bulletText,
      rewritten: parsed.rewritten || bulletText,
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Improved bullet structure and vocabulary.'],
      keywords_added: Array.isArray(parsed.keywords_added) ? parsed.keywords_added : [],
      missing_information: Array.isArray(parsed.missing_information) ? parsed.missing_information : [],
    };
  } catch (err: any) {
    console.warn('AI bullet tailoring unavailable, using deterministic fallback:', err.message);
    return tailorBulletFallback(input);
  }
};
