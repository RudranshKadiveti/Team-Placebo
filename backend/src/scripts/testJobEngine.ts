import { JobSearchService } from '../services/jobSearch.service.js';
import { CareerRoadmapService } from '../services/careerRoadmap.service.js';

async function testJobEngine() {
  console.log('--- TESTING JOB SEARCH ENGINE ---');
  const targetRole = 'Frontend React Developer';
  const userSkills = ['JavaScript', 'HTML', 'CSS']; // Pretend they don't know React well yet
  const githubSkills = ['Python', 'Django'];

  try {
    // 1. Search Jobs
    console.log(`\n🔍 Searching for: ${targetRole}`);
    const jobs = await JobSearchService.searchJobs(targetRole, 3);
    
    if (jobs.length === 0) {
      console.log('No jobs found.');
      return;
    }

    console.log(`✅ Found ${jobs.length} jobs.`);
    jobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title} at ${job.company} (${job.location})`);
    });

    const targetJob = jobs[0];

    // 2. Generate Roadmap
    console.log(`\n🗺️ Generating Roadmap for: ${targetJob.title} at ${targetJob.company}...`);
    const roadmap = await CareerRoadmapService.generateRoadmap(
      targetRole,
      targetJob.title,
      targetJob.description,
      userSkills,
      githubSkills
    );

    console.log('\n✅ Roadmap Generated:');
    console.log('--------------------------------------------------');
    console.log(roadmap);
    console.log('--------------------------------------------------');

    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testJobEngine();
