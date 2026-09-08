import { normalizeSkill } from './skillNormalizer.js';

export interface ExtractedRequirement {
  skill: string;
  importance: 'required' | 'preferred';
  evidence: string;
}

export interface JobRequirements {
  technicalSkills: ExtractedRequirement[];
  softSkills: string[];
  experienceRequirements: string[];
}

const TECH_KEYWORDS_DICTIONARY: Array<{ skill: string; regex: RegExp; defaultImportance: 'required' | 'preferred' }> = [
  // Languages
  { skill: 'JavaScript', regex: /\b(javascript|js|es6)\b/i, defaultImportance: 'required' },
  { skill: 'TypeScript', regex: /\b(typescript|ts)\b/i, defaultImportance: 'required' },
  { skill: 'Python', regex: /\b(python|py)\b/i, defaultImportance: 'required' },
  { skill: 'Java', regex: /\b(java)\b/i, defaultImportance: 'required' },
  { skill: 'C++', regex: /\b(c\+\+|cpp)\b/i, defaultImportance: 'required' },
  { skill: 'C#', regex: /\b(c#|\.net)\b/i, defaultImportance: 'required' },
  { skill: 'Go', regex: /\b(golang|go)\b/i, defaultImportance: 'required' },
  { skill: 'Rust', regex: /\b(rust)\b/i, defaultImportance: 'required' },
  { skill: 'PHP', regex: /\b(php|laravel)\b/i, defaultImportance: 'required' },
  { skill: 'Ruby', regex: /\b(ruby|rails)\b/i, defaultImportance: 'required' },
  { skill: 'SQL', regex: /\b(sql|postgresql|mysql|sqlite|t-sql)\b/i, defaultImportance: 'required' },

  // Frontend
  { skill: 'React', regex: /\b(react|reactjs|react\.js)\b/i, defaultImportance: 'required' },
  { skill: 'Next.js', regex: /\b(next|nextjs|next\.js)\b/i, defaultImportance: 'required' },
  { skill: 'Vue.js', regex: /\b(vue|vuejs|vue\.js)\b/i, defaultImportance: 'required' },
  { skill: 'Angular', regex: /\b(angular|angularjs)\b/i, defaultImportance: 'required' },
  { skill: 'Tailwind CSS', regex: /\b(tailwind|tailwindcss)\b/i, defaultImportance: 'preferred' },
  { skill: 'Redux', regex: /\b(redux|zustand)\b/i, defaultImportance: 'preferred' },
  { skill: 'HTML5', regex: /\b(html|html5)\b/i, defaultImportance: 'required' },
  { skill: 'CSS3', regex: /\b(css|css3|sass|scss)\b/i, defaultImportance: 'required' },

  // Backend & Databases
  { skill: 'Node.js', regex: /\b(node|nodejs|node\.js)\b/i, defaultImportance: 'required' },
  { skill: 'Express', regex: /\b(express|expressjs)\b/i, defaultImportance: 'required' },
  { skill: 'Django', regex: /\b(django|fastapi|flask)\b/i, defaultImportance: 'required' },
  { skill: 'Spring Boot', regex: /\b(spring|spring boot)\b/i, defaultImportance: 'required' },
  { skill: 'PostgreSQL', regex: /\b(postgres|postgresql|pgvector)\b/i, defaultImportance: 'required' },
  { skill: 'MongoDB', regex: /\b(mongo|mongodb)\b/i, defaultImportance: 'required' },
  { skill: 'Redis', regex: /\b(redis|caching)\b/i, defaultImportance: 'preferred' },
  { skill: 'GraphQL', regex: /\b(graphql)\b/i, defaultImportance: 'preferred' },
  { skill: 'REST APIs', regex: /\b(rest|restful|rest api|apis)\b/i, defaultImportance: 'required' },

  // Cloud & DevOps
  { skill: 'Docker', regex: /\b(docker|dockerized|containers|containerization)\b/i, defaultImportance: 'required' },
  { skill: 'Kubernetes', regex: /\b(kubernetes|k8s)\b/i, defaultImportance: 'required' },
  { skill: 'AWS', regex: /\b(aws|amazon web services|ec2|s3|lambda)\b/i, defaultImportance: 'required' },
  { skill: 'Google Cloud', regex: /\b(gcp|google cloud)\b/i, defaultImportance: 'preferred' },
  { skill: 'Azure', regex: /\b(azure)\b/i, defaultImportance: 'preferred' },
  { skill: 'CI/CD', regex: /\b(ci\/cd|cicd|github actions|jenkins)\b/i, defaultImportance: 'required' },
  { skill: 'Git', regex: /\b(git|github|gitlab)\b/i, defaultImportance: 'required' },

  // Testing & Quality
  { skill: 'Testing (Jest/Vitest)', regex: /\b(jest|vitest|mocha|cypress|playwright|unit testing|testing)\b/i, defaultImportance: 'required' },

  // Data / AI / Security
  { skill: 'Pandas', regex: /\b(pandas|numpy|scikit|jupyter)\b/i, defaultImportance: 'required' },
  { skill: 'PyTorch/TensorFlow', regex: /\b(pytorch|tensorflow|keras|ml|machine learning)\b/i, defaultImportance: 'required' },
  { skill: 'Power BI', regex: /\b(power bi|tableau|data visualization)\b/i, defaultImportance: 'required' },
  { skill: 'Network Security', regex: /\b(security|cybersecurity|penetration|burp suite|vulnerability|network security)\b/i, defaultImportance: 'required' }
];

export function extractJobRequirements(job: {
  title: string;
  description: string;
  tags?: string[];
  skills?: string[];
}): JobRequirements {
  const fullText = `${job.title} ${job.tags?.join(' ') || ''} ${job.skills?.join(' ') || ''} ${job.description}`;
  const extractedMap = new Map<string, ExtractedRequirement>();

  // Process explicit tags first
  if (job.tags && Array.isArray(job.tags)) {
    job.tags.forEach((tag) => {
      const norm = normalizeSkill(tag);
      if (norm && norm.length > 1) {
        extractedMap.set(norm.toLowerCase(), {
          skill: norm,
          importance: 'required',
          evidence: `Explicit tag in ${job.title} posting`
        });
      }
    });
  }

  // Scan dictionary regex against full text
  TECH_KEYWORDS_DICTIONARY.forEach((item) => {
    const key = item.skill.toLowerCase();
    if (!extractedMap.has(key) && item.regex.test(fullText)) {
      // Check if mentioned in preferred/plus context
      const match = fullText.match(new RegExp(`(?:plus|preferred|nice to have|bonus|optional)[^.!?]*${item.skill}`, 'i'));
      const importance = match ? 'preferred' : item.defaultImportance;

      // Extract matching sentence snippet for evidence
      const sentences = fullText.split(/[.!?\n]+/);
      const matchingSentence = sentences.find(s => item.regex.test(s))?.trim() || `${item.skill} mentioned in job description`;

      extractedMap.set(key, {
        skill: item.skill,
        importance: importance,
        evidence: matchingSentence.substring(0, 150)
      });
    }
  });

  // Soft skills extraction
  const softSkills: string[] = [];
  if (/communication/i.test(fullText)) softSkills.push('Communication');
  if (/teamwork|collaborat/i.test(fullText)) softSkills.push('Teamwork & Collaboration');
  if (/problem solving|problem-solving/i.test(fullText)) softSkills.push('Problem Solving');
  if (/agile|scrum/i.test(fullText)) softSkills.push('Agile & Scrum');

  // Experience level extraction
  const experienceRequirements: string[] = [];
  const expMatch = fullText.match(/\b(\d+\+?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience|exp)?)\b/i);
  if (expMatch) {
    experienceRequirements.push(expMatch[1]);
  } else if (/senior|lead|principal/i.test(job.title)) {
    experienceRequirements.push('5+ years expected for Senior/Lead role');
  } else if (/junior|entry|intern/i.test(job.title)) {
    experienceRequirements.push('0-2 years (Entry/Junior level)');
  } else {
    experienceRequirements.push('2-4 years industry experience');
  }

  return {
    technicalSkills: Array.from(extractedMap.values()),
    softSkills,
    experienceRequirements
  };
}
