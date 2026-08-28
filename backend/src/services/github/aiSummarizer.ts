import { OpenAI } from 'openai';
import { env } from '../../config/env.js';
import { AnalyzedRepoResult } from './portfolioScorer.js';

export class AISummarizer {
  private static getOpenAIClient(): OpenAI | null {
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim()) {
      return new OpenAI({ apiKey: env.OPENAI_API_KEY.trim() });
    }
    return null;
  }

  /**
   * Generate evidence-grounded AI bullet points for a repository
   */
  static async generateProjectBullet(repo: AnalyzedRepoResult): Promise<string[]> {
    const client = this.getOpenAIClient();

    const techList = repo.technologies.map((t) => t.name).join(', ') || repo.primaryLanguage || 'Software Development';
    const hasDocker = repo.technologies.some((t) => t.name.toLowerCase().includes('docker'));
    const hasCI = repo.cicdScore > 50;
    const hasTests = repo.testingScore > 50;

    // Rule-based fallback bullet points (100% deterministic & non-hallucinatory)
    const fallbackBullets: string[] = [
      `Engineered ${repo.classification.toLowerCase()} (${repo.name}) using ${techList}, featuring structured code organization and ${repo.documentationScore > 60 ? 'comprehensive README documentation' : 'modular component architecture'}.`,
    ];

    if (hasDocker) {
      fallbackBullets.push(`Containerized application deployment environment using Docker, standardizing development and runtime configuration.`);
    } else if (hasCI) {
      fallbackBullets.push(`Configured automated GitHub Actions CI/CD workflows for continuous integration, linting, and automated builds.`);
    }

    if (hasTests) {
      fallbackBullets.push(`Implemented automated testing framework to validate core module functionality and prevent regressions.`);
    }

    if (!client) {
      return fallbackBullets;
    }

    const systemPrompt = `You are an expert technical resume writer.
CRITICAL MANDATORY RULES:
1. Use ONLY the provided repository evidence.
2. NEVER invent metrics, users, uptime, revenue, or technologies not listed.
3. If a metric is missing, write strong technical action verbs without fabricating numbers.
4. Output 2 bullet points as a JSON array of strings: ["Bullet 1", "Bullet 2"]`;

    const userPrompt = `Repository Name: ${repo.name}
Description: ${repo.description || 'No description provided'}
Classification: ${repo.classification}
Primary Language: ${repo.primaryLanguage || 'Unknown'}
Detected Technologies: ${techList}
Has Docker: ${hasDocker}
Has CI/CD: ${hasCI}
Has Tests: ${hasTests}

Generate 2 professional resume bullet points grounded strictly in this evidence.`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.bullets) && parsed.bullets.length > 0) {
          return parsed.bullets;
        }
      }
      return fallbackBullets;
    } catch {
      return fallbackBullets;
    }
  }
}
