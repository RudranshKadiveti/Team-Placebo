import 'dotenv/config';
import { JobSearchService } from '../services/jobSearch.service.js';

async function testFilter() {
  const role = "Software Engineer";
  const region = "India";
  console.log(`Searching via JobSearchService for: ${role} in ${region}`);
  
  try {
    const jobs = await JobSearchService.searchJobs(role, region, 10);
    console.log('Results count:', jobs.length);
    console.log('Filtered Titles:');
    jobs.forEach(j => console.log(` - ${j.title} (${j.location})`));
  } catch (err: any) {
    console.error(err.message);
  }
}

testFilter();
