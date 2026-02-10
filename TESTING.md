# Testing Guide 🧪

## Available Tests

### 1. LLM Service Test
Tests the LLM extraction functionality (Ollama/Groq).

```bash
npm run test:llm
```

**What it tests:**
- Connection to Ollama/Groq
- Job extraction from HTML
- JSON parsing
- Skill detection

**Expected output:**
```
🧪 Testing LLM Service...
📝 Extracting jobs from HTML...
✅ Success!
📊 Results:
   Jobs found: 2
   Companies found: 2
```

### 2. API Test Suite
Tests all backend API endpoints.

```bash
npm run test:api
```

**What it tests:**
- Health check endpoint
- LLM provider status
- Provider switching
- Job extraction from HTML
- Chat with HTML detection
- Database job retrieval

**Expected output:**
```
🧪 AI Job Agent API Test Suite
[1/6] Testing Health Endpoint... ✅
[2/6] Testing Get LLM Provider... ✅
[3/6] Testing Switch to Groq... ✅
[4/6] Testing Job Extraction... ✅
[5/6] Testing Chat with HTML... ✅
[6/6] Testing Get Jobs... ✅

📊 Test Summary:
   ✅ Passed: 6
   ❌ Failed: 0
```

## Prerequisites

### Before Running Tests

1. **Start MongoDB**
   ```bash
   mongod
   ```

2. **Start Server**
   ```bash
   npm run server
   ```

3. **Configure Environment**
   Make sure `.env` has:
   ```bash
   GROQ_API_KEY=your_key_here
   OLLAMA_URL=http://localhost:11434
   ```

## Test Files

### `test-llm.js`
- Tests LLM service directly
- Uses sample HTML
- Shows extracted job data
- Runs independently

### `test-api.js`
- Tests HTTP endpoints
- Requires server running
- Comprehensive API coverage
- Shows detailed results

## Running Tests

### Quick Test (LLM Only)
```bash
# Test if LLM is working
npm run test:llm
```

### Full Test (All APIs)
```bash
# Start server first
npm run server

# In another terminal
npm run test:api
```

### Manual API Testing

#### Test Health
```bash
curl http://localhost:3001/api/health
```

#### Test LLM Provider
```bash
curl http://localhost:3001/api/llm/provider
```

#### Switch to Groq
```bash
curl -X POST http://localhost:3001/api/llm/provider \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq"}'
```

#### Extract Jobs
```bash
curl -X POST http://localhost:3001/api/jobs/extract-html \
  -H "Content-Type: application/json" \
  -d '{"html":"<div><h3>Software Engineer</h3><div>Google</div></div>"}'
```

## Troubleshooting

### Test Fails: "Connection refused"
- Server not running
- Wrong port in `.env`
- MongoDB not started

**Fix:**
```bash
# Start MongoDB
mongod

# Start server
npm run server
```

### Test Fails: "Ollama not available"
- Ollama not installed
- Ollama not running
- Wrong URL in `.env`

**Fix:**
```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### Test Fails: "Groq API error"
- Invalid API key
- Rate limit exceeded
- Network issue

**Fix:**
- Check `GROQ_API_KEY` in `.env`
- Wait a minute (rate limit)
- Check internet connection

### Test Fails: "No jobs extracted"
- LLM returned invalid JSON
- HTML format not recognized
- Model needs better prompt

**Fix:**
- Try different LLM provider
- Check test HTML format
- Review LLM service logs

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:llm
```

## Test Coverage

### Covered ✅
- Health check
- LLM provider switching
- Job extraction
- HTML parsing
- Chat interface
- Database queries

### Not Covered ❌
- Chrome extension
- Frontend components
- File uploads
- Resume parsing

## Adding New Tests

### Example: Test New Endpoint
```javascript
// In test-api.js
try {
  console.log('\n[7/7] Testing New Endpoint...');
  const response = await axios.get(`${API_URL}/api/new-endpoint`);
  console.log('✅ New endpoint works');
  testsPassed++;
} catch (error) {
  console.log('❌ New endpoint failed:', error.message);
  testsFailed++;
}
```

## Performance Benchmarks

### Expected Response Times
- Health check: < 10ms
- Get provider: < 50ms
- Switch provider: < 100ms
- Extract jobs (Groq): 1-3 seconds
- Extract jobs (Ollama): 5-10 seconds
- Get jobs from DB: < 200ms

## Best Practices

1. **Run tests before commits**
2. **Test both LLM providers**
3. **Check logs for errors**
4. **Verify database state**
5. **Test with real LinkedIn HTML**

---

**Happy Testing! 🚀**
