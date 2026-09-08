import axios from 'axios';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  description: string;
  source: string;
  tags?: string[];
  skills?: string[];
}

export class JobSearchService {
  /**
   * Fetches remote jobs strictly matching the user's typed target role.
   * Preserves full job descriptions (up to 4,000 chars) and tags.
   */
  static async searchJobs(targetRole: string, region: string = 'Worldwide'): Promise<JobListing[]> {
    console.log(`[JobSearchService] Searching jobs for role: ${targetRole}, Region: ${region}`);

    if (!targetRole || !targetRole.trim()) {
      return [];
    }

    const cleanRole = targetRole.trim().toLowerCase();
    const searchTerms = cleanRole.split(/\s+/).filter(t => t.length > 1);

    const isMatch = (title: string, desc: string): boolean => {
      const lowerTitle = title.toLowerCase();
      const lowerDesc = desc.toLowerCase();

      if (lowerTitle.includes(cleanRole) || lowerDesc.includes(cleanRole)) {
        return true;
      }
      return searchTerms.some(term => lowerTitle.includes(term));
    };

    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (rapidApiKey && rapidApiKey.trim()) {
      try {
        const query = `${targetRole} in ${region}`;
        const response = await axios.get('https://jsearch.p.rapidapi.com/search-v2', {
          params: { query, page: '1', num_pages: '3' },
          timeout: 10000,
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          }
        });
        
        if (response.data && response.data.data) {
          let fetchedJobs = Array.isArray(response.data.data) 
            ? response.data.data 
            : (response.data.data.jobs || []);
            
          if (Array.isArray(fetchedJobs) && fetchedJobs.length > 0) {
            const matchingJobs = fetchedJobs.filter((job: any) => 
              isMatch(job.job_title || '', job.job_description || '')
            );

            if (matchingJobs.length > 0) {
              return matchingJobs.map((job: any) => {
                const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || 'Remote';
                const fullDescClean = this.stripHtml(job.job_description || '').substring(0, 4000);
                const tags = Array.isArray(job.job_highlights?.Qualifications) ? job.job_highlights.Qualifications : [];

                return {
                  id: job.job_id || Math.random().toString(36).substr(2, 9),
                  title: job.job_title || targetRole,
                  company: job.employer_name || 'Tech Corp',
                  url: job.job_apply_link || job.job_google_link || '#',
                  location: job.job_is_remote ? (location === 'Remote' ? 'Remote' : `${location} (Remote)`) : location,
                  salary: job.job_min_salary ? `$${job.job_min_salary} - $${job.job_max_salary}` : 'Competitive / Market Standard',
                  description: fullDescClean,
                  source: job.employer_website ? 'LinkedIn/Employer' : 'Google Jobs',
                  tags: tags,
                  skills: []
                };
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('[JobSearchService] JSearch API call failed:', err.message);
      }
    }

    // Remotive Free Public API Fallback
    try {
      console.log(`[JobSearchService] Fetching from Remotive API for: ${targetRole}`);
      const remotiveUrl = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(targetRole)}&limit=25`;
      const remotiveRes = await axios.get(remotiveUrl, { timeout: 10000 });

      if (remotiveRes.data && Array.isArray(remotiveRes.data.jobs) && remotiveRes.data.jobs.length > 0) {
        const matchingJobs = remotiveRes.data.jobs.filter((job: any) => 
          isMatch(job.title || '', this.stripHtml(job.description || ''))
        );

        if (matchingJobs.length > 0) {
          return matchingJobs.map((job: any) => {
            const fullDescClean = this.stripHtml(job.description || '').substring(0, 4000);
            const tags = Array.isArray(job.tags) ? job.tags : [];

            return {
              id: String(job.id || Math.random().toString(36).substr(2, 9)),
              title: job.title,
              company: job.company_name || 'Tech Partner',
              url: job.url || '#',
              location: job.candidate_required_location || 'Remote (Worldwide)',
              salary: job.salary || 'Competitive',
              description: fullDescClean,
              source: 'Remotive',
              tags: tags,
              skills: tags
            };
          });
        }
      }
    } catch (remotiveErr: any) {
      console.warn('[JobSearchService] Remotive API fallback failed:', remotiveErr.message);
    }

    return [];
  }

  private static stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
