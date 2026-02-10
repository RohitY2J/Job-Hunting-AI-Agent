# Chrome Extension Guide 🔌

## Installation

### Step 1: Load Extension in Chrome

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Navigate to `ai-job-agent/extension` folder
6. Click **Select Folder**

### Step 2: Verify Installation

- You should see "AI Job Agent - LinkedIn Scraper" in your extensions
- Pin it to toolbar for easy access (click puzzle icon → pin)

## Usage

### On LinkedIn Job Search Page

1. Go to https://www.linkedin.com/jobs/search/
2. Search for jobs (e.g., "software developer australia")
3. Click the extension icon
4. Click **Extract Jobs from Page**
5. Choose action:
   - **Download as JSON**: Save to your computer
   - **Send to Database**: Save to MongoDB (requires server running)

### On LinkedIn Job Detail Page

1. Open any job posting on LinkedIn
2. Click the extension icon
3. Click **Extract Jobs from Page**
4. Extension extracts the single job with full details
5. Save as JSON or send to database

## Configuration

### Set API Endpoint

1. Click extension icon
2. Scroll to "API Endpoint" field
3. Enter your server URL (default: `http://localhost:3001`)
4. Click **Save Settings**

### For Remote Server

If running server on another machine:
```
http://192.168.1.100:3001
```

## Features

### ✅ What It Does
- Extracts job title, company, location
- Captures job description (on detail pages)
- Identifies skills from job text
- Detects remote/hybrid positions
- Groups jobs by company

### ❌ What It Doesn't Do
- No automation (you click manually)
- No login required
- No background scraping
- No data sent to third parties

## Extracted Data Format

```json
{
  "jobs": [
    {
      "title": "Senior Software Engineer",
      "company": "Google",
      "location": "Sydney, NSW, Australia",
      "description": "Full job description...",
      "skills": ["Python", "React", "AWS"],
      "remote": false,
      "jobType": "Full-time",
      "applicationUrl": "https://linkedin.com/jobs/view/..."
    }
  ],
  "companies": [
    {
      "name": "Google",
      "industry": "Information Technology",
      "location": "Sydney, NSW, Australia"
    }
  ]
}
```

## Troubleshooting

### No Jobs Found

**Possible causes:**
- Not on a LinkedIn jobs page
- Page hasn't fully loaded
- LinkedIn changed their HTML structure

**Solutions:**
1. Refresh the page
2. Wait for jobs to load completely
3. Try on a different LinkedIn jobs page
4. Check browser console for errors (F12)

### Connection Error

**Error:** "Connection error. Is the server running?"

**Solutions:**
1. Make sure backend is running: `npm run server`
2. Check API endpoint in settings
3. Verify server is accessible: `curl http://localhost:3001/api/health`

### Extension Not Showing

**Solutions:**
1. Refresh `chrome://extensions/` page
2. Check for errors in extension details
3. Reload extension (click reload icon)
4. Restart Chrome

### Jobs Not Saving to Database

**Check:**
1. MongoDB is running: `mongod`
2. Server is running: `npm run server`
3. API endpoint is correct in extension settings
4. Check server logs for errors

## Updating the Extension

### When LinkedIn Changes

LinkedIn frequently updates their HTML. If extraction stops working:

1. Open `extension/content.js`
2. Update selectors:
   ```javascript
   // Find new selectors using Chrome DevTools
   const titleEl = card.querySelector('.new-title-class');
   ```
3. Save file
4. Go to `chrome://extensions/`
5. Click reload icon on the extension

### Common Selector Updates

```javascript
// Job cards
'.jobs-search__results-list li'
'.scaffold-layout__list-item'

// Title
'.job-card-list__title'
'.base-search-card__title'

// Company
'.job-card-container__company-name'
'.base-search-card__subtitle'

// Location
'.job-card-container__metadata-item'
'.job-search-card__location'
```

## Privacy & Security

### What Data is Collected?
- None. Everything stays local.

### Where is Data Sent?
- Only to YOUR local server (localhost:3001)
- Or saved as JSON on YOUR computer

### Does it Track Me?
- No analytics
- No external API calls
- No data leaves your machine

## Permissions Explained

### `activeTab`
- Needed to read current page content
- Only works when you click the extension

### `storage`
- Saves your API endpoint preference
- Stored locally in Chrome

### `host_permissions: linkedin.com`
- Allows extension to work on LinkedIn
- Required for content script injection

## Advanced Usage

### Batch Extraction

1. Open multiple LinkedIn job tabs
2. Click extension on each tab
3. Download JSON from each
4. Merge JSON files manually or use script

### Custom Filtering

Edit `extension/content.js` to filter jobs:
```javascript
if (titleEl && companyEl) {
  const title = titleEl.textContent.trim();
  
  // Only extract senior roles
  if (title.toLowerCase().includes('senior')) {
    jobs.push({...});
  }
}
```

### Export to CSV

Use online JSON to CSV converter:
1. Download JSON from extension
2. Go to https://www.convertcsv.com/json-to-csv.htm
3. Upload JSON
4. Download CSV

## Uninstall

1. Go to `chrome://extensions/`
2. Find "AI Job Agent - LinkedIn Scraper"
3. Click **Remove**
4. Confirm removal

## Legal Notice

This extension:
- ✅ Requires manual user action
- ✅ Only accesses publicly visible data
- ✅ For personal use only
- ❌ Does not automate browsing
- ❌ Does not bypass login
- ❌ Does not violate LinkedIn ToS (when used manually)

**Use responsibly and at your own risk.**

---

**Questions? Check the main README or open an issue!**
