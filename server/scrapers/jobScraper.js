require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const connectDB = require('../config/database');
const Job = require('../models/Job');
const Company = require('../models/Company');

class JobScraper {
  constructor() {
    this.jobs = [];
    this.companies = new Map();
    this.init();
  }

  async init() {
    await connectDB();
  }

  // Create or find company
  async findOrCreateCompany(companyData) {
    try {
      let company = await Company.findOne({ name: companyData.name });
      
      if (!company) {
        company = new Company({
          name: companyData.name,
          industry: 'Information Technology',
          location: companyData.location || 'Remote',
          description: companyData.description || 'IT Company'
        });
        await company.save();
        console.log(`Created new company: ${company.name}`);
      }
      
      return company._id;
    } catch (error) {
      console.error('Error creating company:', error);
      return null;
    }
  }

  // Categorize job based on title and description
  categorizeJob(title, description) {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (titleLower.includes('frontend') || titleLower.includes('front-end') || titleLower.includes('react') || titleLower.includes('vue') || titleLower.includes('angular')) {
      return 'Frontend Development';
    }
    if (titleLower.includes('backend') || titleLower.includes('back-end') || titleLower.includes('api') || titleLower.includes('server')) {
      return 'Backend Development';
    }
    if (titleLower.includes('full stack') || titleLower.includes('fullstack')) {
      return 'Full Stack Development';
    }
    if (titleLower.includes('mobile') || titleLower.includes('ios') || titleLower.includes('android') || titleLower.includes('react native')) {
      return 'Mobile Development';
    }
    if (titleLower.includes('devops') || titleLower.includes('sre') || titleLower.includes('infrastructure')) {
      return 'DevOps';
    }
    if (titleLower.includes('data scientist') || titleLower.includes('data analyst')) {
      return 'Data Science';
    }
    if (titleLower.includes('machine learning') || titleLower.includes('ml engineer') || titleLower.includes('ai engineer')) {
      return 'Machine Learning';
    }
    if (titleLower.includes('security') || titleLower.includes('cybersecurity')) {
      return 'Cybersecurity';
    }
    if (titleLower.includes('cloud') || titleLower.includes('aws') || titleLower.includes('azure') || titleLower.includes('gcp')) {
      return 'Cloud Engineering';
    }
    if (titleLower.includes('qa') || titleLower.includes('test') || titleLower.includes('quality assurance')) {
      return 'QA Testing';
    }
    if (titleLower.includes('product manager') || titleLower.includes('pm')) {
      return 'Product Management';
    }
    if (titleLower.includes('ui') || titleLower.includes('ux') || titleLower.includes('design')) {
      return 'UI/UX Design';
    }
    
    return 'Software Development';
  }

  // Extract skills from job description
  extractSkills(text) {
    const itSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
      'Git', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Vue.js',
      'Angular', 'Express', 'Django', 'Flask', 'Spring', 'Kubernetes', 'Redis',
      'GraphQL', 'REST API', 'Microservices', 'DevOps', 'CI/CD', 'Jenkins',
      'Terraform', 'Linux', 'Bash', 'PowerShell', 'Azure', 'GCP', 'Elasticsearch',
      'RabbitMQ', 'Kafka', 'Nginx', 'Apache', 'MySQL', 'Oracle', 'NoSQL',
      'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn',
      'C++', 'C#', '.NET', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin'
    ];
    
    return itSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }

  // Parse location
  parseLocation(locationStr) {
    if (!locationStr) return { remote: true, city: 'Remote', state: 'Remote', country: 'US' };
    
    const isRemote = locationStr.toLowerCase().includes('remote');
    const isHybrid = locationStr.toLowerCase().includes('hybrid');
    
    // Simple parsing - can be enhanced
    const parts = locationStr.split(',').map(p => p.trim());
    const city = parts[0] || 'Unknown';
    const state = parts[1] || 'Unknown';
    
    return {
      city,
      state,
      country: 'US',
      remote: isRemote,
      hybrid: isHybrid
    };
  }

  // Use RSS feeds (legal and safe)
  async scrapeIndeedRSS(query = 'software developer', location = 'remote') {
    try {
      const rssUrl = `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
      
      console.log(`Fetching jobs from Indeed RSS: ${query} in ${location}`);
      
      const response = await axios.get(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const items = $('item');
      
      console.log(`Found ${items.length} jobs from Indeed RSS`);
      
      for (let i = 0; i < items.length; i++) {
        const element = items.eq(i);
        const title = element.find('title').text().trim();
        const link = element.find('link').text();
        const description = element.find('description').text();
        const pubDate = element.find('pubDate').text();
        
        if (!title || !link) continue;
        
        const companyName = this.extractCompany(description);
        const jobLocation = this.extractLocation(description) || location;
        
        const companyId = await this.findOrCreateCompany({
          name: companyName,
          location: jobLocation
        });
        
        if (!companyId) continue;
        
        const sourceId = `indeed_${link.split('jk=')[1] || Date.now() + '_' + i}`;
        
        const existingJob = await Job.findOne({ sourceId });
        if (existingJob) continue;
        
        const jobData = {
          title,
          company: companyId,
          companyName,
          description: this.cleanDescription(description),
          skills: this.extractSkills(title + ' ' + description),
          category: this.categorizeJob(title, description),
          location: this.parseLocation(jobLocation),
          applicationUrl: link,
          source: 'Indeed RSS',
          sourceId,
          datePosted: pubDate ? new Date(pubDate) : new Date(),
          isActive: true
        };
        
        try {
          const job = new Job(jobData);
          await job.save();
          this.jobs.push(job);
        } catch (error) {
          if (error.code !== 11000) {
            console.error('Error saving job:', error.message);
          }
        }
      }

      console.log(`Scraped ${this.jobs.length} new jobs from Indeed RSS`);
    } catch (error) {
      console.error('Error scraping Indeed RSS:', error.response?.status, error.message);
    }
  }

  // Scrape government jobs (always legal)
  async scrapeUSAJobs(query = 'information technology') {
    try {
      const apiKey = process.env.USAJOBS_API_KEY;
      const userEmail = process.env.USAJOBS_EMAIL || 'test@example.com';
      
      if (!apiKey) {
        console.log('USAJobs API key not found. Skipping USAJobs scraping.');
        console.log('Get your free API key at: https://developer.usajobs.gov/APIRequest/Index');
        return;
      }
      
      const apiUrl = 'https://data.usajobs.gov/api/search';
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`Fetching jobs from USAJobs: ${query}`);
      
      const response = await axios.get(apiUrl, {
        params: {
          Keyword: query,
          ResultsPerPage: 100,
          DatePosted: 1 // Jobs posted in last 24 hours
        },
        headers: {
          'Host': 'data.usajobs.gov',
          'User-Agent': userEmail,
          'Authorization-Key': apiKey
        },
        timeout: 15000
      });

      if (response.data.SearchResult && response.data.SearchResult.SearchResultItems) {
        const items = response.data.SearchResult.SearchResultItems;
        console.log(`Found ${items.length} jobs from USAJobs`);
        
        for (const item of items) {
          const job = item.MatchedObjectDescriptor;
          
          const companyId = await this.findOrCreateCompany({
            name: job.OrganizationName,
            location: job.PositionLocationDisplay,
            industry: 'Government'
          });
          
          if (!companyId) continue;
          
          const sourceId = `usajobs_${job.PositionID}`;
          
          const existingJob = await Job.findOne({ sourceId });
          if (existingJob) continue;
          
          const jobData = {
            title: job.PositionTitle,
            company: companyId,
            companyName: job.OrganizationName,
            description: job.QualificationSummary || job.PositionTitle,
            skills: this.extractSkills(job.PositionTitle + ' ' + (job.QualificationSummary || '')),
            category: this.categorizeJob(job.PositionTitle, job.QualificationSummary || ''),
            location: this.parseLocation(job.PositionLocationDisplay),
            salary: job.PositionRemuneration && job.PositionRemuneration[0] ? {
              min: parseInt(job.PositionRemuneration[0].MinimumRange) || null,
              max: parseInt(job.PositionRemuneration[0].MaximumRange) || null,
              currency: 'USD',
              period: 'yearly'
            } : undefined,
            applicationUrl: job.ApplyURI[0],
            source: 'USAJobs.gov',
            sourceId,
            datePosted: new Date(job.PublicationStartDate),
            isActive: true
          };
          
          try {
            const newJob = new Job(jobData);
            await newJob.save();
            this.jobs.push(newJob);
          } catch (error) {
            if (error.code !== 11000) {
              console.error('Error saving USAJobs job:', error.message);
            }
          }
        }

        console.log(`Scraped ${this.jobs.length} new jobs from USAJobs`);
      }
    } catch (error) {
      console.error('Error scraping USAJobs:', error.response?.status, error.message);
      if (error.response?.status === 401) {
        console.log('Authentication failed. Please check your USAJOBS_API_KEY in .env file');
      }
    }
  }

  // Helper methods
  extractCompany(description) {
    const companyMatch = description.match(/<b>([^<]+)<\/b>/);
    return companyMatch ? companyMatch[1].trim() : 'Company not specified';
  }

  extractLocation(description) {
    const locationMatch = description.match(/- ([^-]+)$/);
    return locationMatch ? locationMatch[1].trim() : null;
  }

  cleanDescription(description) {
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  async scrapeAll() {
    console.log('Starting job scraping...');
    this.jobs = [];
    
    // Scrape IT-focused jobs
    await this.scrapeIndeedRSS('software developer', 'remote');
    await this.scrapeIndeedRSS('frontend developer', 'remote');
    await this.scrapeIndeedRSS('backend developer', 'remote');
    await this.scrapeIndeedRSS('full stack developer', 'remote');
    await this.scrapeIndeedRSS('devops engineer', 'remote');
    await this.scrapeIndeedRSS('data scientist', 'remote');
    await this.scrapeUSAJobs('information technology');
    
    console.log(`Job scraping completed! Total new jobs: ${this.jobs.length}`);
  }
}

// Run scraper if called directly
if (require.main === module) {
  const scraper = new JobScraper();
  scraper.scrapeAll().catch(console.error);
}

module.exports = JobScraper;