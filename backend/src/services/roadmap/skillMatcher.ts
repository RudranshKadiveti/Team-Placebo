import { UserProfile } from './profileNormalizer.js';
import { JobRequirements, ExtractedRequirement } from './jobRequirementExtractor.js';
import { normalizeSkill } from './skillNormalizer.js';

export interface MatchedSkillResult {
  skill: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PartialMatchResult {
  skill: string;
  evidence: string;
  relatedTo: string;
}

export interface SkillGapResult {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  jobEvidence: string;
  currentLevel: 'none' | 'beginner' | 'intermediate' | 'advanced';
  targetLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface DeterministicMatchOutput {
  matchedSkills: MatchedSkillResult[];
  partialMatches: PartialMatchResult[];
  skillGaps: SkillGapResult[];
  readinessScore: number;
}

// Equivalent/Related Skill mappings for partial matching (e.g. JS -> TS)
const RELATED_SKILLS_MAP: Record<string, string[]> = {
  'TypeScript': ['JavaScript'],
  'Next.js': ['React', 'JavaScript'],
  'Express': ['Node.js', 'JavaScript'],
  'Docker': ['Linux', 'CI/CD'],
  'Kubernetes': ['Docker'],
  'PostgreSQL': ['SQL', 'MongoDB'],
  'Jest': ['Testing (Jest/Vitest)', 'JavaScript'],
  'PyTorch/TensorFlow': ['Python', 'Pandas'],
  'Power BI': ['SQL', 'Excel']
};

export function matchSkills(
  userProfile: UserProfile,
  jobRequirements: JobRequirements
): DeterministicMatchOutput {
  const userSkillMap = new Map<string, { name: string; source: string[]; confidence: number }>();
  userProfile.skills.forEach(s => userSkillMap.set(s.name.toLowerCase(), s));

  const matchedSkills: MatchedSkillResult[] = [];
  const partialMatches: PartialMatchResult[] = [];
  const skillGaps: SkillGapResult[] = [];

  let requiredCount = 0;

  jobRequirements.technicalSkills.forEach((req: ExtractedRequirement) => {
    if (req.importance === 'required') requiredCount++;

    const key = req.skill.toLowerCase();

    // 1. Direct Match Check
    if (userSkillMap.has(key)) {
      const userSkill = userSkillMap.get(key)!;
      matchedSkills.push({
        skill: req.skill,
        evidence: `Verified in ${userSkill.source.join(' & ')}`,
        confidence: userSkill.confidence >= 0.9 ? 'high' : 'medium'
      });
      return;
    }

    // 2. Partial Match Check
    const related = RELATED_SKILLS_MAP[req.skill];
    let foundPartial = false;
    if (related) {
      for (const relSkill of related) {
        if (userSkillMap.has(relSkill.toLowerCase())) {
          foundPartial = true;
          partialMatches.push({
            skill: req.skill,
            evidence: `Candidate demonstrates prerequisite ${relSkill} in ${userSkillMap.get(relSkill.toLowerCase())?.source.join(' & ')}`,
            relatedTo: relSkill
          });
          break;
        }
      }
    }

    // 3. Skill Gap
    const priority = req.importance === 'required' ? 'high' : 'medium';
    skillGaps.push({
      skill: req.skill,
      priority,
      reason: `Required for role (${req.evidence})`,
      jobEvidence: req.evidence,
      currentLevel: foundPartial ? 'beginner' : 'none',
      targetLevel: req.importance === 'required' ? 'advanced' : 'intermediate'
    });
  });

  // Calculate evidence-based readiness percentage score
  const total = Math.max(1, requiredCount);
  const scoreRaw = Math.round(((matchedSkills.length + partialMatches.length * 0.5) / total) * 100);
  const readinessScore = Math.min(95, Math.max(25, scoreRaw));

  return {
    matchedSkills,
    partialMatches,
    skillGaps,
    readinessScore
  };
}
