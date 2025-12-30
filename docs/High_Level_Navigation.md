# HIGH-LEVEL NAVIGATION STRUCTURE

**Status:** 60% Implemented (EPICs 1A, 1B, 2, 3, 3B, 5A complete)  
**Last Updated:** 2025-12-30

_(MVP → V1)_

The application is organized around **five main navigation zones**:

1. **My Profile** ✅
   Identity, experiences, stories, personal canvas.

2. **Jobs & Companies** ⚠️ Partial
   Job intake, job role card (implemented), company canvas (not implemented), matching (not implemented).

3. **Applications** ⚠️ Partial
   CV builder (implemented), cover letters (not implemented), speech builder (not implemented), KPI generator (not implemented).

4. **Interview Prep** ❌ Not Implemented
   Interview questions generator, interview simulator.

5. **Dashboard** ✅
   Home entry point linking to all workflows.

This structure forms the **backbone of the product**.

---

# PAGE 0 — AUTH / ENTRY

## 0.1 Login Page ✅ IMPLEMENTED

**Route:** `/login`

- Amplify Authenticator component
- Clean login/signup UI
- Email/password authentication with Cognito

**Implementation:**

- Uses Amplify UI Authenticator
- Automatic redirect to `/` after login

## 0.2 First-Time Onboarding Wizard ❌ NOT IMPLEMENTED

**Status:** Not implemented - users start directly at dashboard

**Planned Features:**

- Upload CV or start manually
- Enter values & goals
- Quick tour of features

**Planned UI:** `<USteps>` and `<UCard>`

---

# PAGE 1 — DASHBOARD (Home) ✅ IMPLEMENTED

**Route:** `/`

_(EPIC: Hub for 1A → 6)_

The central hub of the app. Always accessible.

**Implementation:**

- Navigation hub with `<UPageGrid>` and `<UPageCard>`
- Cards link to main features:
  - Profile Management
  - CV Documents
  - Jobs & Companies
  - Interview Prep (future)

**Nuxt UI:** `<UPage>`, `<UPageHeader>`, `<UPageBody>`, `<UPageGrid>`, `<UPageCard>`

**Future Enhancements:**

- Profile completion widget
- Personal canvas status
- Jobs in progress dashboard
- Recent activity feed

---

# SECTION 1 — MY PROFILE ✅ IMPLEMENTED

## PAGE 1.1 — Profile Summary ✅ IMPLEMENTED

**Route:** `/profile`

_(EPIC 1A)_

**Shows:**

- Profile summary card with basic info
- Navigation cards to:
  - Full Profile Editor
  - CV Upload
  - Experiences
  - Stories
  - Personal Canvas

**Implementation:**

- Components: `ProfileSummaryCard`
- Navigation hub pattern with `<UPageCard>`

**Nuxt UI:** `<UPage>`, `<UPageGrid>`, `<UPageCard>`, `<UCard>`

---

## PAGE 1.1b — Full Profile Editor ✅ IMPLEMENTED

**Route:** `/profile/full`

**Shows:**

- Complete profile form with all fields:
  - Personal info (name, email, phone, location)
  - Professional identity (current role, headline)
  - Values & motivations
  - Career goals
  - Key strengths

**Features:**

- Edit/view mode toggle
- Form validation
- Save/cancel actions
- Dirty state tracking

**Implementation:**

- Components: `ProfileFullForm`
- Composables: `useUserProfile()`, `useProfileMerge()`

**Nuxt UI:** `<UPage>`, `<UForm>`, `<UFormGroup>`, `<UInput>`, `<UTextarea>`, `<UButton>`

---

## PAGE 1.2 — Experience List ✅ IMPLEMENTED

**Route:** `/profile/experiences`

_(EPIC 1A → EPIC 2)_

**Displays:**

- Experience cards (not table) using `ExperienceCard` component
- Empty state when no experiences
- Search/filter functionality

**Actions:**

- Add new experience (navigate to `/profile/experiences/new`)
- Edit experience (navigate to `/profile/experiences/:id`)
- View stories (navigate to `/profile/experiences/:experienceId/stories`)
- Delete experience (confirmation modal)

**Implementation:**

- Components: `ExperienceCard`, `ConfirmModal`
- Composables: `useExperience()`

**Nuxt UI:** `<UPage>`, `<UCard>`, `<UButton>`, `<UModal>`, `<UEmpty>`

---

## PAGE 1.3 — Experience Editor ✅ IMPLEMENTED

**Routes:**

- `/profile/experiences/new` (create)
- `/profile/experiences/:id` (edit)

_(EPIC 1A)_

**Form fields:**

- Job title (required)
- Company name (required)
- Start date, end date, current
- Responsibilities (array of strings)
- Tasks (array of strings)
- Technologies (array of strings)
- Achievements (array of strings)

**Implementation:**

- Components: `ExperienceForm` (single reusable component for create/edit)
- Composables: `useExperience()`
- Form validation with required fields
- Save/cancel actions

**Nuxt UI:** `<UPage>`, `<UForm>`, `<UFormGroup>`, `<UInput>`, `<UTextarea>`, `<UButton>`

**Future Actions:**

- Generate Impact / KPI suggestions
- Link stories (partially implemented via story navigation)

---

## PAGE 1.4 — Global Story Library ✅ IMPLEMENTED

**Route:** `/profile/stories`

_(EPIC 2)_

**Shows:**

- All user stories across all experiences
- Story cards with actions (view, edit, delete)
- Empty state when no stories
- Filter by experience
- Search functionality

**Implementation:**

- Components: `StoryList`, `StoryCard`, `StoryViewModal`
- Composables: `useStoryList()`

**Nuxt UI:** `<UPage>`, `<UCard>`, `<UButton>`, `<UModal>`, `<UEmpty>`

---

## PAGE 1.4b — Per-Experience Story List ✅ IMPLEMENTED

**Route:** `/profile/experiences/:experienceId/stories`

**Shows:**

- Stories for specific experience
- Auto-generate button (creates stories from experience data)
- Add new story button
- Story cards with actions

**Implementation:**

- Components: `StoryList`, `StoryCard`
- Composables: `useStoryEngine()`, `useStoryList()`
- AI Ops: `ai.generateStarStory` (auto-generate mode)

**Nuxt UI:** `<UPage>`, `<UCard>`, `<UButton>`, `<UModal>`

---

## PAGE 1.4c — STAR Story Editor ✅ IMPLEMENTED

**Route:** `/profile/experiences/:experienceId/stories/:storyId`

_(EPIC 2)_

**Three Creation Modes:**

1. **Free Text → AI Mode:**
   - User pastes text (job description, experience description)
   - AI generates STAR stories
   - Preview and save

2. **Auto-Generate Mode:**
   - AI generates stories from experience data
   - Multiple story suggestions
   - Select and save

3. **Manual/Interview Mode:**
   - Guided Q&A through STAR sections
   - Question-by-question progression
   - Manual entry with validation

**Features:**

- Mode selection with `<URadioGroup>`
- STAR form with 4 sections (Situation, Task, Action, Result)
- Achievements & KPIs panel with tag editing
- Save/cancel actions
- AI enhancement for each section

**Implementation:**

- Components: `StoryBuilder` (mode selection + orchestration), `StoryForm` (STAR fields), `AchievementsKpisPanel` (tag-based KPI editing)
- Composables: `useStoryEditor()`, `useStarInterview()`, `useStoryEnhancer()`
- AI Ops: `ai.generateStarStory`, `ai.generateAchievementsAndKpis`

**Nuxt UI:** `<UPage>`, `<UCard>`, `<UForm>`, `<UFormGroup>`, `<UTextarea>`, `<URadioGroup>`, `<UButton>`, `<USkeleton>`

---

## PAGE 1.5 — Personal Business Model Canvas ✅ IMPLEMENTED

**Route:** `/profile/canvas`

_(EPIC 1B)_

**Implementation:**

- Tag-based editing (not drag-and-drop)
- 9 canvas sections displayed as cards
- Each section uses `CanvasSectionCard` with `TagInput`

**Canvas Sections:**

1. Value Proposition
2. Key Activities
3. Key Resources (Strengths)
4. Customer Segments (Target Roles)
5. Channels
6. Customer Relationships
7. Revenue Streams (Career Goals)
8. Cost Structure (Challenges)
9. Key Partners (Support Network)

**Actions:**

- Generate canvas (AI from profile + experiences + stories)
- Regenerate entire canvas
- Regenerate single section
- Edit section tags (add/remove)
- Save changes

**Implementation:**

- Components: `PersonalCanvasComponent`, `CanvasSectionCard`, `TagInput`
- Composables: `useCanvasEngine()`, `usePersonalCanvas()`
- AI Ops: `ai.generatePersonalCanvas`

**Nuxt UI:** `<UPage>`, `<UCard>`, `<UFormGroup>`, `<UButton>`, `<USkeleton>` (tag-based, not `<UDraggable>`)

**Note:** Canvas generation requires profile data, at least one experience, and at least one story.

---

## PAGE 1.6 — Strengths & Communication Profile ❌ NOT IMPLEMENTED

_(EPIC 8 — V1)_

**Status:** Planned for V1, not part of MVP

**Planned Features:**

- Communication style assessment
- Work style preferences
- Blind spots identification
- Narrative adjustment suggestions

---

# SECTION 2 — JOBS & COMPANIES

## PAGE 2.1 — Job List ✅ IMPLEMENTED

**Route:** `/jobs`

_(EPIC 5A)_

**Shows:**

- Job cards with company, title, status badge
- Empty state when no jobs
- Search functionality

**Actions:**

- Add job (navigate to `/jobs/new`)
- View job details (navigate to `/jobs/[jobId]`)
- Delete job (confirmation modal)

**Implementation:**

- Components: `JobCard`, `ConfirmModal`
- Composables: `useJobAnalysis()`

**Nuxt UI:** `<UPage>`, `<UCard>`, `<UInput>` (search), `<UButton>`, `<UModal>`, `<UEmpty>`

---

## PAGE 2.2 — Upload Job Description ✅ IMPLEMENTED

**Route:** `/jobs/new`

_(EPIC 5A)_

**Features:**

- File upload (PDF/TXT)
- AI parsing and analysis (60s timeout)
- Automatic redirect to job detail page

**Implementation:**

- Components: `JobUploadStep`
- Composables: `useJobUpload()`, `useJobAnalysis()`
- AI Ops: `ai.parseJobDescription`

**Nuxt UI:** `<UPage>`, `<UCard>`, file input, `<USkeleton>`

---

## PAGE 2.3 — Job Detail Editor ✅ IMPLEMENTED

**Route:** `/jobs/[jobId]`

_(EPIC 5A)_

**Features:**

- Tabbed editor with 5 sections:
  1. Basic Info (title, company, location, employment type, salary)
  2. Responsibilities (tag-based list)
  3. Required Skills (tag-based list)
  4. Cultural Fit (tag-based list)
  5. Success Metrics (tag-based list)

**Actions:**

- Edit all fields
- Add/remove tags with `TagInput` component
- Save changes (dirty state tracking)
- Reanalyse with AI (re-run `ai.parseJobDescription`)
- Delete job

**Implementation:**

- Components: `TagInput` (reusable tag editor)
- Composables: `useJobAnalysis()`, `useJobDescription()`
- AI Ops: `ai.parseJobDescription`
- Inline form logic (no separate JobForm component yet)

**Nuxt UI:** `<UPage>`, `<UTabs>`, `<UCard>`, `<UFormGroup>`, `<UInput>`, `<UTextarea>`, `<UButton>`, `<UModal>`

**Future Enhancements:**

- Link to company (EPIC 5B)
- View matching summary (EPIC 5C)

---

## PAGE 2.4 — Company List ❌ NOT IMPLEMENTED

_(EPIC 5B)_

**Status:** Blocked by missing AI operations

**Planned Actions:**

- Add company
- Open company canvas
- Edit details

---

## PAGE 2.5 — Add Company Information ❌ NOT IMPLEMENTED

_(EPIC 5B)_

**Status:** Blocked by `ai.analyzeCompanyInfo`

**Planned Fields:**

- Company name
- Industry
- Size
- Product/services
- Market position
- Optional paste → AI extends information

---

## PAGE 2.6 — Company Business Model Canvas ❌ NOT IMPLEMENTED

_(EPIC 5B)_

**Status:** Blocked by `ai.generateCompanyCanvas`

**Planned Features:**

- Tag-based canvas (similar to personal canvas)
- AI-generated items:
  - Market pains
  - Internal challenges
  - Customer pains
  - Strategic priorities

**Note:** `PersonalCanvasComponent` pattern can likely be reused

---

## PAGE 2.7 — Matching Summary (User ↔ Job ↔ Company) ❌ NOT IMPLEMENTED

_(EPIC 5C — MVP)_

**Status:** Blocked by `ai.generateMatchingSummary` and EPIC 5B dependencies

A key synthesis page.

**Planned Features:**

- Fit score visualization
- Strengths ↔ Job pains map
- Achievements relevant to the job
- Potential contributions
- Risks & mitigation strategies
- Summary paragraph

**Planned UI:**
`<UBadge>`, `<UAlert>`, `<UCard>`, potentially chart components

**Planned Actions:**

- Regenerate
- Refine with prompts
- Send to Tailoring Engine

---

# SECTION 3 — APPLICATION MATERIALS

## PAGE 3.1 — CV Builder

_(EPIC 3 & EPIC 6)_

Tabs:

- Generic CV
- Job-tailored CV

Features:

- Template selector (`<USelect>`)
- Block editor (`<UEditor>`)
- Experience/story insertion modal
- Live preview

Actions:

- Export PDF
- Duplicate version _(V2)_

---

## PAGE 3.2 — Cover Letter Builder

_(EPIC 6)_

Workflow:

1. Select tone
2. Auto-generate using:
   - Personal canvas
   - Job role card
   - Company canvas
   - Matching summary

3. Edit letter

---

## PAGE 3.3 — Speech Builder

_(EPIC 4 & EPIC 6)_

Create or refine:

- Elevator pitch
- Career story
- “Why me?” tailored variant

---

## PAGE 3.4 — KPI Generator

_(EPIC 6)_

Displays:

- 2–3 recommended KPIs
- Explanation for each

Actions:

- Add to CV
- Add to letter
- Add to interview prep

---

# SECTION 4 — INTERVIEW PREP

## PAGE 4.1 — Interview Questions Generator ❌ NOT IMPLEMENTED

_(EPIC 7)_

**Status:** Blocked by `ai.generateInterviewQuestions`

**Planned Features:**

- Categories (accordion):
  - Behavioral
  - Technical
  - Cultural
  - Job-pain-based

**Each card:**

- Question
- Suggested answer (based on user stories)
- Related user story link

**Planned Actions:**

- Add to practice set
- Generate more questions
- Export preparation sheet

**Planned UI:** `<UAccordion>`, `<UCard>`

---

## PAGE 4.2 — Interview Simulator (Chat) ❌ NOT IMPLEMENTED

_(EPIC 9 — V1)_

**Status:** Blocked by `ai.simulateInterviewTurn`, `ai.evaluateInterviewAnswer`

**Planned Features:**

- AI asks questions
- User answers (text input)
- AI scores each answer
- Real-time feedback
- Summary page with performance analysis

**Planned UI:** Chat interface, `<UProgress>`, `<UAlert>`, `<UButton>`

---

## PAGE 4.3 — Voice Interview Simulator ❌ NOT IMPLEMENTED

_(EPIC 14 — V2)_

**Status:** Future enhancement (V2)

**Planned Features:**

- Real-time voice interface
- Speech recognition
- Natural pacing analysis
- Filler-word detection
- Realistic live simulation

---

# SECTION 5 — SYSTEM UTILITY PAGES

## PAGE 5.1 — Template Library ❌ NOT IMPLEMENTED

_(EPIC 12 - V1)_

**Status:** Future enhancement

**Planned Features:**

- CV templates
- Letter tone presets
- Story formats

## PAGE 5.2 — Settings ❌ NOT IMPLEMENTED

**Status:** Low priority, planned for V1

**Planned Features:**

- Account settings
- User preferences
- Data export
- Delete account

---

# USER NAVIGATION FLOW (Current MVP Implementation)

### STEP 1 — Start ✅

Dashboard → Navigate to Profile/CV/Jobs

### STEP 2 — Build Identity ✅

1. Profile Overview (`/profile`)
2. Full Profile Editor (`/profile/full`)
3. CV Upload (`/profile/cv-upload`) OR Manual Experience Entry
4. Add/Edit Experiences (`/profile/experiences`, `/profile/experiences/:id`)
5. STAR Stories (`/profile/stories`, `/profile/experiences/:experienceId/stories/:storyId`)
6. Generate Personal Canvas (`/profile/canvas`)

### STEP 3 — Add Job ⚠️ Partial

1. Upload Job Description (`/jobs/new`) ✅
2. Edit Job Details (`/jobs/[jobId]`) ✅
3. Add Company Info ❌ Not Implemented (EPIC 5B)
4. Company Canvas ❌ Not Implemented (EPIC 5B)

### STEP 4 — Matching ❌ Not Implemented

- Matching Summary (EPIC 5C)
- Review suggestions

### STEP 5 — Generate Materials ⚠️ Partial

- Generic CV (`/cv/new`, `/cv/:id`) ✅
- Tailored CV ❌ Not Implemented (EPIC 6)
- Tailored Letter ❌ Not Implemented (EPIC 6)
- Tailored Speech ❌ Not Implemented (EPIC 4 + 6)
- KPI Generator ❌ Not Implemented (EPIC 6)

### STEP 6 — Prepare Interview ❌ Not Implemented

- Interview Questions (EPIC 7)
- Interview Simulator (EPIC 9)

### STEP 7 — Export & Apply ⚠️ Partial

- Print CV (`/cv/:id/print`) ✅
- Export Letter ❌ Not Implemented
- Export Interview Notes ❌ Not Implemented

---

# FULL NAVIGATION TREE (Current Implementation)

```
🏠 Dashboard (/) ✅
├── Profile Management Card → /profile
├── CV Documents Card → /cv
├── Jobs & Companies Card → /jobs
└── Interview Prep Card (future)

👤 My Profile (/profile) ✅
├── Profile Summary (/profile) ✅
│   └── Navigate to: Full Editor, CV Upload, Experiences, Stories, Canvas
├── Full Profile Editor (/profile/full) ✅
│   ├── Personal Info
│   ├── Professional Identity
│   ├── Values & Motivations
│   ├── Career Goals
│   └── Key Strengths
├── CV Upload Workflow (/profile/cv-upload) ✅
│   ├── Upload Step
│   ├── Parsing Step
│   ├── Profile Preview
│   ├── Experiences Preview
│   └── Import Success
├── Experiences ✅
│   ├── Experience List (/profile/experiences)
│   ├── New Experience (/profile/experiences/new)
│   ├── Edit Experience (/profile/experiences/:id)
│   └── Experience Stories (/profile/experiences/:experienceId/stories)
├── Stories ✅
│   ├── Global Story Library (/profile/stories)
│   ├── Per-Experience Stories (/profile/experiences/:experienceId/stories)
│   └── Story Editor (/profile/experiences/:experienceId/stories/:storyId)
│       ├── Mode 1: Free Text → AI
│       ├── Mode 2: Auto-Generate from Experience
│       └── Mode 3: Manual Interview (STAR)
├── Personal Canvas (/profile/canvas) ✅
│   ├── 9 Section Business Model Canvas
│   ├── Tag-Based Editing
│   ├── Generate/Regenerate with AI
│   └── Section-Level Regeneration
└── Communication Profile ❌ (V1)

🏢 Jobs & Companies (/jobs)
├── Jobs ⚠️ Partial
│   ├── Job List (/jobs) ✅
│   ├── Upload Job (/jobs/new) ✅
│   └── Job Detail Editor (/jobs/[jobId]) ✅
│       ├── Tab 1: Basic Info
│       ├── Tab 2: Responsibilities (tags)
│       ├── Tab 3: Required Skills (tags)
│       ├── Tab 4: Cultural Fit (tags)
│       └── Tab 5: Success Metrics (tags)
└── Companies ❌
    ├── Company List ❌ (EPIC 5B)
    ├── Add Company ❌ (EPIC 5B)
    └── Company Canvas ❌ (EPIC 5B)

🔗 Matching ❌
└── Matching Summary ❌ (EPIC 5C)

📝 CV Documents (/cv) ✅
├── CV List (/cv) ✅
├── CV Generator Wizard (/cv/new) ✅
│   ├── Step 1: Experience Selection
│   └── Step 2: Generate CV
├── CV Editor (/cv/:id) ✅
│   ├── Markdown Editor
│   └── Live Preview
└── CV Print View (/cv/:id/print) ✅
    └── A4 Layout

📝 Application Materials (Tailored) ❌
├── Tailored CV ❌ (EPIC 6)
├── Cover Letter Builder ❌ (EPIC 6)
├── Speech Builder ❌ (EPIC 4 + 6)
└── KPI Generator ❌ (EPIC 6)
    └── Note: Story-level KPIs exist ✅

🎤 Interview Prep ❌
├── Interview Questions ❌ (EPIC 7)
├── Interview Simulator (Text) ❌ (EPIC 9)
└── Voice Simulator ❌ (EPIC 14 - V2)

🧱 System Utilities
├── Template Library ❌ (EPIC 12 - V1)
└── Settings ❌ (Low Priority)

---

## Implementation Summary

**✅ Fully Implemented (60%):**
- Dashboard & Navigation
- Profile Management (full CRUD)
- CV Upload & Parsing
- Experience Management (CRUD)
- Story Management (CRUD + 3 creation modes)
- Personal Canvas (generation + editing)
- Job Upload & Analysis
- Job Detail Editing
- CV Generation & Editing
- CV Print Export

**⚠️ Partially Implemented:**
- Jobs & Companies (jobs ✅, companies ❌)
- Application Materials (generic CV ✅, tailored materials ❌)

**❌ Not Implemented (40%):**
- Company Analysis & Canvas (EPIC 5B)
- Matching Engine (EPIC 5C)
- Speech Builder (EPIC 4)
- Tailored Materials (EPIC 6)
- Interview Prep & Simulator (EPIC 7, 9)
- System Utilities (EPIC 12, Settings)
- Voice Simulator (EPIC 14 - V2)
```
