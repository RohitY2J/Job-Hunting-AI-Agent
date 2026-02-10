let extractedData = null;

// Load saved settings
chrome.storage.sync.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    document.getElementById('apiUrl').value = result.apiUrl;
  }
});

// Extract jobs button
document.getElementById('extractBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  statusEl.className = 'status info';
  statusEl.textContent = 'Extracting jobs...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'extractJobs' }, (response) => {
      if (chrome.runtime.lastError) {
        statusEl.className = 'status error';
        statusEl.textContent = 'Error: Make sure you are on a LinkedIn jobs page';
        return;
      }

      if (response && response.jobs && response.jobs.length > 0) {
        extractedData = {
          jobs: response.jobs,
          companies: extractCompanies(response.jobs)
        };

        statusEl.className = 'status success';
        statusEl.innerHTML = `Found <span class="job-count">${response.count}</span> jobs!`;
        
        document.getElementById('downloadBtn').style.display = 'block';
        document.getElementById('sendBtn').style.display = 'block';
      } else {
        statusEl.className = 'status error';
        statusEl.textContent = 'No jobs found on this page';
      }
    });
  } catch (error) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Error: ' + error.message;
  }
});

// Download JSON button
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!extractedData) return;

  const blob = new Blob([JSON.stringify(extractedData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linkedin-jobs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  const statusEl = document.getElementById('status');
  statusEl.className = 'status success';
  statusEl.textContent = 'Downloaded successfully!';
});

// Send to database button
document.getElementById('sendBtn').addEventListener('click', async () => {
  if (!extractedData) return;

  const statusEl = document.getElementById('status');
  const apiUrl = document.getElementById('apiUrl').value;

  statusEl.className = 'status info';
  statusEl.textContent = 'Sending to database...';

  try {
    const response = await fetch(`${apiUrl}/api/jobs/save-extracted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(extractedData)
    });

    const result = await response.json();

    if (response.ok) {
      statusEl.className = 'status success';
      statusEl.textContent = `Saved ${result.saved.jobs} jobs and ${result.saved.companies} companies!`;
    } else {
      statusEl.className = 'status error';
      statusEl.textContent = 'Error: ' + result.error;
    }
  } catch (error) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Connection error. Is the server running?';
  }
});

// Save settings button
document.getElementById('saveSettings').addEventListener('click', () => {
  const apiUrl = document.getElementById('apiUrl').value;
  
  chrome.storage.sync.set({ apiUrl }, () => {
    const statusEl = document.getElementById('status');
    statusEl.className = 'status success';
    statusEl.textContent = 'Settings saved!';
    
    setTimeout(() => {
      statusEl.className = 'status info';
      statusEl.textContent = 'Ready to extract jobs from this page';
    }, 2000);
  });
});

// Extract unique companies from jobs
function extractCompanies(jobs) {
  const companies = new Map();
  
  jobs.forEach(job => {
    if (!companies.has(job.company)) {
      companies.set(job.company, {
        name: job.company,
        industry: 'Information Technology',
        location: job.location
      });
    }
  });

  return Array.from(companies.values());
}
