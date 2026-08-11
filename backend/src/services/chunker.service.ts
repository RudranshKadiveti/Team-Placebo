import crypto from 'crypto';

export interface RawChunk {
  chunkIndex: number;
  sectionType: string;
  content: string;
  contentHash: string;
}

/**
 * Section-Aware Chunker Service (v1)
 * Splits extracted resume text into meaningful semantic chunks (Skills, Experience, Projects, Education, etc.).
 */
export const chunkResumeText = (text: string): RawChunk[] => {
  if (!text || !text.trim()) {
    return [];
  }

  const normalizedText = text.replace(/\r\n/g, '\n');
  const lines = normalizedText.split('\n');

  const chunks: RawChunk[] = [];
  let currentSectionType = 'SUMMARY';
  let currentLines: string[] = [];

  const sectionKeywords: Record<string, RegExp> = {
    SKILLS: /^(skills|technical skills|core competencies|expertise)/i,
    EXPERIENCE: /^(experience|work experience|employment history|professional experience)/i,
    PROJECTS: /^(projects|personal projects|key projects|academic projects)/i,
    EDUCATION: /^(education|academic background|qualifications)/i,
    CERTIFICATIONS: /^(certifications|licenses|courses|training)/i,
    ACHIEVEMENTS: /^(achievements|awards|honors|publications)/i,
  };

  const flushChunk = () => {
    const content = currentLines.join('\n').trim();
    if (content.length > 10) { // Avoid tiny/empty chunks
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');
      chunks.push({
        chunkIndex: chunks.length,
        sectionType: currentSectionType,
        content,
        contentHash,
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if line matches a new section header
    let matchedSection: string | null = null;
    for (const [sectionKey, regex] of Object.entries(sectionKeywords)) {
      if (regex.test(trimmedLine)) {
        matchedSection = sectionKey;
        break;
      }
    }

    if (matchedSection) {
      flushChunk();
      currentSectionType = matchedSection;
      currentLines.push(trimmedLine);
    } else {
      currentLines.push(trimmedLine);
    }
  }

  flushChunk();

  // If no sections were matched, fall back to paragraph-based chunking
  if (chunks.length === 0 && text.trim().length > 0) {
    const content = text.trim();
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    chunks.push({
      chunkIndex: 0,
      sectionType: 'GENERAL',
      content,
      contentHash,
    });
  }

  return chunks;
};
