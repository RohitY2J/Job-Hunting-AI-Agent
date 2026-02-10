require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

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

async function testAPI() {
  console.log('🧪 AI Job Agent API Test Suite\n');
  console.log('='.repeat(50));
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Health Check
  try {
    console.log('\n[1/6] Testing Health Endpoint...');
    const response = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Server is running');
    console.log(`   Status: ${response.data.status}`);
    testsPassed++;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    testsFailed++;
  }

  // Test 2: Get LLM Provider
  try {
    console.log('\n[2/6] Testing Get LLM Provider...');
    const response = await axios.get(`${API_URL}/api/llm/provider`);
    console.log('✅ LLM provider retrieved');
    console.log(`   Current: ${response.data.provider}`);
    console.log(`   Ollama available: ${response.data.available.ollama}`);
    console.log(`   Groq available: ${response.data.available.groq}`);
    testsPassed++;
  } catch (error) {
    console.log('❌ Get provider failed:', error.message);
    testsFailed++;
  }

  // Test 3: Switch LLM Provider to Groq
  try {
    console.log('\n[3/6] Testing Switch to Groq...');
    const response = await axios.post(`${API_URL}/api/llm/provider`, {
      provider: 'groq'
    });
    console.log('✅ Switched to Groq');
    console.log(`   Message: ${response.data.message}`);
    testsPassed++;
  } catch (error) {
    console.log('❌ Switch to Groq failed:', error.message);
    testsFailed++;
  }

  // Test 4: Extract Jobs from HTML
  try {
    console.log('\n[4/6] Testing Job Extraction from HTML...');
    const response = await axios.post(`${API_URL}/api/jobs/extract-html`, {
      html: testHTML
    });
    console.log('✅ Jobs extracted successfully');
    console.log(`   Jobs found: ${response.data.data.jobs.length}`);
    console.log(`   Companies found: ${response.data.data.companies.length}`);
    
    if (response.data.data.jobs.length > 0) {
      console.log('\n   Sample job:');
      const job = response.data.data.jobs[0];
      console.log(`   - Title: ${job.title}`);
      console.log(`   - Company: ${job.company}`);
      console.log(`   - Location: ${job.location}`);
      console.log(`   - Skills: ${job.skills?.join(', ') || 'None'}`);
    }
    testsPassed++;
  } catch (error) {
    console.log('❌ Job extraction failed:', error.response?.data?.error || error.message);
    testsFailed++;
  }

  // Test 5: Chat with HTML
  try {
    console.log('\n[5/6] Testing Chat with HTML...');
    const response = await axios.post(`${API_URL}/api/chat`, {
      message: testHTML,
      context: {}
    });
    console.log('✅ Chat processed HTML');
    console.log(`   Type: ${response.data.type}`);
    console.log(`   Response: ${response.data.response}`);
    testsPassed++;
  } catch (error) {
    console.log('❌ Chat test failed:', error.response?.data?.error || error.message);
    testsFailed++;
  }

  // Test 6: Get Jobs from Database
  try {
    console.log('\n[6/6] Testing Get Jobs...');
    const response = await axios.get(`${API_URL}/api/jobs?limit=5`);
    console.log('✅ Jobs retrieved from database');
    console.log(`   Total jobs: ${response.data.total}`);
    console.log(`   Jobs in response: ${response.data.jobs.length}`);
    testsPassed++;
  } catch (error) {
    console.log('❌ Get jobs failed:', error.message);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   Total: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above.');
  }

  console.log('\n' + '='.repeat(50));
}

// Run tests
testAPI().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  process.exit(1);
});
