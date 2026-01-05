# High-Level Architecture Overview

**Status:** 60% Implemented (EPICs 1A, 1B, 2, 3, 3B, 5A complete)  
**Last Updated:** 2025-12-30

Your system is composed of **four major layers**, each offering functional modules:

---

## 1. User Experience Layer (Frontend)

Nuxt UI components defining how the user interacts with the system.

---

## 2. Core Application Layer (Business Logic)

Internal services that transform, interpret, and manage data.
(Non-technical, conceptual layer.)

---

## 3. AI Interpretation & Generation Layer

Orchestrated LLM logic used for extraction, modeling, generation, and synthesis.

---

## 4. Data Layer

Stores all structured information:
User profile, experiences, canvases, jobs, companies, documents, interview sessions.

---

# Component Model (Design Phase)

Below is the list of core components, mapped to EPICs, with their purpose and interactions.

---

# 1. User Identity Components

_(Support EPIC 1A and EPIC 8)_

## 1.1 User Profile Manager ✅ IMPLEMENTED

- Stores raw personal data: identity, values, goals, aspirations
- Manages updates from every other component
- Acts as the **source of truth** for all personalization

**Implementation:**

- Pages: `/profile`, `/profile/full`
- Components: `ProfileSummaryCard`, `ProfileFullForm`
- Composables: `useUserProfile()`, `useProfileMerge()`

**Nuxt UI:**
`<UPage>`, `<UPageHeader>`, `<UPageBody>`, `<UCard>`, `<UForm>`, `<UFormGroup>`, `<UInput>`, `<UTextarea>`

---

## 1.2 Experience Intake Component ✅ IMPLEMENTED

- Handles CV upload → text extraction → segmentation
- Allows manual entry of experiences
- Manages structured fields (role, years, tasks, responsibilities)

**Implementation:**

- Pages: `/profile/cv-upload`, `/profile/experiences`, `/profile/experiences/:id`
- Components: `ExperienceForm`, `ExperienceCard`, `CvUploadStep`, `CvParsingStep`, `ProfilePreview`, `ExperiencesPreview`, `CvImportSuccess`
- Composables: `useCvUploadWorkflow()`, `useCvParsing()`, `useExperienceImport()`, `useExperience()`
- AI Ops: `ai.parseCvText`, `ai.extractExperienceBlocks`

**Nuxt UI:**
`<UPage>`, `<UCard>`, `<UForm>`, `<UFormGroup>`, `<UInput>`, `<UTextarea>`, file upload input

---

## 1.3 Story Builder (STAR Model) ✅ IMPLEMENTED

_(Supports EPIC 2)_

- Collects STAR stories through guided Q&A
- Allows editing & polishing with AI
- Links stories to experiences
- Generates reusable "story blocks" for CVs, letters, interviews

**Implementation:**

- Pages: `/profile/stories`, `/profile/experiences/:experienceId/stories`, `/profile/experiences/:experienceId/stories/:storyId`
- Components: `StoryBuilder` (3 modes: free text→AI, auto-generate, manual interview), `StoryForm`, `StoryList`, `StoryCard`, `StoryViewModal`, `AchievementsKpisPanel`
- Composables: `useStoryEngine()`, `useSTARStory()`, `useStoryEditor()`, `useStoryList()`, `useStarInterview()`, `useStoryEnhancer()`
- AI Ops: `ai.generateStarStory`, `ai.generateAchievementsAndKpis`

**Nuxt UI:**
`<UPage>`, `<UCard>`, `<UForm>`, `<UTextarea>`, `<UButton>`, `<UModal>`, `<URadioGroup>` (mode selection)

---

## 1.4 Personal Strengths & Psychology Module ❌ NOT IMPLEMENTED

_(Supports EPIC 8 - V1/V2)_

- Captures communication style & work style
- Stores long-term behavioural insights
- Influences story writing & letter tone

**Status:** Planned for V1/V2, not part of MVP

---

# 2. Canvas Components

_(Support EPIC 1B, EPIC 5B, EPIC 5C)_

## 2.1 Personal Business Model Canvas Component ✅ IMPLEMENTED

- Auto-generated from user data
- Editable, structured by tag-based zones (not draggable)
- Core element of the user's professional identity

**Implementation:**

- Pages: `/profile/canvas`
- Components: `PersonalCanvasComponent`, `CanvasSectionCard`, `TagInput`
- Composables: `useCanvasEngine()`, `usePersonalCanvas()`
- AI Ops: `ai.generatePersonalCanvas`

**Nuxt UI:**
`<UPage>`, `<UCard>`, `<UFormGroup>`, `<UButton>`, `<USkeleton>` (tag-based editing, not drag-and-drop)

---

## 2.2 Company Business Model Canvas Component ❌ NOT IMPLEMENTED

- Editable canvas for company modeling
- Can be AI-pre-filled from user inputs
- Forms the basis for strategic matching and tailoring

**Status:** EPIC 5B - Blocked by missing AI operations (`ai.analyzeCompanyInfo`, `ai.generateCompanyCanvas`)

**Planned Flow:**
_Job → Company Context → Company Canvas → Tailoring Engine_

---

## 2.3 Job Role Card Component ✅ IMPLEMENTED

_(Supports EPIC 5A)_

- Summarizes extracted job role details
- Includes responsibilities, skills, behaviours, success criteria, pains

**Implementation:**

- Pages: `/jobs`, `/jobs/new`, `/jobs/[jobId]`
- Components: `JobCard`, `JobUploadStep`, `TagInput`
- Composables: `useJobAnalysis()`, `useJobDescription()`, `useJobUpload()`
- AI Ops: `ai.parseJobDescription`

**Nuxt UI:**
`<UPage>`, `<UCard>`, `<UTabs>` (5 sections: Basic Info, Responsibilities, Skills, Cultural Fit, Success Metrics), `<UFormGroup>`, `<UInput>`, `<UTextarea>`

---

## 2.4 Matching Engine Component ✅ IMPLEMENTED

_(Supports EPIC 5C)_

- Compares user data, job card, and company context
- Produces:
  - Fit score + breakdown
  - Strengths and skill matches
  - Risk + mitigation list
  - Impact opportunities and tailoring tips

**Status:** EPIC 5C complete (AI op, domain layer, and UI delivered)

**Nuxt UI:**
Match Summary page with `<UPage>`, `<UCard>`, `<UAlert>`, `<UBadge>`, and `MatchingSummaryCard`

---

# 3. Content Generation Components

_(Support EPIC 3, EPIC 4, EPIC 6, EPIC 7)_

## 3.1 CV Builder Component ✅ IMPLEMENTED (Generic CV)

- Markdown editor (not block-based)
- Experience and story selection
- Generic CV generation
- A4 print layout

**Implementation:**

- Pages: `/cv`, `/cv/new`, `/cv/:id`, `/cv/:id/print`
- Components: `CvExperiencePicker`, `CvGeneratingStep`, split-view markdown editor
- Composables: `useCvGenerator()`, `useCVDocument()`, `useCvDocuments()`
- AI Ops: `ai.generateCv`

**Nuxt UI:**
`<UPage>`, `<UCard>`, `<UTextarea>` (markdown), live preview, `<UButton>`

**Not Implemented:**
❌ Job-specific tailoring mode (EPIC 6)
❌ Block editor (using markdown instead)
❌ PDF export (using print layout)

---

## 3.2 Cover Letter Generator Component ❌ NOT IMPLEMENTED

- Choose tone (corporate, bold, storytelling, etc.)
- Generate from user + job + company + matching
- Fully editable

**Status:** EPIC 6 - Blocked by missing AI operation (`ai.generateCoverLetter`); matching context now available

**Planned Nuxt UI:**
`<URadioGroup>`, `<UTextarea>` or markdown editor

---

## 3.3 User Speech Builder ❌ NOT IMPLEMENTED

_(Supports EPIC 4)_

- Builds elevator pitch
- Builds career story
- Builds "Why Me?" narrative

**Status:** EPIC 4 - Blocked by missing AI operation (`ai.generateSpeech`)

**Planned Nuxt UI:**
`<UTextarea>` + “AI Improve” button, `<USteps>`

---

## 3.5 Interview Question Generator ❌ NOT IMPLEMENTED

_(Supports EPIC 7)_

- Generates questions per category
- Suggests answers based on user stories
- Exportable preparation sheet

**Status:** EPIC 7 - Blocked by missing AI operation (`ai.generateInterviewQuestions`)

**Planned Nuxt UI:**
`<UAccordion>`, `<UCard>`

---

# 4. Interview Simulation Components

_(Support EPIC 9 and EPIC 14)_

## 4.1 Text Interview Simulator ❌ NOT IMPLEMENTED

- Role-play with AI
- Real-time or post-session feedback
- Summary reporting

**Status:** EPIC 7/9 - Blocked by missing AI operations (`ai.simulateInterviewTurn`, `ai.evaluateInterviewAnswer`)

**Planned Nuxt UI:**
Custom chat component or Nuxt UI chat, `<UProgress>`, `<UAlert>`

---

## 4.2 Voice Interview Simulator ❌ NOT IMPLEMENTED (V2)

- Voice recognition
- Natural pacing & filler-word analysis
- Realistic live simulation

**Status:** EPIC 14 - Future enhancement (V2)

**Planned Flow:**
Speech → Analysis Engine → Feedback Report

---

# 5. Supporting Components

## 5.1 Dashboard (Home) ✅ IMPLEMENTED

- Hub page with navigation cards
- Quick access to main features
- Entry point for workflows

**Implementation:**

- Pages: `/` (index)
- Pattern: `<UPageGrid>` with `<UPageCard>` navigation

**Nuxt UI:**
`<UPage>`, `<UPageGrid>`, `<UPageCard>` (navigation hub pattern)

---

## 5.2 Settings Page ❌ NOT IMPLEMENTED

- Account settings
- Data export
- Delete account

**Status:** Low priority, planned for V1

---

## 5.3 Template Library ❌ NOT IMPLEMENTED

- Stores visual templates for CVs
- Presets for letters and stories

**Status:** EPIC 12 - Future enhancement

---

# Interaction Flow Between Components

```
USER INPUTS DATA
     ↓
User Profile Manager
     ↓
Experience Intake  ←→  Story Builder
     ↓
Personal Strengths & Values
     ↓
Personal Canvas Component
     ↓  (foundation created)

== JOB WORKFLOW BEGINS ==

Job Description → Job Role Card
             ↓
Company Info → Company Canvas
             ↓
Matching Component (User ↔ Job ↔ Company)
             ↓
Tailoring Engine
             ↓
CV Builder | Cover Letter | Speech Builder | KPI Generator
             ↓
Interview Question Generator
             ↓
Interview Simulator
```

---

# System-Wide Composables (Nuxt)

## Application Layer (`src/application/`) - Entity CRUD

| Composable                       | Purpose                           | Status            |
| -------------------------------- | --------------------------------- | ----------------- |
| **useUserProfile(id)**           | Single profile CRUD operations    | ✅                |
| **useExperience(id)**            | Single experience CRUD operations | ✅                |
| **useSTARStory(id)**             | Single story CRUD operations      | ✅                |
| **usePersonalCanvas(id)**        | Single canvas CRUD operations     | ✅                |
| **useCVDocument(id)**            | Single CV CRUD operations         | ✅                |
| **useJobDescription(id)**        | Single job CRUD operations        | ✅                |
| **useCompany(id)**               | Single company CRUD operations    | ⚠️ Exists, unused |
| **useStoryEngine(experienceId)** | Story operations for experience   | ✅                |
| **useCanvasEngine()**            | Canvas generation with AI         | ✅                |
| **useAiOperations()**            | AI operation execution wrapper    | ✅                |

## Workflow Layer (`src/composables/`) - Orchestration

| Composable                       | Purpose                      | Status |
| -------------------------------- | ---------------------------- | ------ |
| **useAuthUser()**                | Auth state wrapper (Amplify) | ✅     |
| **useCvUploadWorkflow()**        | CV upload orchestration      | ✅     |
| **useCvParsing()**               | CV parsing logic             | ✅     |
| **useExperienceImport()**        | Import extracted experiences | ✅     |
| **useProfileMerge()**            | Merge profile data           | ✅     |
| **useJobAnalysis()**             | Job CRUD + AI operations     | ✅     |
| **useJobUpload()**               | Job file upload              | ✅     |
| **useCvGenerator()**             | CV generation workflow       | ✅     |
| **useCvDocuments()**             | CV list operations           | ✅     |
| **useStoryList()**               | Story list operations        | ✅     |
| **useStoryEditor(storyId)**      | Story CRUD workflow          | ✅     |
| **useStarInterview(sourceText)** | Guided STAR interview        | ✅     |
| **useStoryEnhancer()**           | AI story generation          | ✅     |
| **useBreadcrumbMapping()**       | Dynamic breadcrumbs          | ✅     |
| **useMatchingEngine()**          | Fit analysis (planned)       | ❌     |
| **useTailoringEngine()**         | Material tailoring (planned) | ❌     |
| **useInterviewEngine()**         | Interview prep (planned)     | ❌     |
