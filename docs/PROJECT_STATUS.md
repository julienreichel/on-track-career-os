# Project Status — On Track Career

**Last Updated:** 2026-02-06  
**Version:** v0.12.0 (post-0.11.0) — 98% MVP Complete

---

## 📊 Current State

**Production-Ready MVP** with comprehensive testing, CV customization, matching, and onboarding.

### Key Metrics

- ✅ **12/12 AI operations** implemented
- ✅ **18 GraphQL models** (13 MVP + 5 V1)
- ✅ **11 domain modules** with full layers
- ✅ **1526+ tests** across 190+ suites
- ✅ **40+ pages** with full functionality
- ✅ **98% MVP complete**

### Recent Additions (post v0.11.0)

- PostHog analytics integration with onboarding funnel + key event tracking
- Breadcrumb-driven page titles + dynamic navigation structure
- Job description paste flow in addition to file upload
- CV parsing contract v2 (merged social/contact fields + language input)
- CV settings defaults + UX grouping improvements
- Onboarding guidance refinements (phase flow, badges, recommendations)
- Reduced redundant GraphQL calls (progress/badges/loading optimizations)
- i18n consolidation and coverage tests for missing keys
- Layout normalization (UPage as root, consistent margins)

---

## 🎯 EPIC Progress Matrix

| EPIC   | Name                      | Status  | AI Ops | Notes                                 |
| ------ | ------------------------- | ------- | ------ | ------------------------------------- |
| **1A** | User Profile & Identity   | ✅ 98%  | 2/2    | Profile, experiences, CV upload       |
| **1B** | Personal Canvas           | ✅ 100% | 1/1    | BMC generation, drag-drop editing     |
| **2**  | Experience Builder (STAR) | ✅ 98%  | 2/2    | Story creation, achievements, KPIs    |
| **3**  | Generic CV Generator      | ✅ 100% | 1/1    | Markdown generation, editor, print    |
| **3B** | CV Header & Contact       | ✅ 100% | -      | Profile photo, contact info           |
| **3C** | CV Customization          | ✅ 100% | -      | Templates, settings, modal workflow   |
| **4**  | Speech Builder            | ✅ 100% | 1/1    | 3-section speech generation           |
| **4B** | Cover Letter Generator    | ✅ 100% | 1/1    | Generic + tailored letters            |
| **5A** | Job Description Analysis  | ✅ 100% | 1/1    | Upload, parse, structured extraction  |
| **5B** | Company Analysis & Canvas | ✅ 100% | 2/2    | Company info, BMC generation          |
| **5C** | User-Job-Company Matching | ✅ 100% | 1/1    | Fit score, recommendations, tailoring |
| **6**  | Tailored Materials        | ✅ 100% | 3/3    | Job-specific CV/letter/speech         |
| **F2** | Onboarding & Guidance     | ✅ 100% | -      | 5-phase progress, badges, guidance    |
| **F1** | Interview Prep            | ❌ 0%   | 0/3    | Question sets, sessions (V1)          |

**Overall Progress:** 98% MVP | 12 of 13 EPICs complete

---

## 📦 Domain Models (13 MVP + 5 V1)

### Core MVP Models (13)

| Model           | Domain         | Purpose                       | Key Features                          |
| --------------- | -------------- | ----------------------------- | ------------------------------------- |
| UserProfile     | Identity       | User identity, goals, contact | Full identity, photo, social links    |
| PersonalCanvas  | Identity       | Personal BMC                  | 9 canvas blocks                       |
| Experience      | Experience     | Work history                  | Title, company, responsibilities      |
| STARStory       | Experience     | Achievement narratives        | Situation, task, action, result, KPIs |
| JobDescription  | Job            | Parsed job data               | 10+ structured fields                 |
| Company         | Company        | Company information           | Industry, size, markets               |
| CompanyCanvas   | Company        | Company BMC                   | 9 canvas blocks                       |
| MatchingSummary | Matching       | User-job fit analysis         | Score, breakdown, recommendations     |
| CVDocument      | Materials      | Generated CVs                 | Markdown, template, experiences       |
| CoverLetter     | Materials      | Generated letters             | Markdown, job-targeted                |
| SpeechBlock     | Materials      | Speech blocks                 | 3 sections: pitch, story, why-me      |
| CVTemplate      | Materials (3C) | CV markdown templates         | System/user, markdown exemplars       |
| CVSettings      | Materials (3C) | User CV defaults              | Template, sections, experiences       |

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

## 🚀 EPIC Implementation Summary

### ✅ EPIC 1A: User Profile & Identity (98%)

**Core:** UserProfile model with full CRUD, profile photo upload, contact management  
**Features:** Personal info, career goals, social links, language preferences  
**Status:** Complete except optional LinkedIn sync

### ✅ EPIC 1B: Personal Canvas (100%)

**Core:** PersonalCanvas model with 9 BMC blocks  
**Features:** AI generation from profile, drag-drop editing, persistence  
**AI:** `generatePersonalCanvas` with relationship mapping

### ✅ EPIC 2: Experience Builder - STAR Stories (98%)

**Core:** Experience & STARStory models with full CRUD  
**Features:** Timeline view, achievements with KPIs, validation  
**AI:** `generateStarStory` from experience context  
**Status:** Complete except bulk story generation

### ✅ EPIC 3: Generic CV Generator (100%)

**Core:** CVDocument model with markdown storage  
**Features:** AI generation, markdown editor, live preview, print view  
**AI:** `generateCv` from profile + experiences  
**Pages:** `/applications/cv`, `/applications/cv/:id`, `/applications/cv/:id/print`

### ✅ EPIC 3B: CV Header & Contact (100%)

**Core:** Profile photo integration in CV header  
**Features:** Contact info rendering, social links, formatting  
**Integration:** Embedded in generateCv AI operation

### ✅ EPIC 3C: CV Customization (100%) — v0.12.0

**Core:** CVTemplate & CVSettings models with full CRUD  
**Features:** 3 system templates (Classic, Modern, Competency), template library, markdown editor, "ask each time" modal, experience/section selection, default settings workflow refinements  
**Pages:** `/settings/cv`, `/settings/cv/:id`  
**Impact:** Repeatable CV generation with consistent structure

### ✅ EPIC 4: User Speech Builder (100%)

**Core:** SpeechBlock model with 3-section structure (pitch, story, why-me)  
**Features:** AI generation, markdown editing, job context  
**AI:** `generateSpeech` from profile + stories  
**Pages:** `/applications/speech`, `/applications/speech/:id`

### ✅ EPIC 4B: Generic Cover Letter Generator (100%)

**Core:** CoverLetter model with markdown storage  
**Features:** AI generation, markdown editor, generic + job-targeted  
**AI:** `generateCoverLetter` with job context  
**Pages:** `/applications/cover-letters`, `/applications/cover-letters/:id`

### ✅ EPIC 5A: Job Description Analysis (100%)

**Core:** JobDescription model with 10+ structured fields  
**Features:** PDF/TXT upload, AI parsing, 5-tab detail view, status tracking, reanalyze capability  
**AI:** `parseJobDescription` with comprehensive extraction  
**Pages:** `/jobs`, `/jobs/new`, `/jobs/:id`

### ✅ EPIC 5B: Company Analysis & Canvas (100%)

**Core:** Company & CompanyCanvas models with 9 BMC blocks  
**Features:** Company CRUD, AI analysis from research notes, company-job linking (1-to-many)  
**AI:** `analyzeCompany`, `generateCompanyCanvas`  
**Pages:** `/companies`, `/companies/new`, `/companies/:id`

### ✅ EPIC 5C: User-Job-Company Matching (100%)

**Core:** MatchingSummary model with fit analysis  
**Features:** 0-100 score, strengths/gaps/opportunities breakdown, tailoring recommendations  
**AI:** `generateMatchingSummary` with context synthesis  
**Pages:** `/jobs/:id/match` (dedicated tab)

### ✅ EPIC 6: Tailored Application Materials (100%)

**Core:** Job-specific CV/letter/speech generation  
**Features:** Entry from job detail/match pages, matching context injection, tailored banners, regeneration  
**AI:** Reuses `generateCv`, `generateCoverLetter`, `generateSpeech` with job context  
**Integration:** Seamless workflow from job → matching → materials

### ✅ EPIC F2: Onboarding & Guidance (100%)

**Core:** 5-phase progress system with milestone tracking  
**Features:** Phase detection (Complete profile → Create canvas → Document stories → Find opportunities → Apply), 7 badges, contextual guidance, dashboard cockpit  
**Pages:** `/`, `/onboarding` (4-step wizard)  
**Impact:** User flow clarity, reduced abandonment

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

**Documentation:** See `/docs` folder for detailed specifications
