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
}

export class JobSearchService {
  /**
   * Fetches remote jobs based on a target role.
   * Uses the free Remotive API for tech jobs.
   */
  static async searchJobs(targetRole: string, region: string = 'Worldwide'): Promise<JobListing[]> {
    try {
      console.log(`[JobSearchService] Searching jobs for role: ${targetRole}, Region: ${region} via JSearch`);
      
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        console.warn('[JobSearchService] Missing RAPIDAPI_KEY. Please add it to your .env file.');
        throw new Error('RAPIDAPI_KEY is missing');
      }

      const query = `${targetRole} in ${region}`;
      
      const response = await axios.get('https://jsearch.p.rapidapi.com/search-v2', {
        params: {
          query: query,
          page: '1',
          num_pages: '3'
        },
        timeout: 30000,
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });
      
      if (!response.data || !response.data.data) {
        return [];
      }

      let fetchedJobs = Array.isArray(response.data.data) 
        ? response.data.data 
        : (response.data.data.jobs || []);
        
      if (!Array.isArray(fetchedJobs)) {
        return [];
      }

      // Region Filter
      if (region && region.toLowerCase() !== 'worldwide') {
        const targetRegion = region.toLowerCase();
        fetchedJobs = fetchedJobs.filter((job: any) => {
          const loc = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(' ').toLowerCase();
          return loc.includes(targetRegion) || job.job_location?.toLowerCase().includes(targetRegion) || loc.includes('worldwide') || loc.includes('anywhere') || loc.includes('global') || job.job_is_remote;
        });
      }

      const jobs = fetchedJobs.map((job: any) => {
        const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || 'Remote';
        return {
          id: job.job_id || Math.random().toString(36).substr(2, 9),
          title: job.job_title,
          company: job.employer_name,
          url: job.job_apply_link || job.job_google_link,
          location: job.job_is_remote ? (location === 'Remote' ? 'Remote' : `${location} (Remote)`) : location,
          salary: job.job_min_salary ? `$${job.job_min_salary} - $${job.job_max_salary}` : 'Not specified',
          description: (job.job_description || '').substring(0, 500) + '...',
          source: job.employer_website ? 'LinkedIn/Employer' : 'Google Jobs',
        };
      });

      return jobs;
    } catch (error) {
      console.error('[JobSearchService] Error fetching jobs:', error);
      throw new Error('Failed to fetch job listings from JSearch');
    }
  }

  private static stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  }
}
