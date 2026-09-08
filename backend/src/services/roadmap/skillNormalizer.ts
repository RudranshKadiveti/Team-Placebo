/**
 * Technology Skill Normalization Layer
 * Maps raw resume/GitHub/Job keywords and aliases into clean canonical technology names.
 */

const SKILL_ALIASES: Record<string, string> = {
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'py': 'Python',
  'python': 'Python',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'express': 'Express',
  'expressjs': 'Express',
  'express.js': 'Express',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'docker': 'Docker',
  'dockerized': 'Docker',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'Google Cloud',
  'google cloud platform': 'Google Cloud',
  'azure': 'Azure',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'git': 'Git',
  'github': 'Git',
  'cicd': 'CI/CD',
  'ci/cd': 'CI/CD',
  'graphql': 'GraphQL',
  'rest': 'REST APIs',
  'restful': 'REST APIs',
  'rest api': 'REST APIs',
  'rest apis': 'REST APIs',
  'jest': 'Jest',
  'unit testing': 'Testing (Jest/Vitest)',
  'testing': 'Testing (Jest/Vitest)',
  'vitest': 'Vitest',
  'prisma': 'Prisma ORM',
  'prisma orm': 'Prisma ORM',
  'redux': 'Redux',
  'zustand': 'Zustand',
  'html': 'HTML5',
  'html5': 'HTML5',
  'css': 'CSS3',
  'css3': 'CSS3'
};

/**
 * Normalizes a single raw skill string.
 */
export function normalizeSkill(rawSkill: string): string {
  if (!rawSkill || typeof rawSkill !== 'string') return '';
  const trimmed = rawSkill.trim();
  const lower = trimmed.toLowerCase();
  
  if (SKILL_ALIASES[lower]) {
    return SKILL_ALIASES[lower];
  }
  
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Normalizes an array of raw skill strings, removing duplicates and empty values.
 */
export function normalizeSkillList(rawSkills: string[]): string[] {
  if (!Array.isArray(rawSkills)) return [];
  const normalizedSet = new Set<string>();

  rawSkills.forEach((skill) => {
    const normalized = normalizeSkill(skill);
    if (normalized && normalized.length > 1) {
      normalizedSet.add(normalized);
    }
  });

  return Array.from(normalizedSet);
}
