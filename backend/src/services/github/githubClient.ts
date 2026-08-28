import { env } from '../../config/env.js';

export interface RawGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url?: string;
  default_branch: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  disabled?: boolean;
  is_template?: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  owner: { login: string };
}

export interface RawGitHubUser {
  id: number;
  login: string;
  name: string | null;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  html_url: string;
  bio: string | null;
}

export class GitHubClient {
  private static baseUrl = 'https://api.github.com';

  private static getHeaders(accessToken?: string) {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Team-Placebo-CareerPilot-App',
    };

    // Priority: User's provided token -> Server env GITHUB_TOKEN -> Unauthenticated
    const activeToken = (accessToken && accessToken.trim()) || env.GITHUB_TOKEN?.trim();

    if (activeToken) {
      headers.Authorization = `Bearer ${activeToken}`;
    }
    return headers;
  }

  /**
   * Fetch GitHub User Profile
   */
  static async getUser(username: string, accessToken?: string): Promise<RawGitHubUser> {
    const cleanUser = username.trim();
    const url = `${this.baseUrl}/users/${cleanUser}`;
    try {
      const res = await fetch(url, {
        headers: this.getHeaders(accessToken),
      });

      if (res.status === 404) {
        throw new Error(`GitHub user '${cleanUser}' not found.`);
      }
      if (res.status === 403) {
        throw new Error('GitHub API rate limit exceeded (60 req/hr unauthenticated limit). Please supply a GitHub Personal Access Token (PAT) to increase limit to 5,000 req/hr.');
      }
      if (!res.ok) {
        throw new Error(`GitHub API error HTTP ${res.status}`);
      }

      return (await res.json()) as RawGitHubUser;
    } catch (err: any) {
      throw new Error(`Failed to fetch GitHub user: ${err.message}`);
    }
  }

  /**
   * Fetch all user repositories using GitHub API pagination
   */
  static async getUserRepositories(username: string, accessToken?: string): Promise<RawGitHubRepo[]> {
    const cleanUser = username.trim();
    let page = 1;
    const perPage = 100;
    let allRepos: RawGitHubRepo[] = [];
    let hasMore = true;

    while (hasMore && page <= 10) {
      const url = `${this.baseUrl}/users/${cleanUser}/repos?per_page=${perPage}&page=${page}&sort=pushed&direction=desc`;
      try {
        const res = await fetch(url, {
          headers: this.getHeaders(accessToken),
        });

        if (!res.ok) {
          if (page > 1) break;
          if (res.status === 403) {
            throw new Error('GitHub API rate limit exceeded while retrieving repositories. Please supply a GitHub Personal Access Token.');
          }
          throw new Error(`GitHub API error HTTP ${res.status}`);
        }

        const repos = (await res.json()) as RawGitHubRepo[];
        allRepos = allRepos.concat(repos);

        if (repos.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (err: any) {
        if (page > 1) break;
        throw new Error(`Failed to fetch GitHub repositories for '${cleanUser}': ${err.message}`);
      }
    }

    return allRepos;
  }

  /**
   * Fetch language byte breakdown for a repository
   */
  static async getRepoLanguages(owner: string, repo: string, accessToken?: string): Promise<Record<string, number>> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/languages`;
    try {
      const res = await fetch(url, {
        headers: this.getHeaders(accessToken),
      });
      if (!res.ok) return {};
      return (await res.json()) as Record<string, number>;
    } catch {
      return {};
    }
  }

  /**
   * Fetch file content or directory list from repo (e.g. package.json, requirements.txt, Dockerfile)
   */
  static async getRepoFileContent(owner: string, repo: string, filePath: string, accessToken?: string): Promise<string | null> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${filePath}`;
    try {
      const res = await fetch(url, {
        headers: this.getHeaders(accessToken),
      });

      if (!res.ok) return null;
      const data = (await res.json()) as any;

      if (data && data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }
}
