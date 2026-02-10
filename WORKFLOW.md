# System Workflow 🔄

## Method 1: Chat Interface (HTML Paste)

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│  1. Copy HTML from LinkedIn (Ctrl+U → Copy)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    CHAT INTERFACE                            │
│  2. Paste HTML in chat textarea                             │
│  3. Click Send or press Enter                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API                                │
│  POST /api/chat                                              │
│  4. Detects HTML in message                                 │
│  5. Calls htmlParserService.parseAndExtractJobs()           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   LLM SERVICE                                │
│  6. Try Ollama (http://localhost:11434)                     │
│     ├─ Success → Parse response                             │
│     └─ Fail → Try Groq API                                  │
│  7. Extract structured data:                                │
│     { jobs: [...], companies: [...] }                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 HTML PARSER SERVICE                          │
│  8. Categorize jobs (Frontend, Backend, etc.)               │
│  9. Extract skills from descriptions                        │
│  10. Parse locations and salaries                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   CHAT INTERFACE                             │
│  11. Display extracted jobs in preview box                  │
│  12. Show "Save to Database" button                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ (User clicks Save)
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API                                │
│  POST /api/jobs/save-extracted                              │
│  13. Create/find companies in MongoDB                       │
│  14. Create job documents with company references           │
│  15. Save to database                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      MONGODB                                 │
│  16. Jobs collection: { title, company, skills, ... }       │
│  17. Companies collection: { name, industry, ... }          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   CHAT INTERFACE                             │
│  18. Show success message: "Saved 5 jobs, 3 companies"      │
└─────────────────────────────────────────────────────────────┘
```

## Method 2: Chrome Extension

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│  1. Browse to LinkedIn jobs page                            │
│  2. Click extension icon in toolbar                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTENSION POPUP                             │
│  3. Shows "Extract Jobs from Page" button                   │
│  4. User clicks button                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTENT SCRIPT                              │
│  5. Runs on LinkedIn page                                   │
│  6. Queries DOM for job elements:                           │
│     - .job-card-list__title                                 │
│     - .job-card-container__company-name                     │
│     - .job-card-container__metadata-item                    │
│  7. Extracts text content                                   │
│  8. Builds job objects array                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTENSION POPUP                             │
│  9. Receives extracted jobs                                 │
│  10. Shows count: "Found 15 jobs!"                          │
│  11. Displays two buttons:                                  │
│      - Download as JSON                                     │
│      - Send to Database                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─────────────────┬──────────────────────┐
                     │                 │                      │
                     ▼                 ▼                      ▼
        ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐
        │ Download JSON  │  │  Send to API     │  │   Do Nothing    │
        │                │  │                  │  │                 │
        │ 12. Create     │  │ 13. POST to      │  │ 14. Close popup │
        │     Blob       │  │     /api/jobs/   │  │                 │
        │ 13. Trigger    │  │     save-        │  └─────────────────┘
        │     download   │  │     extracted    │
        └────────────────┘  └────────┬─────────┘
                                     │
                                     ▼
                        ┌────────────────────────────┐
                        │      BACKEND API           │
                        │  14. Validate data         │
                        │  15. Save to MongoDB       │
                        │  16. Return success        │
                        └────────────┬───────────────┘
                                     │
                                     ▼
                        ┌────────────────────────────┐
                        │   EXTENSION POPUP          │
                        │  17. Show success message  │
                        │  "Saved 15 jobs!"          │
                        └────────────────────────────┘
```

## LLM Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    HTML INPUT                                │
│  <div class="job">...</div>                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  LLM SERVICE                                 │
│  extractJobsFromHTML(html)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              TRY OLLAMA (Primary)                            │
│  POST http://localhost:11434/api/generate                   │
│  {                                                           │
│    model: "deepseek-r1:1.5b",                               │
│    prompt: "Extract jobs from HTML...",                     │
│    stream: false                                            │
│  }                                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─────────────────┬──────────────────────┐
                     │                 │                      │
                     ▼                 ▼                      ▼
        ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐
        │   SUCCESS      │  │   TIMEOUT        │  │   ERROR         │
        │                │  │                  │  │                 │
        │ Parse JSON     │  │ Wait 60s         │  │ Connection      │
        │ Return data    │  │ Then fail        │  │ refused         │
        └────────┬───────┘  └────────┬─────────┘  └────────┬────────┘
                 │                   │                      │
                 │                   └──────────┬───────────┘
                 │                              │
                 │                              ▼
                 │                 ┌────────────────────────┐
                 │                 │  TRY GROQ (Fallback)   │
                 │                 │  POST api.groq.com     │
                 │                 │  {                     │
                 │                 │    model: "deepseek-   │
                 │                 │           r1-distill"  │
                 │                 │  }                     │
                 │                 └────────┬───────────────┘
                 │                          │
                 │                          ├────────┬──────┐
                 │                          ▼        ▼      ▼
                 │                      SUCCESS   ERROR  NO KEY
                 │                          │        │      │
                 └──────────────────────────┴────────┴──────┘
                                            │
                                            ▼
                               ┌────────────────────────┐
                               │   PARSE RESPONSE       │
                               │  1. Extract JSON       │
                               │  2. Validate structure │
                               │  3. Return data        │
                               └────────┬───────────────┘
                                        │
                                        ▼
                               ┌────────────────────────┐
                               │   STRUCTURED DATA      │
                               │  {                     │
                               │    jobs: [...],        │
                               │    companies: [...]    │
                               │  }                     │
                               └────────────────────────┘
```

## Data Flow

```
LinkedIn HTML
     │
     ▼
┌─────────────────┐
│  Raw HTML Text  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│   LLM Service   │─────▶│ Ollama/Groq  │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  Extracted JSON │
│  {              │
│    jobs: [      │
│      {          │
│        title,   │
│        company, │
│        ...      │
│      }          │
│    ]            │
│  }              │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ HTML Parser     │
│ - Categorize    │
│ - Extract skills│
│ - Parse location│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Enhanced Data  │
│  {              │
│    category,    │
│    skills: [],  │
│    location: {} │
│  }              │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
│  ┌───────────┐  │
│  │   Jobs    │  │
│  ├───────────┤  │
│  │ Companies │  │
│  └───────────┘  │
└─────────────────┘
```

## Error Handling Flow

```
User Action
    │
    ▼
Try Operation
    │
    ├─────────────────┬──────────────────┐
    │                 │                  │
    ▼                 ▼                  ▼
SUCCESS          NETWORK ERROR      VALIDATION ERROR
    │                 │                  │
    │                 ▼                  ▼
    │         Retry with Groq    Show error message
    │                 │                  │
    │                 ├────────┬─────────┘
    │                 ▼        ▼
    │             SUCCESS   FAIL
    │                 │        │
    └─────────────────┴────────┘
                      │
                      ▼
              Show result to user
```

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  Job Matcher │  │   AI Chat    │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
│                                              │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
┌──────────────────────────────────────────────┼──────────────┐
│                      BACKEND                 │              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────▼───────┐      │
│  │  Job Routes  │  │ Chat Routes  │  │ LLM Service  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                  ┌────────▼────────┐                       │
│                  │ HTML Parser     │                       │
│                  └────────┬────────┘                       │
└───────────────────────────┼────────────────────────────────┘
                            │
┌───────────────────────────┼────────────────────────────────┐
│                      DATABASE                              │
│  ┌──────────────┐  ┌──────▼───────┐  ┌──────────────┐     │
│  │   Jobs       │  │  Companies   │  │    Users     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Ollama     │  │   Groq API   │                        │
│  │  (Local LLM) │  │  (Cloud LLM) │                        │
│  └──────────────┘  └──────────────┘                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  CHROME EXTENSION                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Popup UI   │  │Content Script│  │  Background  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

---

**This visual guide shows how all components work together!**
