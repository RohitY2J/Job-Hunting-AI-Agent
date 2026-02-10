const llmService = require('./llmService');
const Job = require('../models/Job');
const Company = require('../models/Company');

class HTMLParserService {
  async parseAndExtractJobs(html) {
    const extracted = await llmService.extractJobsFromHTML(html);
    
    const processedJobs = extracted.jobs.map(job => ({
      ...job,
      category: llmService.categorizeJob(job.title, job.description),
      skills: job.skills?.length > 0 ? job.skills : llmService.extractSkills(`${job.title} ${job.description}`),
      location: this.parseLocation(job.location, job.remote)
    }));

    return {
      jobs: processedJobs,
      companies: extracted.companies || this.extractCompaniesFromJobs(processedJobs)
    };
  }

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

  async saveToDatabase(data) {
    const savedJobs = [];
    const savedCompanies = [];

    for (const companyData of data.companies) {
      let company = await Company.findOne({ name: companyData.name });
      
      if (!company) {
        company = new Company(companyData);
        await company.save();
        savedCompanies.push(company);
      }
    }

    for (const jobData of data.jobs) {
      const company = await Company.findOne({ name: jobData.company });
      
      if (!company) continue;

      const sourceId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const existingJob = await Job.findOne({ 
        title: jobData.title,
        companyName: jobData.company,
        'location.city': jobData.location.city
      });

      if (existingJob) continue;

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

module.exports = new HTMLParserService();
