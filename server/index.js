const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfParse = require('pdf-parse');
const connectDB = require('./config/database');
const Job = require('./models/Job');
const Company = require('./models/Company');
const htmlParserService = require('./services/htmlParserService');
const llmService = require('./services/llmService');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

// Resume upload and analysis
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    let resumeText = '';

    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      resumeText = data.text;
    } else {
      resumeText = fs.readFileSync(filePath, 'utf8');
    }

    // Basic resume analysis
    const analysis = analyzeResume(resumeText);

    res.json({
      filename: req.file.filename,
      analysis,
      text: resumeText.substring(0, 500) + '...'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

// Get jobs from MongoDB
app.get('/api/jobs', async (req, res) => {
  try {
    const { category, location, remote, skills, page = 1, limit = 20 } = req.query;
    
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

// Job matching
app.post('/api/jobs/match', async (req, res) => {
  try {
    const { skills, experience, location } = req.body;
    
    const filter = { isActive: true };
    
    if (skills && skills.length > 0) {
      filter.skills = { $in: skills.map(skill => new RegExp(skill, 'i')) };
    }
    
    if (location) {
      filter.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') },
        { 'location.remote': true }
      ];
    }

    const matchedJobs = await Job.find(filter)
      .populate('company', 'name industry size')
      .sort({ datePosted: -1 })
      .limit(10)
      .lean();

    res.json(matchedJobs);
  } catch (error) {
    console.error('Error matching jobs:', error);
    res.status(500).json({ error: 'Failed to match jobs' });
  }
});

// Get job categories
app.get('/api/jobs/categories', async (req, res) => {
  try {
    const categories = await Job.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Extract jobs from HTML (for chat interface)
app.post('/api/jobs/extract-html', async (req, res) => {
  try {
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content required' });
    }

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

// AI chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Check if message contains HTML
    if (message.includes('<') && message.includes('>')) {
      const extracted = await htmlParserService.parseAndExtractJobs(message);
      return res.json({
        type: 'job_extraction',
        data: extracted,
        response: `I found ${extracted.jobs.length} jobs and ${extracted.companies.length} companies. Would you like to save them to the database?`
      });
    }
    
    const response = generateAIResponse(message, context);
    res.json({ type: 'text', response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Helper functions
function analyzeResume(text) {
  const skills = extractSkills(text);
  const experience = extractExperience(text);
  const education = extractEducation(text);
  
  return {
    skills,
    experience,
    education,
    score: calculateResumeScore(skills, experience, education)
  };
}

function extractSkills(text) {
  const itSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
    'Git', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Vue.js',
    'Angular', 'Express', 'Django', 'Flask', 'Spring', 'Kubernetes', 'Redis',
    'GraphQL', 'REST API', 'Microservices', 'DevOps', 'CI/CD', 'Jenkins',
    'Terraform', 'Linux', 'Bash', 'PowerShell', 'Azure', 'GCP', 'Elasticsearch',
    'RabbitMQ', 'Kafka', 'Nginx', 'Apache', 'MySQL', 'Oracle', 'NoSQL',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn'
  ];
  
  return itSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractExperience(text) {
  const experienceRegex = /(\d+)\s*(years?|yrs?)\s*(of\s*)?(experience|exp)/gi;
  const matches = text.match(experienceRegex);
  return matches ? matches[0] : 'Not specified';
}

function extractEducation(text) {
  const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'computer science', 'engineering'];
  const foundEducation = educationKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );
  return foundEducation.length > 0 ? 'Higher Education' : 'Not specified';
}

function calculateResumeScore(skills, experience, education) {
  let score = 0;
  score += skills.length * 10;
  score += experience !== 'Not specified' ? 20 : 0;
  score += education !== 'Not specified' ? 15 : 0;
  return Math.min(score, 100);
}

function generateAIResponse(message, context) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
    return "I can help you analyze and improve your resume. Upload your resume file and I'll provide detailed feedback on skills, experience, and suggestions for improvement.";
  }
  
  if (lowerMessage.includes('job') || lowerMessage.includes('position')) {
    return "I can help you find relevant IT job opportunities based on your skills and preferences. What type of role are you looking for?";
  }
  
  if (lowerMessage.includes('interview')) {
    return "I can help you prepare for interviews with common questions, tips, and practice scenarios. What type of interview are you preparing for?";
  }
  
  if (lowerMessage.includes('cover letter')) {
    return "I can help you create a compelling cover letter tailored to specific job applications. Do you have a particular job posting in mind?";
  }
  
  return "I'm your AI job hunting assistant. I can help with resume analysis, job matching, interview preparation, and cover letter writing. What would you like to work on?";
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});