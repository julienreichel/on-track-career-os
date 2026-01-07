# HIGH-LEVEL NAVIGATION STRUCTURE

**Status:** 60% Implemented (EPICs 1A, 1B, 2, 3, 3B, 5A complete)  
**Last Updated:** 2025-12-30

_(MVP → V1)_

The application is organized around **three main navigation zones**:

1. **My Profile** ✅
   Identity, experiences, stories, personal canvas.

2. **Jobs & Companies** ✅
   Job intake, analysis, company canvas, matching insights.

3. **Applications** ✅
   CV builder, cover letters, speech builder.

This structure forms the **backbone of the product** and ensures users always have a clear next action.

---

# Navigation Principles

## Core Guidelines:

- **No empty pages** — Every route serves a clear purpose with actionable content
- **No dead ends** — Every page suggests a meaningful next action
- **Always suggest progress** — Guide users toward completing their professional narrative
- **Minimal cognitive load** — Clear hierarchy with intuitive navigation patterns
- **Progressive disclosure** — Advanced features appear when users are ready

## Implementation Rules:

- Empty states include clear calls-to-action
- Breadcrumbs show current location and enable quick navigation
- Action buttons are prominent and contextually relevant
- Navigation cards on key pages suggest logical next steps
- Success states guide users to leverage their completed work

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
  - Jobs & Companies
  - Applications (CV, Cover Letters, Speech)

**Nuxt UI:** `<UPage>`, `<UPageHeader>`, `<UPageBody>`, `<UPageGrid>`, `<UPageCard>`

**Next Actions:**

- Profile completion widget showing progress
- Personal canvas status indicator
- Recent activity feed for context

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

**Implemented Enhancements:**

- ✅ Link to company (EPIC 5B)
- ✅ View matching summary (EPIC 5C)

---

## PAGE 2.4 — Company List ✅ IMPLEMENTED

_(EPIC 5B)_

**Status:** Live with list, search, and navigation.

**Actions:**

- Add company
- Open company canvas
- Edit details

---

## PAGE 2.5 — Add Company Information ✅ IMPLEMENTED

_(EPIC 5B)_

**Status:** Live with optional AI analysis.

**Fields:**

- Company name
- Industry
- Size
- Product/services
- Market position
- Optional paste → AI extends information

---

## PAGE 2.6 — Company Business Model Canvas ✅ IMPLEMENTED

_(EPIC 5B)_

**Status:** Live with AI generation and editing.

**Features:**

- Tag-based canvas (mirrors personal canvas layout)
- AI-generated items:
  - Market pains
  - Internal challenges
  - Customer pains
  - Strategic priorities
- Per-block editing + save

---

## PAGE 2.7 — Matching Summary (User ↔ Job ↔ Company) ✅ IMPLEMENTED

_(EPIC 5C — MVP)_

**Status:** Live with AI generation, persistence, and reload.

**Features:**

- Fit score visualization + breakdown
- Strengths, skill match, risks, impact, and tailoring tips
- Persistent summary loaded from `MatchingSummary`

**UI:**
`<UBadge>`, `<UAlert>`, `<UCard>`, `MatchingSummaryCard`

**Actions:**

- Generate / Regenerate

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

## PAGE 3.3 — Speech Builder ✅

_(EPIC 4 — Fully Implemented)_

**Routes:**

- `/applications/speech` - List view with create action
- `/applications/speech/:id` - Editor with three sections

**Features:**

- Create new speech blocks (generic or job-targeted)
- AI generation via `generateSpeech` Lambda
- Three speech sections:
  - Elevator pitch (text + key messages)
  - Career story (text + key messages)
  - "Why me?" statement (text + key messages)
- Tag-based editing for key messages
- Character count display for text sections
- Optional job targeting strategy
- Save and regenerate functionality
- Card-based UI consistent with CV/matching patterns

**Technical Implementation:**

- 3 components: SpeechBlockEditorCard, SpeechSectionEditor, SpeechGenerateButton
- 3 composables: useSpeechBlock, useSpeechBlocks, useSpeechEngine
- E2E test coverage (7 tests)
- Semantic selectors for accessibility

---

## PAGE 3.4 — KPI Generator

_(EPIC 6)_

Displays:

- 2–3 recommended KPIs
- Explanation for each

Actions:

- Add to CV
- Add to speech preparation
- Share with connections

---

# SECTION 4 — USER WORKFLOWS

## Workflow 1: Profile → Job Analysis → Application Materials

1. **Complete Profile** (`/profile`)
   - Add experiences → Generate stories → Build personal canvas
2. **Add Job** (`/jobs/new` or `/jobs`)
   - Upload/paste job description → Get AI analysis → Build company canvas
3. **Generate Materials** (`/applications/cv/new`, `/applications/cover-letters/new`, `/applications/speech`)
   - Create tailored CV → Write cover letter → Prepare speech blocks

## Workflow 2: Continuous Profile Improvement

1. **Add New Experience** (`/profile/experiences/new`)
2. **Generate Related Stories** (AI-powered story building)
3. **Update Personal Canvas** (evolving self-understanding)
4. **Refresh Materials** (regenerate CV/letters with new insights)

## Workflow 3: Job Application Process

1. **Job Intake & Analysis** (`/jobs/new`)
2. **Company Research** (company canvas generation)
3. **Material Creation** (CV, cover letter, speech preparation)
4. **Application Tracking** (status management)

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

Dashboard → Navigate to Profile/Applications/Jobs

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
3. Add Company Info ✅ (EPIC 5B)
4. Company Canvas ✅ (EPIC 5B)

### STEP 4 — Matching ✅ Implemented

- Matching Summary (`/jobs/:jobId/match`) ✅
- Review suggestions

### STEP 5 — Generate Materials ⚠️ Partial

- Generic CV (`/applications/cv/new`, `/applications/cv/:id`) ✅
- Speech Builder (`/applications/speech`, `/applications/speech/:id`) ✅ Implemented (EPIC 4)
- Tailored CV ❌ Not Implemented (EPIC 6)
- Tailored Letter ❌ Not Implemented (EPIC 6)

### STEP 7 — Export & Apply ✅

- Print CV (`/applications/cv/:id/print`) ✅
- Print Cover Letter (`/applications/cover-letters/:id/print`) ✅
- Export Speech Blocks ✅

---

# FULL NAVIGATION TREE (Current Implementation)

```
🏠 Dashboard (/) ✅
├── My Profile Card → /profile
├── Jobs & Companies Card → /jobs
└── Applications Card → /applications/cv (and /applications/cover-letters, /applications/speech)

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
└── Companies ✅
    ├── Company List ✅ (EPIC 5B)
    ├── Add Company ✅ (EPIC 5B)
    └── Company Canvas ✅ (EPIC 5B)

🔗 Matching ✅
└── Matching Summary ✅ (EPIC 5C)

📝 Applications (/applications/cv, /applications/cover-letters, /applications/speech) ✅
├── CV Documents (/applications/cv) ✅
│   ├── CV List (/applications/cv) ✅
│   ├── CV Generator Wizard (/applications/cv/new) ✅
│   ├── CV Editor (/applications/cv/:id) ✅
│   └── CV Print View (/applications/cv/:id/print) ✅
├── Cover Letters (/applications/cover-letters) ✅
│   ├── Cover Letter List (/applications/cover-letters) ✅
│   ├── Create Cover Letter (/applications/cover-letters/new) ✅
│   ├── Cover Letter Editor (/applications/cover-letters/:id) ✅
│   └── Cover Letter Print (/applications/cover-letters/:id/print) ✅
└── Speech Builder (/applications/speech) ✅
    ├── Speech List (/applications/speech) ✅
    └── Speech Editor (/applications/speech/:id) ✅
        ├── Elevator Pitch Section
        ├── Career Story Section
        └── Why Me Section



🧱 System Utilities
├── Template Library ❌ (EPIC 12 - V1)
└── Settings ❌ (Low Priority)

---

## Implementation Summary

**✅ Fully Implemented (80%):**
- Dashboard & Navigation
- My Profile (complete workflow)
- Jobs & Companies (complete workflow)
- Applications:
  - CV generation, editing, and printing
  - Cover letter creation and editing
  - Speech builder for presentations
- Company management and analysis
- Job-user matching insights

**✅ Navigation Principles Applied:**
- No empty pages — all routes have clear purpose
- Clear next actions — every page suggests progress
- Logical flow — users can complete full workflows
- Minimal cognitive load — three main sections only

**🔮 Future Enhancements:**
- Advanced tailoring features
- Analytics and insights
- Template customization
- Integration capabilities
```
