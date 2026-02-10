require('dotenv').config();
const llmService = require('./server/services/llmService');

const testHTML = `
<div class="job-card">
  <h3>Senior Software Engineer</h3>
  <div class="company">Google Australia</div>
  <div class="location">Sydney, NSW</div>
  <div class="description">
    We are looking for a Senior Software Engineer with experience in Python, React, and AWS.
    Must have 5+ years of experience in full-stack development.
  </div>
</div>
<div class="job-card">
  <h3>DevOps Engineer</h3>
  <div class="company">Atlassian</div>
  <div class="location">Melbourne, VIC</div>
  <div class="description">
    Join our DevOps team! Experience with Kubernetes, Docker, and CI/CD required.
  </div>
</div>
`;

async function test() {
  console.log('🧪 Testing LLM Service...\n');
  
  try {
    console.log('📝 Extracting jobs from HTML...');
    const result = await llmService.extractJobsFromHTML(testHTML);
    
    console.log('\n✅ Success!\n');
    console.log('📊 Results:');
    console.log(`   Jobs found: ${result.jobs.length}`);
    console.log(`   Companies found: ${result.companies.length}\n`);
    
    console.log('📋 Extracted Jobs:');
    result.jobs.forEach((job, i) => {
      console.log(`\n   ${i + 1}. ${job.title}`);
      console.log(`      Company: ${job.company}`);
      console.log(`      Location: ${job.location}`);
      console.log(`      Skills: ${job.skills?.join(', ') || 'None detected'}`);
    });
    
    console.log('\n\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Ollama is running: ollama serve');
    console.error('2. Pull the model: ollama pull deepseek-r1:1.5b');
    console.error('3. Or add Groq API key to .env file');
  }
}

test();
