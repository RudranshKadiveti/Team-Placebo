import axios from 'axios';

async function testRemotive() {
  const role = "Frontend React Developer";
  console.log(`Searching for: ${role}`);
  
  try {
    const res1 = await axios.get(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}`);
    console.log('Search param results count:', res1.data.jobs.length);
    console.log('First 5 titles:', res1.data.jobs.slice(0,5).map((j:any) => j.title));
  } catch (err: any) {
    console.error(err.message);
  }
}

testRemotive();
