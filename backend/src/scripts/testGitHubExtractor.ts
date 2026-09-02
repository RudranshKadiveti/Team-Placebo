import { extractGitHubInfo } from '../utils/githubExtractor.js';

console.log('--- TESTING GITHUB EXTRACTOR ---');

const testCases = [
  'https://github.com/torvalds',
  'http://www.github.com/octocat',
  'github.com/saisuraj',
  'Check my profile at https://github.com/saisuraj/project-repo for source code',
  'Contact: email@example.com, GitHub: octocat',
  'octocat',
  'https://github.com/orgs/someorg',
  'https://github.com/settings/profile',
];

for (const test of testCases) {
  const res = extractGitHubInfo(test);
  console.log(`Input: "${test}" => Username: ${res.username || 'NONE'}, URL: ${res.url || 'NONE'}`);
}
