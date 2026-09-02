/**
 * Utility to extract clean GitHub username & URL from raw text or input strings
 */
export interface ExtractedGitHubInfo {
  username: string | null;
  url: string | null;
}

export const extractGitHubInfo = (input: string): ExtractedGitHubInfo => {
  if (!input || !input.trim()) {
    return { username: null, url: null };
  }

  const cleanInput = input.trim();

  // Pattern 1: Full URL like https://github.com/username or github.com/username
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)/i;
  const match = cleanInput.match(urlRegex);

  if (match && match[1]) {
    const rawPath = match[1].replace(/\/+$/, '');
    const parts = rawPath.split('/');
    const candidate = parts[0];

    const reservedWords = [
      'orgs',
      'settings',
      'features',
      'repositories',
      'site',
      'about',
      'pricing',
      'login',
      'signup',
      'explore',
      'topics',
      'trending',
      'collections',
      'events',
      'sponsors',
    ];

    if (candidate && !reservedWords.includes(candidate.toLowerCase())) {
      return {
        username: candidate,
        url: `https://github.com/${candidate}`,
      };
    }
  }

  // Pattern 2: Direct username (alphanumeric with hyphens/underscores, 1-39 chars)
  const usernameOnlyRegex = /^[a-zA-Z0-9_-]{1,39}$/;
  if (usernameOnlyRegex.test(cleanInput)) {
    return {
      username: cleanInput,
      url: `https://github.com/${cleanInput}`,
    };
  }

  return { username: null, url: null };
};
