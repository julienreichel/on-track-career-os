# Project Status — On Track Career

**Last Updated:** 2026-01-23  
**Version:** v0.11.0 — 98% MVP Complete

---

## 📊 Current State

**Production-Ready MVP** with comprehensive testing, CV customization, matching, and onboarding.

### Key Metrics

- ✅ **12/12 AI operations** implemented
- ✅ **18 GraphQL models** (13 MVP + 5 V1)
- ✅ **11 domain modules** with full layers
- ✅ **1500+ tests** across 55+ suites
- ✅ **35 pages** with full functionality
- ✅ **98% MVP complete**

### Recent Additions (v0.11.0 - EPIC 3C)

- CV template library (3 system templates: Classic, Modern, Competency)
- CV settings page (defaults: template, sections, experiences)
- Template markdown editor with preview
- "Ask each time" modal for generation customization
- Settings navigation zone

---

## 🎯 EPIC Progress Matrix

| EPIC   | Name                        | Status   | AI Ops | Notes                                    |
| ------ | --------------------------- | -------- | ------ | ---------------------------------------- |
| **1A** | User Profile & Identity     | ✅ 98%   | 2/2    | Profile, experiences, CV upload          |
| **1B** | Personal Canvas             | ✅ 100%  | 1/1    | BMC generation, drag-drop editing        |
| **2**  | Experience Builder (STAR)   | ✅ 98%   | 2/2    | Story creation, achievements, KPIs       |
| **3**  | Generic CV Generator        | ✅ 100%  | 1/1    | Markdown generation, editor, print       |
| **3B** | CV Header & Contact         | ✅ 100%  | -      | Profile photo, contact info              |
| **3C** | CV Customization            | ✅ 100%  | -      | Templates, settings, modal workflow      |
| **4**  | Speech Builder              | ✅ 100%  | 1/1    | 3-section speech generation              |
| **4B** | Cover Letter Generator      | ✅ 100%  | 1/1    | Generic + tailored letters               |
| **5A** | Job Description Analysis    | ✅ 100%  | 1/1    | Upload, parse, structured extraction     |
| **5B** | Company Analysis & Canvas   | ✅ 100%  | 2/2    | Company info, BMC generation             |
| **5C** | User-Job-Company Matching   | ✅ 100%  | 1/1    | Fit score, recommendations, tailoring    |
| **6**  | Tailored Materials          | ✅ 100%  | 3/3    | Job-specific CV/letter/speech            |
| **F2** | Onboarding & Guidance       | ✅ 100%  | -      | 5-phase progress, badges, guidance       |
| **F1** | Interview Prep              | ❌ 0%    | 0/3    | Question sets, sessions (V1)             |

**Overall Progress:** 98% MVP | 12 of 13 EPICs complete

---

## 📦 Domain Models (13 MVP + 5 V1)

### Core MVP Models (13)

| Model              | Domain              | Purpose                           | Key Features                          |
| ------------------ | ------------------- | --------------------------------- | ------------------------------------- |
| UserProfile        | Identity            | User identity, goals, contact     | Full identity, photo, social links    |
| PersonalCanvas     | Identity            | Personal BMC                      | 9 canvas blocks                       |
| Experience         | Experience          | Work history                      | Title, company, responsibilities      |
| STARStory          | Experience          | Achievement narratives            | Situation, task, action, result, KPIs |
| JobDescription     | Job                 | Parsed job data                   | 10+ structured fields                 |
| Company            | Company             | Company information               | Industry, size, markets               |
| CompanyCanvas      | Company             | Company BMC                       | 9 canvas blocks                       |
| MatchingSummary    | Matching            | User-job fit analysis             | Score, breakdown, recommendations     |
| CVDocument         | Materials           | Generated CVs                     | Markdown, template, experiences       |
| CoverLetter        | Materials           | Generated letters                 | Markdown, job-targeted                |
| SpeechBlock        | Materials           | Speech blocks                     | 3 sections: pitch, story, why-me      |
| CVTemplate         | Materials (3C)      | CV markdown templates             | System/user, markdown exemplars       |
| CVSettings         | Materials (3C)      | User CV defaults                  | Template, sections, experiences       |

---

## 🎨 Frontend (35 Pages in 4 Zones)

### Auth & Home (3)
`/login`, `/`, `/onboarding`

### Profile Zone (8)
`/profile`, `/profile/canvas`, `/profile/experiences`, `/profile/experiences/new`, `/profile/experiences/:id/edit`, `/profile/experiences/:id/stories`, `/profile/experiences/:id/stories/:storyId`, `/cv-upload`

### Jobs & Companies (8)
`/jobs`, `/jobs/new`, `/jobs/:id`, `/jobs/:id/match`, `/companies`, `/companies/new`, `/companies/:companyId`, `/applications`

### Applications (14)
**CV & Templates (9):** `/applications/cv`, `/applications/cv/new`, `/applications/cv/:id`, `/applications/cv/:id/print`, `/settings/cv`, `/settings/cv/:id`

**Cover Letters (3):** `/applications/cover-letters`, `/applications/cover-letters/new`, `/applications/cover-letters/:id`

**Speech (2):** `/applications/speech`, `/applications/speech/:id`

### Settings (2)
`/settings/cv`, `/settings/cv/:id`

---

## 🤖 AI Operations (12/12)

### Identity & Discovery (4)
`ai.parseCvText`, `ai.extractExperienceBlocks`, `ai.generatePersonalCanvas`, `ai.generateStarStory`

### Job & Company (3)
`ai.parseJobDescription`, `ai.analyzeCompany`, `ai.generateCompanyCanvas`

### Matching (1)
`ai.generateMatchingSummary`

### Materials (4)
`ai.generateCv`, `ai.generateCoverLetter`, `ai.generateSpeech`, `ai.tailorCv` (merged into generateCv)

---

## 🚀 Key Implementations

### EPIC 3C: CV Customization (v0.11.0)
- 3 system templates (Classic, Modern, Competency) as markdown exemplars
- CVTemplate & CVSettings models with full CRUD
- Template library UI with cloning
- Markdown editor with live preview
- Thin generation entry + optional modal
- Experience multi-select, section toggles

### EPIC F2: Onboarding & Guidance
- 5-phase progress system: Complete profile → Create canvas → Document stories → Find opportunities → Apply
- 7 milestone badges
- Contextual guidance by phase
- Dashboard with active jobs cockpit
- 4-step onboarding wizard

### EPIC 6: Tailored Materials
- Entry from `/jobs/:id` and `/jobs/:id/match` pages
- Uses matching summary for context
- Tailored banners with job backlink
- Regenerate action updates materials

### EPIC 5C: Matching
- 0-100 fit score with breakdown
- Structured sections: strengths, gaps, opportunities, tailoring tips
- Persisted to MatchingSummary model
- Live at `/jobs/:jobId/match`

### EPIC 5B: Company Analysis
- Company CRUD with AI analysis from research notes
- Company BMC with 9 canvas blocks
- Company-job linking (1-to-many)
- Search and filtering

### EPIC 5A: Job Description Analysis
- PDF/TXT upload with AI extraction
- 10+ structured fields (title, seniority, responsibilities, skills, etc.)
- Search, status badges, 5-tab detail view
- Reanalyze capability, company linking

---

## 📋 Remaining Work (2%)

### EPIC F1: Interview Prep (V1)
**Models:** InterviewQuestionSet, InterviewSession  
**AI Ops (3):** generateInterviewQuestions, evaluateAnswer, suggestFollowUp  
**Pages:** /interview/questions, /interview/sessions, /interview/sessions/:id

### Enhancements
Advanced search/filtering, bulk operations, analytics dashboard, application tracking, export formats (Word, LaTeX)

---

## 🔧 Technical Debt

**Performance:** Lazy loading for large datasets, virtual scrolling, AI optimization  
**Code Quality:** Extract common patterns, consolidate composables, standardize error handling  
**Testing:** 100% E2E critical path coverage, visual regression tests, AI performance tests  
**Documentation:** API docs for composables, Component Storybook, developer onboarding guide

---

## 🎯 Roadmap

**Current Sprint:** ✅ EPIC 3C documentation, E2E test fixes, v0.11.0 release

**Next 2 Sprints:** User acceptance testing, performance optimization, UI/UX polish

**Next Quarter:** EPIC F1 (Interview Prep), application tracking, analytics dashboard

**6+ Months:** Multi-language support, mobile optimization, social features

---

**Repository:** [On Track Career OS](https://github.com/YOUR_USERNAME/on-track-career-os)  
**Documentation:** See `/docs` folder for detailed specifications  
**Contact:** Julien Reichel
