const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const Job = require('./models/Job');
const Company = require('./models/Company');
const ChatHistory = require('./models/ChatHistory');
const htmlParserService = require('./services/htmlParserService');
const llmService = require('./services/llmService');

// Initialize database connection
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors()); // Enable cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

// ============================================
// JOB ENDPOINTS
// ============================================

// Get jobs with filters (category, location, skills, etc.)
app.get('/api/jobs', async (req, res) => {
  try {
    const { category, location, remote, skills, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (location) {
      filter.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') }
      ];
    }
    if (remote === 'true') filter['location.remote'] = true;
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      filter.skills = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }

    // Query database with pagination
    const jobs = await Job.find(filter)
      .populate('company', 'name industry size location website')
      .sort({ datePosted: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get distinct job categories
app.get('/api/jobs/categories', async (req, res) => {
  try {
    const categories = await Job.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Extract jobs from HTML using LLM
app.post('/api/jobs/extract-html', async (req, res) => {
  try {
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content required' });
    }

    // Use LLM to parse HTML and extract job data
    const extracted = await htmlParserService.parseAndExtractJobs(html);
    
    res.json({
      success: true,
      data: extracted,
      message: `Found ${extracted.jobs.length} jobs and ${extracted.companies.length} companies`
    });
  } catch (error) {
    console.error('Error extracting jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save extracted jobs to database
app.post('/api/jobs/save-extracted', async (req, res) => {
  try {
    const { jobs, companies } = req.body;
    
    if (!jobs || !companies) {
      return res.status(400).json({ error: 'Jobs and companies data required' });
    }

    // Save to MongoDB
    const saved = await htmlParserService.saveToDatabase({ jobs, companies });
    
    res.json({
      success: true,
      saved: {
        jobs: saved.jobs.length,
        companies: saved.companies.length
      },
      message: `Saved ${saved.jobs.length} jobs and ${saved.companies.length} companies`
    });
  } catch (error) {
    console.error('Error saving jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AI CHAT ENDPOINTS
// ============================================

// Main chat endpoint with history support
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, sessionId } = req.body;
    
    // Special case: HTML job extraction
    if (message.includes('<') && message.includes('>')) {
      const extracted = await htmlParserService.parseAndExtractJobs(message);
      return res.json({
        type: 'job_extraction',
        data: extracted,
        response: `I found ${extracted.jobs.length} jobs and ${extracted.companies.length} companies. Would you like to save them to the database?`
      });
    }
    
    // Get or create chat session
    let chatHistory = await ChatHistory.findOne({ sessionId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        sessionId,
        messages: [{
          role: 'system',
          content: 'You are an experienced job hunter and career advisor. Ask clarifying questions when needed, think step-by-step, and provide practical advice from a job seeker\'s perspective. Be conversational and empathetic.'
        }]
      });
    }
    
    // Add user message to conversation history
    chatHistory.messages.push({
      role: 'user',
      content: message
    });
    
    // Build prompt with user context and conversation history
    const prompt = `You are an experienced job hunter and career advisor AI assistant.

IMPORTANT INSTRUCTIONS:
1. First, ask any clarifying questions you need to provide the best advice
2. Think step-by-step before responding
3. Draw from your experience as a job seeker to give practical, actionable advice
4. Be conversational and empathetic

User Context:
- Skills: ${context.skills?.join(', ') || 'Not provided'}
- Experience: ${context.experience || 'Not provided'}
- Resume Analyzed: ${context.resumeAnalyzed ? 'Yes' : 'No'}

Conversation History (last 5 messages):
${chatHistory.messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

User Message: ${message}

Think through this step-by-step:
1. What information do I need to clarify?
2. What's the core problem or question?
3. What practical advice can I give based on my job hunting experience?

Provide a helpful, concise response.`;
    
    try {
      // Call LLM (Ollama or Groq based on provider setting)
      let aiResponse;
      if (llmService.provider === 'groq') {
        aiResponse = await llmService.callGroq(prompt);
      } else {
        aiResponse = await llmService.callOllama(prompt);
      }
      
      // Add AI response to conversation history
      chatHistory.messages.push({
        role: 'assistant',
        content: typeof aiResponse === 'string' ? aiResponse : generateAIResponse(message, context)
      });
      
      // Save conversation to database
      await chatHistory.save();
      
      res.json({ 
        type: 'text', 
        response: typeof aiResponse === 'string' ? aiResponse : generateAIResponse(message, context),
        sessionId: chatHistory.sessionId
      });
    } catch (llmError) {
      // Fallback to rule-based responses if LLM fails
      console.log('LLM failed, using fallback response:', llmError.message);
      const response = generateAIResponse(message, context);
      
      chatHistory.messages.push({
        role: 'assistant',
        content: response
      });
      await chatHistory.save();
      
      res.json({ type: 'text', response, sessionId: chatHistory.sessionId });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Get chat history for a specific session
app.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({ sessionId: req.params.sessionId });
    res.json(chatHistory || { messages: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get all chat sessions (for sidebar/history view)
app.get('/api/chat/sessions', async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ isActive: true })
      .select('sessionId title createdAt messages')
      .sort({ updatedAt: -1 })
      .limit(20);
    
    // Format for frontend display
    const formatted = sessions.map(s => ({
      sessionId: s.sessionId,
      title: s.title,
      lastMessage: s.messages[s.messages.length - 1]?.content.substring(0, 50) + '...',
      createdAt: s.createdAt,
      messageCount: s.messages.length
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create new chat session
app.post('/api/chat/new', async (req, res) => {
  try {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// ============================================
// LLM PROVIDER MANAGEMENT
// ============================================

// Get current LLM provider (Ollama or Groq)
app.get('/api/llm/provider', (req, res) => {
  res.json({ 
    provider: llmService.provider,
    available: {
      ollama: !!process.env.OLLAMA_URL,
      groq: !!process.env.GROQ_API_KEY
    }
  });
});

// Switch between Ollama and Groq
app.post('/api/llm/provider', (req, res) => {
  const { provider } = req.body;
  
  if (!['ollama', 'groq'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider. Use "ollama" or "groq"' });
  }
  
  llmService.provider = provider;
  
  res.json({ 
    success: true, 
    provider: llmService.provider,
    message: `Switched to ${provider}`
  });
});

// ============================================
// HELPER FUNCTIONS (Fallback responses)
// ============================================

// Generate rule-based responses when LLM is unavailable
function generateAIResponse(message, context) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
    return "Before I help with your resume, let me ask: What type of role are you targeting? What's your experience level? This will help me give you specific advice tailored to your situation.";
  }
  
  if (lowerMessage.includes('job') || lowerMessage.includes('position')) {
    return "To help you find the right opportunities, I need to know: What's your target role? What location are you considering? Are you open to remote work? Let me think through the best approach for your job search.";
  }
  
  if (lowerMessage.includes('interview')) {
    return "Let me help you prepare effectively. First, what type of interview is it (technical, behavioral, or both)? What role and company? I'll think through a step-by-step preparation plan based on my experience.";
  }
  
  if (lowerMessage.includes('cover letter')) {
    return "I can help craft a compelling cover letter. To do this well, I need: What's the job title and company? What are your key qualifications? Let me think about how to best position you for this role.";
  }
  
  return "I'm here to help with your job search! As someone who understands the job hunting process, I can assist with resumes, interviews, applications, and career advice. What specific challenge are you facing? The more details you share, the better I can help.";
}

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: MongoDB`);
  console.log(`🤖 LLM Provider: ${llmService.provider}`);
});