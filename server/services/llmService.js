const axios = require('axios');

class LLMService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.provider = process.env.LLM_PROVIDER || 'ollama'; // 'ollama' or 'groq'
  }

  async extractJobsFromHTML(html) {
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
${html.substring(0, 15000)}`;

    try {
      let result;
      if (this.provider === 'groq') {
        console.log('Using Groq API for extraction');
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
        result = this.parseResponse(response.data.choices[0].message.content);
      } else {
        console.log('Using Ollama for extraction');
        const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
          model: 'deepseek-r1:1.5b',
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9
          }
        }, { timeout: 60000 });
        result = this.parseResponse(response.data.response);
      }
      return result;
    } catch (error) {
      console.log(`${this.provider} failed, trying fallback...`, error.message);
      
      // Try fallback
      if (this.provider === 'groq') {
        const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
          model: 'deepseek-r1:1.5b',
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9
          }
        }, { timeout: 60000 });
        return this.parseResponse(response.data.response);
      } else {
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
    }
  }

  async callOllama(prompt) {
    // Using /api/chat for better conversation handling
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
        temperature: 0.7,
        top_p: 0.9
      }
    }, { timeout: 60000 });

    return response.data.message.content;
  }

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

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'Software Development';
  }

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

module.exports = new LLMService();
