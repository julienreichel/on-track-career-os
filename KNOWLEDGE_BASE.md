# KNOWLEDGE_BASE.md

_A high-level summary of the project architecture, domain model, AI operations, and development constraints._

---

## 1. Global Context

This project is **Your AI Career OS** — an AI-powered job-search and career-development platform that guides users through:

- Understanding their professional identity
- Modeling job roles and companies
- Mapping user strengths to company pains
- Generating tailored CVs, cover letters, speeches

The workflow is:

1. **Know Yourself** → Profile, Experiences, STAR stories, Personal Canvas
2. **Understand the Opportunity** → Job Role Card, Company Canvas
3. **Communicate Your Value** → Tailored CV/Letter/Speech
4. **Prepare & Apply**

(From product description & vision )

---

## 2. High-Level Project Architecture

Architecture is split into **Frontend**, **Backend**, **AI Layer**, **Data Layer**.

**Current Implementation Status (January 2026):**

- ✅ EPIC 1A (User Data Intake) — 100% complete
- ✅ EPIC 1B (Personal Canvas) — 100% complete end-to-end
- ✅ EPIC 2 (Experience Builder - STAR Stories) — 100% complete
- ✅ EPIC 3 (Generic CV Generator) — 100% complete
- ✅ EPIC 3B (CV Header & Contact Information) — 100% complete
- ✅ EPIC 4 (User Speech Builder) — 100% complete
- ✅ EPIC 4B (Generic Cover Letter Generator) — 100% complete
- ✅ EPIC 5A (Job Description Analysis) — 100% complete
- ✅ EPIC 5B (Company Analysis & Canvas) — 100% complete
- ✅ EPIC 5C (User-Job-Company Matching) — 100% complete
- ✅ EPIC 6 (Tailored Application Materials) — 100% complete

### 2.1 Frontend (Nuxt 4)

- Nuxt 4 + TypeScript (strict)
- Nuxt UI components + Tailwind
- State via composables
- Pages structured by domain: Profile / Jobs & Companies / Applications
- Calls backend through server routes that proxy Lambda functions
  (From Tech Foundations & Navigation Structure )

### 2.2 Backend (Amplify Gen 2 + Lambda)

- Amplify Data (GraphQL)
- Cognito authentication
- Lambda functions for each AI operation
- Owner-based authorization for all user data
  (From Tech Foundations )

### 2.3 AI Layer

- 12 core AI operations defined by the AI Interaction Contract
- Strict JSON I/O schemas with validation + fallback
- No free text returned; all results are structured
  (From AIC contract )

### 2.4 Data Layer

- Clean conceptual domain model with ~25 entities
- Strong relationships across identity ↔ job ↔ company ↔ application materials
  (From CDM document )

---

## 3. Data Models (Domain Summary)

_(Condensed from full CDM; only key-developer-relevant models.)_

### 3.1 User Identity Domain

- **UserProfile**: identity, goals, values, strengths, skills, languages, contact data (`primaryEmail`, `primaryPhone`), work authorization, `socialLinks[]`, and `profilePhotoKey` (S3 key used for CV header)
- **PersonalCanvas**: value prop, key activities, strengths, target roles, etc.
- **CommunicationProfile** (V1)

### 3.2 Experience & Story Domain

- **Experience**: title, company, responsibilities, tasks, dates
- **STARStory**: situation, task, action, result, achievements, KPI suggestions

### 3.3 Job & Company Domain

- **JobDescription**: rawText, title, seniorityLevel, roleSummary, responsibilities, requiredSkills, behaviours, successCriteria, explicitPains, status (draft/analyzed/complete), companyId
- **Company**: companyName, industry, sizeRange, website, productsServices, targetMarkets, customerSegments, description, additionalNotes, lastAnalyzedAt
- **CompanyCanvas**: 9 Business Model Canvas blocks (keyPartners, keyActivities, keyResources, valuePropositions, customerRelationships, channels, customerSegments, costStructure, revenueStreams), summary, lastUpdatedAt
- **MatchingSummary**: overallScore, scoreBreakdown, recommendation, reasoningHighlights, strengthsForThisRole, skillMatch, riskyPoints, impactOpportunities, tailoringTips, generatedAt, needsUpdate

### 3.4 Application Materials

- **CVDocument**
- **CoverLetter**: name, content (Markdown), jobId (optional), generatedAt, needsUpdate, status
- **SpeechBlock**: elevatorPitch (text + keyMessages[]), careerStory (text + keyMessages[]), whyMe (text + keyMessages[]), optional jobId for targeting

(From CDM document )

---

## 4. Core Components & Composables

_(From Component Model + Component→Page Mapping) _

### 4.1 Key Frontend Components

- **User Profile Manager**
- **Experience Intake / Experience Editor**
- **STAR Story Builder**
- **Personal Canvas Component**
- **Company Canvas Component**
- **Job Role Card Component**
- **Matching Summary Component**
- **Tailored Materials Card**
- **Tailored Job Banner**
- **CV Builder**
- **Cover Letter Generator**
- **Speech Builder**
- **Dashboard Widgets**

### 4.2 Composables

- `useUserProfile()` - User profile CRUD with photo upload
- `useExperienceStore()` - Experience management
- `useStoryEngine()` - STAR story creation/editing
- `useCanvasEngine()` - Personal Canvas generation/editing
- `useJobAnalysis()` - Job CRUD, list, parse, reanalyse, delete
- `useJobUpload()` - File upload, text extraction, validation
- `useCompany()` - Company CRUD, list, search, AI analysis
- `useCompanyCanvas()` - Company Canvas generation/editing
- `useCompanyUpload()` - Company research notes upload
- `useCompanyJobs()` - Fetch jobs linked to a company
- `useMatchingEngine()` - User-Job-Company matching workflow
- `useMatchingSummary()` - MatchingSummary CRUD + persistence
- `useSpeechBlock()` - SpeechBlock CRUD with AI generation
- `useSpeechBlocks()` - SpeechBlock list management
- `useSpeechEngine()` - Speech workflow orchestration
- `useCoverLetter()` - CoverLetter CRUD with AI generation
- `useCoverLetters()` - CoverLetter list management
- `useCoverLetterEngine()` - Cover letter workflow orchestration
- `useTailoredMaterials()` - Tailored CV/cover letter/speech generation + reuse
- `useAiOperations()` - AI operations orchestration
- `useCvDocuments()` - CV document management
- `useCvGenerator()` - CV generation from user data

---

## 5. Pages & Their Interactions

_(Structured per navigation zones)_

### Profile Zone

- `/profile` - View/edit user profile with all identity fields
- `/profile/canvas` - Personal Canvas with 9-section BMC layout
- `/profile/experiences` - Experience list with create/edit/delete
- `/profile/experiences/:id/edit` - Experience form
- `/profile/experiences/:id/stories` - Per-experience story list
- `/profile/experiences/:id/stories/:storyId` - Story editor (STAR)
- `/profile/stories` - Global story library
- `/cv-upload` - CV upload → AI parsing → import workflow

### Jobs & Companies Zone

- `/jobs` - Job list with search, status badges, delete modal
- `/jobs/new` - Upload job description (PDF/TXT) → AI parsing
- `/jobs/:id` - View/edit job details with 5 tabbed sections, reanalyse, company linking
- `/jobs/:id/match` - Matching summary with fit score + structured sections
- `/jobs/:id` and `/jobs/:id/match` include Application Materials card for tailored CV/letter/speech
- `/companies` - Company list with search, delete modal
- `/companies/new` - Create company with optional AI analysis
- `/companies/:companyId` - View/edit company info, BMC canvas, and linked jobs

### Applications Zone

- `/cv` - CV document list
- `/cv/new` - CV creation wizard (experience picker, options)
- `/cv/:id` - CV Markdown editor with preview
- `/cv/:id/print` - A4 print layout with auto-print
- `/speech` - Speech block list
- `/speech/:id` - Speech block editor
- `/cover-letters` - Cover letter list
- `/cover-letters/new` - Cover letter creation wizard
- `/cover-letters/:id` - Cover letter editor
- `/cover-letters/:id/print` - Cover letter print layout
- `/cv/:id`, `/cover-letters/:id`, `/speech/:id` show job backlink + regenerate tailored action when jobId exists
  (From Navigation Structure & Component Mapping )

### 5.1 My Profile

- **Profile Overview** → edit identity, goals, values, contact fields, work permit, TagInput-powered social links, and upload/manage a profile photo (Amplify Storage pipeline + preview)
- **Experience List** → CRUD experiences
- **Experience Editor** → edit experience fields, trigger achievements/KPIs
- **STAR Story Builder** → chat-guided story creation
- **Personal Business Model Canvas** → drag-drop canvas, regenerate via AI
- **Communication Profile (V1)**

### 5.2 Jobs & Companies

- **Job List & Add Job** → paste JD → AI parsing
- **Job Role Card** → responsibilities, skills, pains
- **Company List & Add Company**
- **Company Canvas**
- **Matching Summary** (User ↔ Job ↔ Company)

### 5.3 Applications

- **CV Builder** (generic + tailored)
  - Generic CV generator live: `/cv`, `/cv/new`, `/cv/:id`, `/cv/:id/print`
  - AI-powered Markdown generation via `useCvGenerator` + `generateCv` Lambda (now strips stray ``` fences)
  - Experience picker + optional profile sections + job description tailoring + toggle to include profile photo
  - Markdown editor with preview + print/export-ready layout, including top-right profile photo badge when enabled
- **Cover Letter Builder**
- **Speech Builder**
- **Tailored Materials**
  - Generate tailored CV/cover letter/speech from `/jobs/:id` or `/jobs/:id/match`
  - Regenerate from document pages via job backlink banner when jobId exists

### 5.4 System Pages

- **Dashboard**
- **Template Library**
- **Settings**

---

## 6. AI Operations (Full List)

_(From AI Interaction Contract) _

### Identity & Experience

1. `ai.parseCvText` - **Enhanced: Extracts both experience sections AND profile information** (fullName, headline, location, seniority, goals, aspirations, values, strengths, interests, languages, skills, certifications)
2. `ai.extractExperienceBlocks`
3. `ai.generateStarStory`
4. `ai.generateAchievementsAndKpis`

### User Model / Canvas

5. `ai.generatePersonalCanvas`

### Jobs & Companies

6. `ai.parseJobDescription`
7. `ai.analyzeCompanyInfo`
8. `ai.generateCompanyCanvas`

### Matching

9. `ai.generateMatchingSummary`

### Tailored Application Materials

10. `ai.generateCv`
11. `ai.generateCoverLetter`
12. `ai.generateSpeech` - **IMPLEMENTED:** Generates elevator pitch, career story, and "why me" sections with optional job targeting

**Rules:**

- Strict JSON only
- Validate input + output
- Retry with schema-fix prompt
- Return structured error contract
- Tailoring inputs: jobDescription + matchingSummary + optional company summary
- Invalid tailoring context falls back to generic output

---

## 8. Current Implementation Status

### MVP Progress: ~90% Complete

#### ✅ EPIC 1A: User Data Intake & Identity (100% Complete)

**Fully Implemented:**

- CV upload workflow with PDF/TXT parsing
- AI extraction of experiences and profile data
- Profile page with all fields (goals, aspirations, values, strengths, interests, skills, certifications, languages)
- Experience management (list, create, edit, delete)
- Profile merge from CV upload
- 139 tests (65 component, 62 unit, 12 validator)

#### ✅ EPIC 1B: Personal Canvas Generation (100% Complete)

**Fully Implemented:**

- Backend: GraphQL model + Lambda + repository/service/composable (40 tests)
- Frontend: `/profile/canvas` page with Business Model Canvas layout
- PersonalCanvasComponent (261 lines) with 9 editable sections
- CanvasSectionCard component with tag-based editing
- Generate and regenerate canvas functionality
- Per-section editing with save/cancel
- 121 tests passing (7 Amplify + 40 unit + 25 composable + 8 page + 21 CanvasSectionCard + 7 PersonalCanvasComponent + 13 usePersonalCanvas)
- E2E canvas flow tests

#### ✅ EPIC 2: Experience Builder - STAR Stories (100% Complete)

**Fully Implemented:**

- Backend: GraphQL model + 2 AI Lambdas + repository/service/composables
- Frontend: Global story library, per-experience stories, 3-mode story creation
- 100+ tests (28 E2E, 70+ unit/component)

#### ✅ EPIC 3: Generic CV Generator (100% Complete)

**Fully Implemented:**

- `generateCv` Lambda with synthesis helpers, markdown-only contract, trailing-note stripping
- Amplify `generateCv` query wired with JSON args + 90s timeout
- Domain stack (`AiOperationsService`, `AiOperationsRepository`, `useCvGenerator`, `useCvDocuments`)
- CV Builder flow: `/cv` list, `/cv/new` wizard, `/cv/:id` Markdown editor with preview/save, `/cv/:id/print` A4 print layout
- Print/export ready typography + Markdown editing guidance

**Validation:**

- Lambda unit tests: `test/amplify/data/ai-operations/generateCv.spec.ts`
- Sandbox E2E hitting deployed Lambda: `test/e2e-sandbox/ai-operations/generate-cv.spec.ts`
- Composable & domain tests: `test/unit/composables/useCvGenerator.spec.ts`, CVDocument service/repo specs
- Utility coverage: `test/unit/ai-operations/generateCv-notes-stripping.spec.ts`
- ⚠️ UI specs under `test/nuxt/pages/cv` and `test/nuxt/components/cv` exist but are `describe.skip` → no automated run yet

#### ✅ EPIC 5A: Job Description Analysis (100% Complete)

**Fully Implemented:**

- Backend: GraphQL model + Lambda + repository/service/composables (25+ tests)
- Frontend: `/jobs`, `/jobs/new`, `/jobs/[jobId]` pages with complete CRUD
- JobCard and JobUploadStep components
- Full i18n support (jobUpload, jobList, jobDetail)
- E2E test coverage (jobs-flow.spec.ts)
- PDF/TXT upload with AI parsing
- Job search and filtering
- Tabbed job detail editing
- Job status tracking (draft/analyzed/complete)
- Company linking via CompanySelector

#### ✅ EPIC 5B: Company Analysis & Company Business Model Canvas (100% Complete)

**Fully Implemented:**

- Backend: Company and CompanyCanvas GraphQL models + 2 AI Lambdas + repository/service/composables (50+ tests)
- Frontend: `/companies`, `/companies/new`, `/companies/[companyId]` pages with complete CRUD
- 7 company components: CompanyCard, CompanyForm, CompanyCanvasEditor, CanvasBlockSection, CompanyNotesInput, CompanySelector, LinkedCompanyBadge
- Full i18n support (company, companyUpload, BMC block labels)
- E2E test coverage (company-workflow.spec.ts)
- AI-powered company analysis from research notes
- Business Model Canvas generation with 9 blocks
- Per-block canvas editing with tag-based input
- Job-company linking (bidirectional)
- Automatic company extraction from job descriptions
- Smart company deduplication with normalization
- Related jobs display on company detail page
- 2 E2E sandbox tests (analyze-company-info, generate-company-canvas)

**Schema Simplification:**

- Removed `signals` structure for cleaner data model
- Focused on core company profile fields
- Business Model Canvas provides structured business understanding

#### ✅ EPIC 4: User Speech Builder (100% Complete)

**Fully Implemented:**

- Backend: SpeechBlock GraphQL model + `generateSpeech` Lambda + repository/service/composables (25+ tests)
- Frontend: `/speech` list and `/speech/:id` editor pages
- 3 speech components: SpeechBlockEditorCard, SpeechSectionEditor, SpeechGenerateButton
- Three speech sections with tag-based editing: elevator pitch, career story, why me
- Optional job targeting strategy
- Card-based UI consistent with CV/matching patterns
- Full i18n support (speech translations)
- E2E test coverage (speech-flow.spec.ts with 7 tests)
- Semantic selectors for accessibility (getByRole, getByText, getByLabel)
- 1 E2E sandbox test (generate-speech)
- Navigation integration with links from default layout and home page

**Technical Implementation:**

- SpeechBlock entity with `elevatorPitch`, `careerStory`, and `whyMe` objects
- Each section contains `text` (string) and `keyMessages` (array)
- Optional `jobId` for job-targeted speech generation
- Complete workflow: create → generate → edit → save → persist
- Character count display for text sections
- Tag input for key messages with add/remove functionality

#### ⚠️ Other EPICs: Backend foundations in place, frontend implementation pending

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed progress on all 10 MVP EPICs.

---

## 9. Development Constraints

_(From Tech Foundations) _

### 7.1 Workflow & Branching

- **Trunk-Based Development**
- Short-lived feature branches
- Merge to main triggers deploy

### 7.2 Code Quality

- TypeScript strict
- ESLint strict + Prettier
- Cyclomatic complexity limits
- Tests required for merge

### 7.3 Testing

- **Vitest** unit & component tests
- **Playwright** E2E smoke suite
- 80% coverage required
- Fake AI provider for testing

### 7.4 Security & Auth

- Cognito owner-based access
- Users only access their own data
- Secrets stored in Amplify env vars

### 7.5 Error Handling

- No silent errors
- Clear user feedback
- Structured AI error contract

### 7.6 UI/UX

- Nuxt UI first
- Tailwind minimal baseline
- Dark mode from day 1
