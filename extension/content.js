// Extract job listings from LinkedIn page
function extractJobs() {
  const jobs = [];
  
  // LinkedIn job card selectors (may need updates as LinkedIn changes)
  const jobCards = document.querySelectorAll('.jobs-search__results-list li, .scaffold-layout__list-item');
  
  jobCards.forEach(card => {
    try {
      const titleEl = card.querySelector('.job-card-list__title, .base-search-card__title');
      const companyEl = card.querySelector('.job-card-container__company-name, .base-search-card__subtitle');
      const locationEl = card.querySelector('.job-card-container__metadata-item, .job-search-card__location');
      const linkEl = card.querySelector('a[href*="/jobs/view/"]');
      
      if (titleEl && companyEl) {
        jobs.push({
          title: titleEl.textContent.trim(),
          company: companyEl.textContent.trim(),
          location: locationEl ? locationEl.textContent.trim() : 'Remote',
          applicationUrl: linkEl ? linkEl.href : window.location.href,
          description: '',
          skills: [],
          remote: locationEl?.textContent.toLowerCase().includes('remote') || false,
          jobType: 'Full-time'
        });
      }
    } catch (error) {
      console.error('Error extracting job:', error);
    }
  });

  // Try to get detailed job info if on job detail page
  const detailTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title, .t-24');
  const detailCompany = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name');
  const detailLocation = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet');
  const detailDescription = document.querySelector('.jobs-description, .jobs-box__html-content');
  
  if (detailTitle && detailCompany && jobs.length === 0) {
    jobs.push({
      title: detailTitle.textContent.trim(),
      company: detailCompany.textContent.trim(),
      location: detailLocation ? detailLocation.textContent.trim() : 'Remote',
      applicationUrl: window.location.href,
      description: detailDescription ? detailDescription.textContent.trim() : '',
      skills: extractSkillsFromText(detailDescription?.textContent || ''),
      remote: detailLocation?.textContent.toLowerCase().includes('remote') || false,
      jobType: 'Full-time'
    });
  }

  return jobs;
}

function extractSkillsFromText(text) {
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobs') {
    const jobs = extractJobs();
    sendResponse({ jobs, count: jobs.length });
  }
  return true;
});
