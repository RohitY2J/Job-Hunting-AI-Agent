// ============================================
// LLM SERVICE
// Handles communication with Ollama (local) and Groq (cloud) LLMs
// ============================================

const axios = require('axios');

class LLMService {
  constructor() {
    // Configuration from environment variables
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.provider = process.env.LLM_PROVIDER || 'ollama'; // Default to Ollama (local)
  }

  // ============================================
  // JOB EXTRACTION FROM HTML
  // ============================================
  
  /**
   * Extract job listings from HTML using LLM
   * @param {string} html - Raw HTML content from LinkedIn or other job sites
   * @returns {Promise<{jobs: Array, companies: Array}>} Extracted job and company data
   */
  async extractJobsFromHTML(html) {
    // Prompt template for job extraction
    const prompt = `Extract job listings from this HTML. Return ONLY valid JSON array with this structure:
{
  "jobs": [
    {
      "title": "job title",
      "company": "company name",
      "location": "city, state/country",
      "description": "job description",
      "skills": ["skill1", "skill2"],
      "salary": "salary range if available",
      "jobType": "Full-time/Part-time/Contract",
      "remote": true/false,
      "applicationUrl": "url if available"
    }
  ],
  "companies": [
    {
      "name": "company name",
      "industry": "industry",
      "location": "location",
      "description": "company description if available"
    }
  ]
}

HTML:
${html.substring(0, 15000)}`; // Limit HTML to 15k chars to avoid token limits

    try {
      // Use primary provider (Ollama or Groq)
      let result;
      if (this.provider === 'groq') {
        console.log('Using Groq API for extraction');
        result = await this.callGroqForExtraction(prompt);
      } else {
        console.log('Using Ollama for extraction');
        result = await this.callOllamaForExtraction(prompt);
      }
      return result;
    } catch (error) {
      // Fallback to alternate provider if primary fails
      console.log(`${this.provider} failed, trying fallback...`, error.message);
      
      if (this.provider === 'groq') {
        return await this.callOllamaForExtraction(prompt);
      } else {
        return await this.callGroqForExtraction(prompt);
      }
    }
  }

  /**
   * Call Ollama for job extraction (uses /api/generate for structured output)
   */
  async callOllamaForExtraction(prompt) {
    const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
      model: 'deepseek-r1:1.5b',
      prompt,
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for consistent JSON output
        top_p: 0.9
      }
    }, { timeout: 60000 });
    
    return this.parseResponse(response.data.response);
  }

  /**
   * Call Groq for job extraction
   */
  async callGroqForExtraction(prompt) {
    const response = await axios.post(this.groqUrl, {
      model: 'deepseek-r1-distill-llama-70b',
      messages: [
        { role: 'system', content: 'You are a job data extraction assistant. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    return this.parseResponse(response.data.choices[0].message.content);
  }

  // ============================================
  // CHAT CONVERSATION
  // ============================================

  /**
   * Call Ollama for chat conversation (uses /api/chat for better context handling)
   * @param {string} prompt - Full conversation prompt with context
   * @returns {Promise<string>} AI response text
   */
  async callOllama(prompt) {
    const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
      model: 'deepseek-r1:1.5b',
      messages: [
        { 
          role: 'system', 
          content: 'You are an experienced job hunter and career advisor. Ask clarifying questions when needed, think step-by-step, and provide practical advice from a job seeker\'s perspective. Be conversational and empathetic.' 
        },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: {
        temperature: 0.7, // Higher temperature for more creative responses
        top_p: 0.9
      }
    }, { timeout: 60000 });

    return response.data.message.content;
  }

  /**
   * Call Groq for chat conversation
   * @param {string} prompt - Full conversation prompt with context
   * @returns {Promise<string>} AI response text
   */
  async callGroq(prompt) {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const response = await axios.post(this.groqUrl, {
      model: 'deepseek-r1-distill-llama-70b',
      messages: [
        { 
          role: 'system', 
          content: 'You are an experienced job hunter and career advisor. Ask clarifying questions when needed, think step-by-step, and provide practical advice from a job seeker\'s perspective. Be conversational and empathetic.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Parse JSON from LLM response (handles markdown code blocks)
   * @param {string} text - Raw LLM response
   * @returns {Object} Parsed JSON object
   */
  parseResponse(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.jobs || !Array.isArray(parsed.jobs)) {
      throw new Error('Invalid response structure');
    }

    return parsed;
  }

  /**
   * Categorize job based on title and description keywords
   * @param {string} title - Job title
   * @param {string} description - Job description
   * @returns {string} Job category
   */
  categorizeJob(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    const categories = {
      'Frontend Development': ['frontend', 'front-end', 'react', 'vue', 'angular', 'ui'],
      'Backend Development': ['backend', 'back-end', 'api', 'server', 'node.js'],
      'Full Stack Development': ['full stack', 'fullstack', 'full-stack'],
      'Mobile Development': ['mobile', 'ios', 'android', 'react native', 'flutter'],
      'DevOps': ['devops', 'sre', 'infrastructure', 'kubernetes', 'docker'],
      'Data Science': ['data scientist', 'data analyst', 'analytics'],
      'Machine Learning': ['machine learning', 'ml engineer', 'ai engineer', 'deep learning'],
      'Cybersecurity': ['security', 'cybersecurity', 'infosec'],
      'Cloud Engineering': ['cloud', 'aws', 'azure', 'gcp'],
      'QA Testing': ['qa', 'test', 'quality assurance'],
      'Product Management': ['product manager', 'pm', 'product owner'],
      'UI/UX Design': ['ui', 'ux', 'design', 'designer']
    };

    // Find matching category
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'Software Development'; // Default category
  }

  /**
   * Extract technical skills from text
   * @param {string} text - Job description or resume text
   * @returns {Array<string>} List of found skills
   */
  extractSkills(text) {
    const skills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
      'Git', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Vue.js',
      'Angular', 'Express', 'Django', 'Flask', 'Spring', 'Kubernetes', 'Redis',
      'GraphQL', 'REST API', 'Microservices', 'DevOps', 'CI/CD', 'Jenkins',
      'Terraform', 'Linux', 'Bash', 'Azure', 'GCP', 'C++', 'C#', '.NET', 'Go', 'Rust'
    ];
    
    return skills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }
}

// Export singleton instance
module.exports = new LLMService();
