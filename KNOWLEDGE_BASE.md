# KNOWLEDGE_BASE.md

_A high-level summary of the project architecture, domain model, AI operations, and development constraints._

---

## 1. Global Context

This project is **Your AI Career OS** — an AI-powered job-search and career-development platform that guides users through:

- Understanding their professional identity
- Modeling job roles and companies
- Mapping user strengths to company pains
- Generating tailored CVs, cover letters, speeches, KPIs
- Preparing for interviews with questions and simulations

The workflow is:

1. **Know Yourself** → Profile, Experiences, STAR stories, Personal Canvas
2. **Understand the Opportunity** → Job Role Card, Company Canvas
3. **Communicate Your Value** → Tailored CV/Letter/Speech/KPIs
4. **Prepare & Apply** → Interview questions + simulator

(From product description & vision )

---

## 2. High-Level Project Architecture

Architecture is split into **Frontend**, **Backend**, **AI Layer**, **Data Layer**.

**Current Implementation Status (January 2025):**
- ✅ EPIC 1A (User Data Intake) - 95% complete
- ✅ **EPIC 2 (Experience Builder - STAR Stories) - 95% COMPLETE**
- ⚠️ EPIC 1B (Personal Canvas) - 60% complete (backend only)
- Remaining EPICs 3-7 in early stages

### 2.1 Frontend (Nuxt 3)

- Nuxt 3 + TypeScript (strict)
- Nuxt UI components + Tailwind
- State via composables
- Pages structured by domain: Profile / Jobs & Companies / Applications / Interview Prep
- Calls backend through server routes that proxy Lambda functions
  (From Tech Foundations & Navigation Structure )

### 2.2 Backend (Amplify Gen 2 + Lambda)

- Amplify Data (GraphQL)
- Cognito authentication
- Lambda functions for each AI operation
- Owner-based authorization for all user data
  (From Tech Foundations )

### 2.3 AI Layer

- 17 AI operations defined by the AI Interaction Contract
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

- **UserProfile**: identity, goals, values, strengths, skills, languages
- **PersonalCanvas**: value prop, key activities, strengths, target roles, etc.
- **CommunicationProfile** (V1)

### 3.2 Experience & Story Domain

- **Experience**: title, company, responsibilities, tasks, dates
- **STARStory**: situation, task, action, result, achievements, KPI suggestions

### 3.3 Job & Company Domain

- **JobDescription**
- **JobRoleCard**
- **Company**
- **CompanyCanvas**
- **MatchingSummary**

### 3.4 Application Materials

- **CVDocument**
- **CoverLetter**
- **SpeechBlock**
- **KPISet**

### 3.5 Interview Domain

- **InterviewQuestionSet**
- **InterviewSession**

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
- **CV Builder**
- **Cover Letter Generator**
- **Speech Builder**
- **KPI Generator**
- **Interview Question Generator**
- **Interview Simulator (Chat)**
- **Dashboard Widgets**

### 4.2 Composables

- `useUserProfile()`
- `useExperienceStore()`
- `useStoryEngine()`
- `useCanvasEngine()`
- `useJobAnalysis()`
- `useMatchingEngine()`
- `useTailoringEngine()`
- `useInterviewEngine()`
- `useAiClient()`

---

## 5. Pages & Their Interactions

_(Structured per navigation zones)_
(From Navigation Structure & Component Mapping )

### 5.1 My Profile

- **Profile Overview** → edit identity, goals, values
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
- **Cover Letter Builder**
- **Speech Builder**
- **KPI Generator**

### 5.4 Interview Prep

- **Interview Questions Generator**
- **Interview Simulator** (chat-based)

### 5.5 System Pages

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
7. `ai.generateJobRoleCard`
8. `ai.analyzeCompanyInfo`
9. `ai.generateCompanyCanvas`

### Matching

10. `ai.generateMatchingSummary`

### Tailored Application Materials

11. `ai.generateTailoredCvBlocks`
12. `ai.generateCoverLetter`
13. `ai.generateTailoredSpeech`
14. `ai.generateTailoredKpis`

### Interview

15. `ai.generateInterviewQuestions`
16. `ai.simulateInterviewTurn`
17. `ai.evaluateInterviewAnswer`

**Rules:**

- Strict JSON only
- Validate input + output
- Retry with schema-fix prompt
- Return structured error contract

---

## 8. Current Implementation Status

### MVP Progress: ~40% Complete

#### ✅ EPIC 1A: User Data Intake & Identity (95% Complete)

**Fully Implemented:**

- CV upload workflow with PDF/TXT parsing
- AI extraction of experiences and profile data
- Profile page with all fields (goals, aspirations, values, strengths, interests, skills, certifications, languages)
- Experience management (list, create, edit, delete)
- Profile merge from CV upload
- 139 tests (65 component, 62 unit, 12 validator)

#### ✅ EPIC 1B: Personal Canvas Generation (60% Complete)

**Implemented:**

- Backend: GraphQL model + Lambda + repository/service/composable
- 42 tests passing

**Missing:**

- Frontend: Canvas view/edit page, visualization UI

#### ⚠️ Other EPICs: Backend foundations in place, frontend implementation pending

See `docs/PROJECT_STATUS.md` for detailed progress on all 10 MVP EPICs.

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
