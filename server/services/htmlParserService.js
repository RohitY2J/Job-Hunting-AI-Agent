// ============================================
// HTML PARSER SERVICE
// Processes HTML and saves extracted job data to database
// ============================================

const llmService = require('./llmService');
const Job = require('../models/Job');
const Company = require('../models/Company');

class HTMLParserService {
  
  /**
   * Parse HTML and extract job listings using LLM
   * @param {string} html - Raw HTML from job site
   * @returns {Promise<{jobs: Array, companies: Array}>} Processed job and company data
   */
  async parseAndExtractJobs(html) {
    // Step 1: Use LLM to extract raw data from HTML
    const extracted = await llmService.extractJobsFromHTML(html);
    
    // Step 2: Process and enrich the extracted data
    const processedJobs = extracted.jobs.map(job => ({
      ...job,
      category: llmService.categorizeJob(job.title, job.description), // Auto-categorize
      skills: job.skills?.length > 0 ? job.skills : llmService.extractSkills(`${job.title} ${job.description}`), // Extract skills if missing
      location: this.parseLocation(job.location, job.remote) // Parse location string
    }));

    return {
      jobs: processedJobs,
      companies: extracted.companies || this.extractCompaniesFromJobs(processedJobs)
    };
  }

  /**
   * Parse location string into structured format
   * @param {string} locationStr - Location string (e.g., "Sydney, NSW")
   * @param {boolean} isRemote - Whether job is remote
   * @returns {Object} Structured location object
   */
  parseLocation(locationStr, isRemote) {
    if (!locationStr || isRemote) {
      return { remote: true, city: 'Remote', state: 'Remote', country: 'AU' };
    }

    const parts = locationStr.split(',').map(p => p.trim());
    return {
      city: parts[0] || 'Unknown',
      state: parts[1] || 'Unknown',
      country: parts[2] || 'AU',
      remote: isRemote || false,
      hybrid: locationStr.toLowerCase().includes('hybrid')
    };
  }

  /**
   * Extract unique companies from job listings
   * @param {Array} jobs - List of jobs
   * @returns {Array} List of unique companies
   */
  extractCompaniesFromJobs(jobs) {
    const companies = new Map();
    
    jobs.forEach(job => {
      if (!companies.has(job.company)) {
        companies.set(job.company, {
          name: job.company,
          industry: 'Information Technology',
          location: job.location?.city || 'Unknown'
        });
      }
    });

    return Array.from(companies.values());
  }

  /**
   * Save extracted jobs and companies to MongoDB
   * @param {Object} data - {jobs: Array, companies: Array}
   * @returns {Promise<{jobs: Array, companies: Array}>} Saved documents
   */
  async saveToDatabase(data) {
    const savedJobs = [];
    const savedCompanies = [];

    // Step 1: Save companies first (jobs reference companies)
    for (const companyData of data.companies) {
      let company = await Company.findOne({ name: companyData.name });
      
      if (!company) {
        company = new Company(companyData);
        await company.save();
        savedCompanies.push(company);
      }
    }

    // Step 2: Save jobs with company references
    for (const jobData of data.jobs) {
      const company = await Company.findOne({ name: jobData.company });
      
      if (!company) continue; // Skip if company not found

      // Generate unique source ID
      const sourceId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check for duplicates
      const existingJob = await Job.findOne({ 
        title: jobData.title,
        companyName: jobData.company,
        'location.city': jobData.location.city
      });

      if (existingJob) continue; // Skip duplicates

      // Create and save job
      const job = new Job({
        title: jobData.title,
        company: company._id,
        companyName: jobData.company,
        description: jobData.description,
        skills: jobData.skills,
        category: jobData.category,
        location: jobData.location,
        salary: jobData.salary ? this.parseSalary(jobData.salary) : undefined,
        jobType: jobData.jobType || 'Full-time',
        applicationUrl: jobData.applicationUrl || '#',
        source: 'Manual',
        sourceId,
        datePosted: new Date(),
        isActive: true
      });

      await job.save();
      savedJobs.push(job);
    }

    return { jobs: savedJobs, companies: savedCompanies };
  }

  /**
   * Parse salary string into structured format
   * @param {string} salaryStr - Salary string (e.g., "$80k-$120k per year")
   * @returns {Object|undefined} Structured salary object or undefined
   */
  parseSalary(salaryStr) {
    const numbers = salaryStr.match(/\d+/g);
    if (!numbers || numbers.length === 0) return undefined;

    return {
      min: parseInt(numbers[0]),
      max: numbers[1] ? parseInt(numbers[1]) : parseInt(numbers[0]),
      currency: salaryStr.includes('$') ? 'AUD' : 'USD',
      period: salaryStr.toLowerCase().includes('hour') ? 'hourly' : 'yearly'
    };
  }
}

// Export singleton instance
module.exports = new HTMLParserService();
