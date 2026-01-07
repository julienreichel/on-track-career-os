# COMPONENT → PAGE MAPPING (MVP → V1)

**Last Updated:** 2025-12-31  
**Status:** Reflects actual implementation as of EPIC 5B completion

**Complete mapping of:**

- UI Pages (actual routes)
- Frontend Components (implemented)
- Composables (state + logic)
- CDM Entities (GraphQL models)
- AI Operations (Lambda functions)

Each page includes:

- UI Components (Nuxt UI)
- Frontend Components (custom components)
- Composables (state + logic)
- CDM Entities created/updated
- AI Operations triggered on that page

---

## 📋 DOCUMENT STATUS

**✅ Implemented (7 EPICs - 70% Complete):**

- EPIC 1A: User Data Intake & Identity
- EPIC 1B: Personal Canvas Generation
- EPIC 2: Experience Builder (STAR Stories)
- EPIC 3: Generic CV Generator
- EPIC 3B: CV Header & Contact Info
- EPIC 5A: Job Description Analysis
- EPIC 5B: Company Analysis & Canvas

**❌ Not Implemented (3 EPICs - 30% Remaining):**

- EPIC 4: User Speech Builder
- EPIC 5C: User-Job-Company Matching
- EPIC 6: Tailored Application Materials
- EPIC 7: Interview Prep

---

# 0. AUTH & ONBOARDING

---

## **0.1 Login / Signup Page** ✅

**Route:** `/login`

### UI

- `<UCard>`
- Amplify Authenticator Component

### Components

- None (Amplify UI)

### Composables

- `useAuthUser()` - wraps Amplify auth

### CDM Entities

- **UserProfile** (created empty on first login)

### AI Ops

- None

**Status:** ✅ Implemented

---

## **0.2 Home / Dashboard Page** ✅

**Route:** `/`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UPageGrid>`, `<UPageCard>`

### Components

- None (uses Nuxt UI layout components)

### Composables

- `useAuthUser()` - check user state
- Conditional CV upload visibility

### CDM Entities

- None (navigation only)

### AI Ops

- None

**Status:** ✅ Implemented (simple navigation hub)

**Note:** Original "First-Time Onboarding Wizard" not implemented - users start with CV upload or manual data entry

---

# 1. MY PROFILE & IDENTITY (EPIC 1A + 1B)

---

## **1.1 Profile Summary Page** ✅

**Route:** `/profile`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UPageGrid>`, `<UPageCard>`
- `<USkeleton>`, `<UAlert>`

### Components

- `ProfileSummaryCard` - displays profile overview with photo

### Composables

- `useUserProfile()` - profile CRUD
- `useAuthUser()` - get userId
- `ProfilePhotoService` - photo upload/retrieval

### CDM Entities

- **UserProfile** (read)

### AI Ops

- None

**Status:** ✅ Implemented  
**Pattern:** Hub page with navigation cards to related features

---

## **1.2 Full Profile Form** ✅

**Route:** `/profile/full`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UForm>`, `<UFormGroup>`
- `<UInput>`, `<UTextarea>`, `<UButton>`
- `<UFileUpload>` (profile photo)

### Components

- `ProfileFullForm` - complete profile editor organized in sections
  - Core Identity Section
  - Career Direction Section
  - Identity & Values Section
  - Professional Attributes Section
  - Contact Information Section

### Composables

- `useUserProfile()` - profile CRUD
- `ProfilePhotoService` - photo management

### CDM Entities

- **UserProfile** (full CRUD)

### AI Ops

- None

**Status:** ✅ Implemented  
**Pattern:** Large form with section-based organization, edit/view modes

---

## **1.3 CV Upload & Import** ✅

**Route:** `/profile/cv-upload`

### UI

- `<UPage>`, `<UPageBody>`
- Step-based wizard UI

### Components

- `CvUploadStep` - file upload
- `CvParsingStep` - AI parsing indicator
- `ProfilePreview` - extracted profile data
- `ExperiencesPreview` - extracted experiences
- `CvImportSuccess` - completion message

### Composables

- `useCvUploadWorkflow()` - orchestrates multi-step flow
- `useCvParsing()` - AI parsing logic
- `useExperienceImport()` - import extracted data
- `useProfileMerge()` - merge with existing profile

### CDM Entities

- **UserProfile** (merge/update)
- **Experience** (bulk create)

### AI Ops

- `ai.parseCvText` - extract profile data
- `ai.extractExperienceBlocks` - extract experiences

**Status:** ✅ Implemented  
**Pattern:** Multi-step wizard with AI processing, preview, and import

---

## **1.4 Experience List** ✅

**Route:** `/profile/experiences`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UPageGrid>`, `<UCard>`, `<UEmpty>`
- `<UModal>` (delete confirmation)

### Components

- `ExperienceCard` - displays experience with story count
- `ExperienceList` - table view (legacy component, not used in current page)

### Composables

- `ExperienceRepository` - data access
- `STARStoryService` - story counts

### CDM Entities

- **Experience[]** (list, delete)
- **STARStory** (count relationship)

### AI Ops

- None

**Status:** ✅ Implemented  
**Pattern:** Card grid layout with empty state and delete modal

---

## **1.5 Experience Editor** ✅

**Route:** `/profile/experiences/:id` (and `/profile/experiences/new`)

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UAlert>`, `<USkeleton>`

### Components

- `ExperienceForm` - full CRUD form for experience
  - Title, Company, Type, Dates
  - Location, Description
  - Responsibilities, Tasks
  - Status

### Composables

- `ExperienceRepository` - CRUD operations

### CDM Entities

- **Experience** (create, read, update)

### AI Ops

- None (manual entry only)

**Status:** ✅ Implemented  
**Pattern:** Single reusable form component for create/edit modes

**Note:** Original spec mentioned `ai.extractExperienceBlocks` and `ai.generateAchievementsAndKpis` button triggers - not implemented here (experiences come from CV upload instead)

---

## **1.6 Global Story Library** ✅

**Route:** `/profile/stories`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UEmpty>`, `<UAlert>`

### Components

- `StoryList` - displays stories with experience context
- `StoryViewModal` - full STAR story display

### Composables

- `useStoryList()` - fetch all user stories

### CDM Entities

- **STARStory[]** (read, with Experience relationship)

### AI Ops

- None (display only)

**Status:** ✅ Implemented  
**Pattern:** Read-only list view with modal for full story details

---

## **1.7 Per-Experience Story List** ✅

**Route:** `/profile/experiences/:experienceId/stories`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UButton>`, `<UAlert>`

### Components

- `StoryList` - story cards with actions
- `StoryViewModal` - full story view

### Composables

- `useStoryList()` - fetch stories for experience
- `useStoryEngine()` - auto-generate stories

### CDM Entities

- **STARStory[]** (list, delete)
- **Experience** (context)

### AI Ops

- `ai.generateStarStory` - auto-generate from experience

**Status:** ✅ Implemented  
**Pattern:** Scoped list with auto-generate button

---

## **1.8 STAR Story Editor** ✅

**Route:** `/profile/experiences/:experienceId/stories/:storyId`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UTabs>`

### Components

- `StoryBuilder` - guided STAR interview (3 modes)
  - Free text → AI generation
  - Auto-generate from experience
  - Manual entry
- `StoryForm` - manual STAR field entry
- `AchievementsKpisPanel` - tag-based editing

### Composables

- `useStoryEditor()` - CRUD operations
- `useStarInterview()` - guided interview flow
- `useStoryEnhancer()` - AI generation

### CDM Entities

- **STARStory** (create, read, update)
- **Experience** (relationship)

### AI Ops

- `ai.generateStarStory` - generate from text
- `ai.generateAchievementsAndKpis` - generate KPIs

**Status:** ✅ Implemented  
**Pattern:** Multi-mode editor with AI assistance

---

## **1.9 Personal Business Model Canvas** ✅

**Route:** `/profile/canvas`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UAlert>`, `<UToast>`

### Components

- `PersonalCanvasComponent` - 9-section BMC layout
- `CanvasSectionCard` - per-section tag editor

### Composables

- `useCanvasEngine()` - CRUD and AI operations

### CDM Entities

- **PersonalCanvas** (create, read, update)

### AI Ops

- `ai.generatePersonalCanvas` - generate from profile/experiences/stories

**Status:** ✅ Implemented  
**Pattern:** Single-page canvas with per-section editing and regeneration

---

# 2. CV DOCUMENTS (EPIC 3 + 3B)

---

## **2.1 CV List** ✅

**Route:** `/applications/cv`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UPageGrid>`, `<UEmpty>`
- `<UButton>`

### Components

- None (inline cards)

### Composables

- `useCvDocuments()` - CRUD operations

### CDM Entities

- **CVDocument[]** (list, delete)

### AI Ops

- None

**Status:** ✅ Implemented  
**Pattern:** Card grid with delete and print shortcuts

---

## **2.2 CV Generator Wizard** ✅

**Route:** `/applications/cv/new`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UFormField>`, `<UInput>`
- `<UCheckbox>` (optional sections)
- Step indicator (custom)

### Components

- `CvExperiencePicker` - select experiences for CV
- `CvGeneratingStep` - AI generation loading state

### Composables

- `useCvGenerator()` - build AI payload
- `useCvDocuments()` - save generated CV

### CDM Entities

- **CVDocument** (create)
- **UserProfile** (read)
- **Experience** (read, select)
- **STARStory** (read)

### AI Ops

- `ai.generateCv` - generate markdown CV from profile/experiences/stories

**Status:** ✅ Implemented  
**Pattern:** 2-step wizard (select experiences → configure options → generate)

---

## **2.3 CV Editor** ✅

**Route:** `/applications/cv/:id`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UTextarea>` (markdown editor)
- `<UCard>` (rendered preview)
- `<UToggle>` (profile photo)
- Tailored job banner (when jobId exists)

### Components

- `TailoredJobBanner` - shows job backlink + regenerate tailored action

### Composables

- `useCvDocuments()` - read, update
- `ProfilePhotoService` - photo URL for preview
- `useTailoredMaterials()` - regenerate tailored CV when jobId exists

### CDM Entities

- **CVDocument** (read, update)
- **UserProfile** (photo, contact info)

### AI Ops

- None (manual editing)

**Status:** ✅ Implemented  
**Pattern:** Split-view editor with live markdown preview

---

## **2.4 CV Print View** ✅

**Route:** `/applications/cv/:id/print`

### UI

- A4-sized layout
- Auto-print on load
- CSS optimized for 2-page output

### Components

- None (render markdown with styling)

### Composables

- `useCvDocuments()` - read CV
- `ProfilePhotoService()` - photo for header

### CDM Entities

- **CVDocument** (read)
- **UserProfile** (photo, contact)

### AI Ops

- None

**Status:** ✅ Implemented  
**Pattern:** Print-optimized view with auto-trigger

---

# 3. JOBS & COMPANIES

---

## **3.1 Job List** ✅

**Route:** `/jobs`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UInput>` (search)
- `<UPageGrid>`, `<UCard>`, `<UEmpty>`
- `<UModal>` (delete confirmation)
- `<UAlert>`

### Components

- `JobCard` - displays job with status badge

### Composables

- `useJobAnalysis()` - CRUD operations

### CDM Entities

- **JobDescription[]** (list, delete)

### AI Ops

- None

**Status:** ✅ Implemented  
**Pattern:** Searchable card grid with delete modal

---

## **3.2 Job Upload** ✅

**Route:** `/jobs/new`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UAlert>`

### Components

- `JobUploadStep` - file upload (PDF/TXT) with status feedback

### Composables

- `useJobUpload()` - file handling and validation
- `useJobAnalysis()` - create job and trigger AI

### CDM Entities

- **JobDescription** (create with rawText)

### AI Ops

- `ai.parseJobDescription` - extract job fields from raw text

**Status:** ✅ Implemented  
**Pattern:** Single-step upload with AI parsing and redirect

---

## **3.3 Job Detail & Editor** ✅

**Route:** `/jobs/[jobId]`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UFormGroup>`, `<UInput>`
- `<UTabs>` (5 sections)
- `<UModal>` (reanalyse confirmation)
- `<UButton>` (save, cancel, reanalyse)
- Tailored application materials card (CV / Cover Letter / Speech)

### Components

- `TagInput` - list field editing (responsibilities, skills, behaviours, etc.)
- `CompanySelector` - dropdown for job-company linking
- `LinkedCompanyBadge` - display linked company with navigation
- `TailoredMaterialsCard` - generate or open tailored materials for this job

### Composables

- `useJobAnalysis()` - CRUD and reanalysis
- `useCompany()` - fetch companies for linking
- `useBreadcrumbMapping()` - dynamic breadcrumb
- `useTailoredMaterials()` - tailored CV/letter/applications/speech actions

### CDM Entities

- **JobDescription** (read, update, reanalyse)
- **Company** (read for linking)

### AI Ops

- `ai.parseJobDescription` - reanalyse from rawText
- `ai.analyzeCompanyInfo` - automatic extraction on job upload

**Status:** ✅ Implemented  
**Pattern:** Tabbed editor with dirty tracking, save/cancel, reanalyse modal, and company linking

**Fields:**

- Scalar: title, seniorityLevel, roleSummary
- Lists: responsibilities, requiredSkills, behaviours, successCriteria, explicitPains

---

## **3.4 Company List** ✅

**Route:** `/companies`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UPageGrid>`, `<UCard>`
- `<UInput>` (search)
- `<UModal>` (delete confirmation)

### Components

- `CompanyCard` - company display with ItemCard pattern

### Composables

- `useCompany()` - company CRUD, search
- `useAuthUser()` - get userId

### CDM Entities

- **Company[]** (list)

### AI Ops

- None

**Status:** ✅ Implemented  
**Pattern:** Grid layout with search, empty state, delete confirmation modal

---

## **3.5 Company Info & Canvas Editor** ✅

**Route:** `/companies/new`, `/companies/[companyId]`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<UCard>`, `<UForm>`, `<UFormGroup>`
- `<UInput>`, `<UTextarea>`, `<UButton>`
- `<UBadge>` (status indicators)
- Grid layout for Business Model Canvas (9 blocks)

### Components

- `CompanyForm` - company info form (name, industry, size, website, etc.)
- `CompanyNotesInput` - research notes textarea
- `CompanyCanvasEditor` - Business Model Canvas grid layout
- `CanvasBlockSection` - individual BMC block editor with tag input
- Related Jobs grid (on detail page)

### Composables

- `useCompany()` - company CRUD, AI analysis
- `useCompanyCanvas()` - canvas generation/editing
- `useCompanyJobs()` - fetch linked jobs
- `useAuthUser()` - get userId

### CDM Entities

- **Company** (create/update)
- **CompanyCanvas** (create/read/update)
- **JobDescription[]** (read linked jobs)

### AI Ops

- `ai.analyzeCompanyInfo` ✅
- `ai.generateCompanyCanvas` ✅

**Status:** ✅ Implemented  
**Pattern:** Combined page with company form, Business Model Canvas editor, and related jobs section

**Features:**

- Create company with optional AI analysis
- Edit company info fields (name, industry, sizeRange, website, productsServices, targetMarkets, customerSegments, description, additionalNotes)
- AI-powered analysis from research notes (only shown for new/unanalyzed companies)
- Generate Business Model Canvas from company profile (only shown when no canvas exists)
- Edit canvas blocks with tag-based input:
  - 9 BMC blocks: keyPartners, keyActivities, keyResources, valuePropositions, customerRelationships, channels, customerSegments, costStructure, revenueStreams
  - Summary field
- View all jobs linked to this company
- Dynamic breadcrumb with company name
- Automatic company extraction from job descriptions
- Smart company deduplication with name normalization

**Canvas Layout:**

- 5-column top section:
  - Col 1: Key Partners
  - Col 2: Key Activities (top), Key Resources (bottom)
  - Col 3: Value Propositions
  - Col 4: Customer Relationships (top), Channels (bottom)
  - Col 5: Customer Segments
- 2-column bottom section:
  - Col 1: Cost Structure
  - Col 2: Revenue Streams
- Summary field below canvas
- Save canvas button in card footer

---

# 4. MATCHING (EPIC 5C)

---

## **4.1 Matching Summary** ✅

**Route:** `/jobs/[jobId]/match`

### UI

- `<UCard>`
- `<UAlert>`
- `<UBadge>`
- Fit score visualization (score breakdown cards)
- Tailored application materials card (CV / Cover Letter / Speech)

### Components

- `MatchingSummaryCard`
- `TailoredMaterialsCard`

### Composables

- `useMatchingEngine()` ✅
- `useUserProfile()` ✅
- `useJobAnalysis()` ✅
- `useCanvasEngine()` ✅
- `useTailoredMaterials()` ✅

### CDM Entities

- **MatchingSummary** (create/read)
- **UserProfile** (read)
- **PersonalCanvas** (read)
- **JobDescription** (read)
- **CompanyCanvas** (read - depends on 5B)

### AI Ops

`ai.generateMatchingSummary` ✅

**Status:** ✅ Implemented  
**Blocking:** None  
**Dependencies:** EPIC 5B (Company Canvas) recommended but not required

---

# 5. TAILORED APPLICATION MATERIALS (EPIC 6)

---

## **5.1 Tailored Application Materials** ✅

**Route:** `/jobs/[jobId]`, `/jobs/[jobId]/match`

### UI

- Tailored materials card with actions for CV / Cover Letter / Speech
- Links to existing tailored documents when available
- Generates tailored documents when matching summary exists

### Components

- `TailoredMaterialsCard`

### Composables

- `useTailoredMaterials()` ✅ - tailored generation + navigation

### CDM Entities

- **CVDocument** (create/update with jobId)
- **CoverLetter** (create/update with jobId)
- **SpeechBlock** (create/update with jobId)
- **JobDescription** (read)
- **MatchingSummary** (read)
- **Company** (optional summary)

### AI Ops

- `ai.generateCv`
- `ai.generateCoverLetter`
- `ai.generateSpeech`

**Status:** ✅ Implemented  
**Behavior:** Generates tailored documents using matching summary; reuses existing documents when present.

---

## **5.2 Cover Letter Builder** ✅

**Route:** `/applications/cover-letters`, `/applications/cover-letters/new`, `/applications/cover-letters/:id`, `/applications/cover-letters/:id/print`

### UI

- `<UPage>`, `<UPageHeader>`, `<UPageBody>`
- `<ItemCard>` for list view
- `<UTextarea>` for Markdown editing
- `<UButton>` for actions (Edit, Print, Regenerate)
- Tailored job banner (when jobId exists)

### Components

- `TailoredJobBanner` - shows job backlink + regenerate tailored action

### Composables

- `useCoverLetterEngine()` - workflow orchestration with AI generation
- `useCoverLetters()` - list management
- `useCoverLetter()` - CRUD operations
- `useTailoredMaterials()` - regenerate tailored cover letter when jobId exists

### CDM Entities

- **CoverLetter** (create/read/update/delete)
- **UserProfile** (read)
- **JobDescription** (optional, read)
- **PersonalCanvas** (read)
- **Experience** (read)
- **STARStory** (read)

### AI Ops

- `ai.generateCoverLetter` - generates professional cover letter with optional job targeting

**Status:** ✅ Fully Implemented  
**Pattern:** Matches CV flow - List → Create/Generate → Edit → Print

---

## **5.3 Speech Builder** ✅

**Route:** `/applications/speech` and `/applications/speech/:id` (implemented)

### UI

- `<UCard>` with card-based section layout
- `<UTextarea>` for text sections
- `<UButton>` for generate/save/cancel actions
- `<TagInput>` for key messages
- Tailored job banner (when jobId exists)

### Components

- **SpeechBlockEditorCard.vue** - Card layout for speech sections
- **SpeechSectionEditor.vue** - Tag-based editor with character count
- **SpeechGenerateButton.vue** - AI generation trigger
- **TailoredJobBanner.vue** - job backlink + regenerate tailored action

### Composables

- `useSpeechBlock()` ✅ - CRUD operations with AI generation
- `useSpeechBlocks()` ✅ - List management
- `useSpeechEngine()` ✅ - Workflow orchestration
- `useUserProfile()` ✅
- `useJobAnalysis()` ✅ (for job targeting)
- `useTailoredMaterials()` ✅ (for tailored regeneration)

### CDM Entities

- **SpeechBlock** (CRUD complete)
  - elevatorPitch: { text, keyMessages[] }
  - careerStory: { text, keyMessages[] }
  - whyMe: { text, keyMessages[] }
  - jobId (optional)

### AI Ops

- `ai.generateSpeech` ✅ (EPIC 4 complete - job targeting optional)

**Notes:**

- Job targeting enabled via optional jobId parameter
- Card-based UI consistent with CV/matching patterns
- Three sections: elevator pitch, career story, why me
- Tag-based editing for key messages
- Character count display for text sections

**Status:** ✅ Fully Implemented  
**Testing:** E2E coverage with 7 tests in speech-flow.spec.ts

---

# 7. SYSTEM PAGES

---

## **7.1 Settings** ❌

**Route:** `/settings` (planned)

### UI

- `<UForm>`
- `<UCard>`

### Components

- Settings Component (planned)

### Composables

- `useUserProfile()` ✅

### CDM Entities

- **UserProfile** (update preferences)

### AI Ops

- None

**Status:** ❌ Not Implemented (low priority)

---

# 8. IMPLEMENTATION SUMMARY

## 8.1 Implemented Pages (28 Routes)

| Page                   | Route                                                 | Status | EPIC |
| ---------------------- | ----------------------------------------------------- | ------ | ---- |
| Home                   | `/`                                                   | ✅     | -    |
| Login                  | `/login`                                              | ✅     | -    |
| Profile Summary        | `/profile`                                            | ✅     | 1A   |
| Profile Full Form      | `/profile/full`                                       | ✅     | 1A   |
| CV Upload              | `/profile/cv-upload`                                  | ✅     | 1A   |
| Experience List        | `/profile/experiences`                                | ✅     | 1A   |
| Experience Editor      | `/profile/experiences/:id`                            | ✅     | 1A   |
| Global Story Library   | `/profile/stories`                                    | ✅     | 2    |
| Per-Experience Stories | `/profile/experiences/:experienceId/stories`          | ✅     | 2    |
| Story Editor           | `/profile/experiences/:experienceId/stories/:storyId` | ✅     | 2    |
| Personal Canvas        | `/profile/canvas`                                     | ✅     | 1B   |
| CV List                | `/applications/cv`                                                 | ✅     | 3    |
| CV Generator           | `/applications/cv/new`                                             | ✅     | 3    |
| CV Editor              | `/applications/cv/:id`                                             | ✅     | 3    |
| CV Print               | `/applications/cv/:id/print`                                       | ✅     | 3B   |
| Job List               | `/jobs`                                               | ✅     | 5A   |
| Job Upload             | `/jobs/new`                                           | ✅     | 5A   |
| Job Detail             | `/jobs/[jobId]`                                       | ✅     | 5A   |
| Matching Summary       | `/jobs/[jobId]/match`                                 | ✅     | 5C   |
| Company List           | `/companies`                                          | ✅     | 5B   |
| Company New            | `/companies/new`                                      | ✅     | 5B   |
| Company Detail         | `/companies/[companyId]`                              | ✅     | 5B   |
| Speech List            | `/applications/speech`                                             | ✅     | 4    |
| Speech Editor          | `/applications/speech/:id`                                         | ✅     | 4    |
| Cover Letter List      | `/applications/cover-letters`                                      | ✅     | 4B   |
| Cover Letter New       | `/applications/cover-letters/new`                                  | ✅     | 4B   |
| Cover Letter Editor    | `/applications/cover-letters/:id`                                  | ✅     | 4B   |
| Cover Letter Print     | `/applications/cover-letters/:id/print`                            | ✅     | 4B   |

## 8.2 Planned Pages (3 Routes)

| Page                | Route                         | Status | EPIC | Blocker               |
| ------------------- | ----------------------------- | ------ | ---- | --------------------- |
| Interview Prep      | `/interviews/:jobId/prep`     | ❌     | 7    | Planned               |
| Interview Simulator | `/interviews/:jobId/simulate` | ❌     | 7    | Planned               |
| Settings            | `/settings`                   | ❌     | -    | Low priority          |

## 8.3 Implemented Components

**Core Components (Domain):**

- `ExperienceForm` - CRUD form for experiences
- `ExperienceCard` - experience display card
- `ExperienceList` - table view (legacy)
- `StoryBuilder` - guided STAR interview (3 modes)
- `StoryForm` - manual STAR entry
- `StoryList` - story cards with actions
- `StoryCard` - individual story card
- `StoryViewModal` - full story display
- `AchievementsKpisPanel` - tag-based KPI editing
- `PersonalCanvasComponent` - 9-section BMC layout
- `CanvasSectionCard` - per-section tag editor
- `TagInput` - reusable tag management
- `ItemCard` - reusable card pattern

**CV Components:**

- `ExperiencePicker` - select experiences for CV
- `ExperiencesPreview` - preview extracted experiences
- `ProfilePreview` - preview extracted profile
- `UploadStep` - file upload UI
- `ParsingStep` - AI parsing indicator
- `GeneratingStep` - CV generation indicator
- `ImportSuccess` - import completion
- `BadgeList` - list of badges
- `SingleBadge` - individual badge

**Job Components:**

- `JobCard` - job display with status badge
- `JobUploadStep` - file upload with status

**Tailoring Components:**

- `TailoredMaterialsCard` - generate/open tailored CV, cover letter, speech
- `TailoredJobBanner` - job backlink + regenerate tailored action

**Profile Components:**

- `ProfileFullForm` - complete profile editor
- `ProfileSummaryCard` - profile overview

**Speech Components:**

- `SpeechBlockEditorCard` - card layout for speech sections
- `SpeechSectionEditor` - tag-based editor with character count
- `SpeechGenerateButton` - AI generation trigger

## 8.4 Implemented Composables

**Application Layer (`src/application/`):**

- `useUserProfile(id)` - single profile CRUD
- `useExperience(id)` - single experience CRUD
- `useSTARStory(id)` - single story CRUD
- `usePersonalCanvas(id)` - single canvas CRUD
- `useCVDocument(id)` - single CV CRUD
- `useJobDescription(id)` - single job CRUD
- `useCompany(id)` - single company CRUD (exists, unused)
- `useStoryEngine(experienceId)` - story operations
- `useCanvasEngine()` - canvas operations with AI
- `useAiOperations()` - AI operation execution

**Workflow Layer (`src/composables/`):**

- `useAuthUser()` - auth state wrapper
- `useCvUploadWorkflow()` - CV upload orchestration
- `useCvParsing()` - CV parsing logic
- `useExperienceImport()` - import extracted experiences
- `useProfileMerge()` - profile data merge
- `useJobAnalysis()` - job CRUD + AI operations
- `useJobUpload()` - job file upload
- `useCvGenerator()` - CV generation logic
- `useCvDocuments()` - CV list operations
- `useStoryList()` - story list operations
- `useStoryEditor(storyId)` - story CRUD workflow
- `useStarInterview(sourceText)` - guided STAR interview
- `useStoryEnhancer()` - AI story generation
- `useBreadcrumbMapping()` - dynamic breadcrumbs
- `useSpeechBlock(id)` - single speech CRUD with AI
- `useSpeechBlocks()` - speech list operations
- `useSpeechEngine()` - speech workflow orchestration
- `useTailoredMaterials()` - tailored CV/letter/applications/speech generation

## 8.5 AI Operations Status (12/12 Implemented)

**✅ Implemented:**

1. `ai.parseCvText` - extract profile from CV
2. `ai.extractExperienceBlocks` - extract experiences from CV
3. `ai.generatePersonalCanvas` - generate personal BMC
4. `ai.generateStarStory` - generate STAR stories
5. `ai.generateAchievementsAndKpis` - generate KPIs from story
6. `ai.generateCv` - generate markdown CV
7. `ai.parseJobDescription` - extract job fields from text
8. `ai.analyzeCompanyInfo` - analyze company research notes
9. `ai.generateCompanyCanvas` - generate company BMC
10. `ai.generateMatchingSummary` - generate matching summary
11. `ai.generateCoverLetter` - generate cover letter
12. `ai.generateSpeech` - generate speech blocks (elevator pitch, career story, why me)

---

# 9. ARCHITECTURE AUDIT & ANALYSIS

## 9.1 What's Working Well ✅

### 1. Component Architecture

**Pattern:** Pages → Components → Composables → Services → Repositories → GraphQL

**Strengths:**

- ✅ Clean separation of concerns
- ✅ Consistent file organization (`src/pages/`, `src/components/`, `src/composables/`)
- ✅ Reusable components (`TagInput`, `ItemCard`, `CanvasSectionCard`)
- ✅ Domain-specific components (`ExperienceForm`, `StoryBuilder`, `JobCard`)

### 2. Composable Pattern

**Pattern:** Workflow composables wrap application-layer composables

**Strengths:**

- ✅ Clear distinction between single-entity (`use*` in `application/`) and workflow orchestration (`use*Workflow`, `use*Engine`)
- ✅ State management stays close to data (no global Pinia store needed)
- ✅ Testable units with mocked dependencies
- ✅ Good examples: `useCvUploadWorkflow()`, `useCanvasEngine()`, `useStoryEditor()`

### 3. Nuxt UI Integration

**Pattern:** Heavy reliance on Nuxt UI components + semantic HTML

**Strengths:**

- ✅ Consistent design system
- ✅ Built-in accessibility
- ✅ Rapid development (no custom UI primitives needed)
- ✅ Good coverage: `UPage`, `UPageHeader`, `UPageBody`, `UCard`, `UForm`, `UInput`, `UButton`, etc.

### 4. Page Patterns

**Established Patterns:**

1. **Hub Page**: `/profile` - navigation cards to features
2. **List Page**: `/jobs`, `/applications/cv` - searchable card grid + empty state + delete modal
3. **Form Page**: `/profile/full`, `/jobs/[jobId]` - edit/view modes, dirty tracking, save/cancel
4. **Wizard Page**: `/applications/cv/new`, `/profile/cv-upload` - multi-step with progress indicator
5. **Detail Page**: `/jobs/[jobId]` - tabbed sections with TagInput

**Consistency:** ✅ Patterns are emerging and reusable

### 5. Test Coverage

**Coverage:** 975 unit/integration + 31 sandbox + 3 E2E flows

**Strengths:**

- ✅ Comprehensive domain/service/composable tests
- ✅ Component tests with Nuxt UI stubs
- ✅ E2E tests for critical flows (canvas, stories, jobs)
- ✅ Sandbox tests for AI operations

### 6. i18n Implementation

**Pattern:** All text via `t('key.path')` with JSON locale files

**Strengths:**

- ✅ No hard-coded strings
- ✅ Organized by feature (`jobUpload`, `jobList`, `jobDetail`)
- ✅ Reusable keys (`errors`, `actions`, `features`)

## 9.2 Areas for Improvement ⚠️

### 1. Component Reuse & Organization

**Issue:** Some duplication between pages

- `ExperienceCard` is good, but `ExperienceList` (table component) is unused
- Job list uses inline cards instead of a reusable `JobList` component
- CV list uses inline cards instead of a reusable `CvList` component

**Impact:** Moderate - increases page complexity

**Recommendation:**

- Extract list patterns into reusable components (`JobList`, `CvList`)
- Deprecate unused `ExperienceList` table component
- Create `ListPage` layout component for common list page pattern

### 2. Form Abstraction

**Issue:** Form state management is inconsistent

- `ExperienceForm` is a complete self-contained component
- Jobs detail page has inline form logic (304 lines)
- CV generator has inline form logic (256 lines)

**Impact:** Moderate - harder to maintain, test, and reuse

**Recommendation:**

- Extract `JobForm` component from `/jobs/[jobId].vue`
- Extract `CvGeneratorForm` component from `/applications/cv/new.vue`
- Create `FormCard` wrapper component for common form+card pattern

### 3. Wizard Pattern

**Issue:** Wizard implementation is ad-hoc

- CV upload has custom step tracking
- CV generator has custom step tracking
- No reusable wizard component

**Impact:** Low - works but duplicates logic

**Recommendation:**

- Create `WizardContainer` component with slot-based steps
- Standardize step indicator UI
- Centralize step navigation logic

### 4. Modal Usage

**Issue:** Delete modals are repeated in multiple pages

- `/profile/experiences` - delete experience modal
- `/jobs` - delete job modal
- Custom implementation each time

**Impact:** Low - but creates duplication

**Recommendation:**

- Create `ConfirmModal` component (already exists at `src/components/ConfirmModal.vue` - use it!)
- Standardize delete confirmation pattern

### 5. Breadcrumb Management

**Issue:** Dynamic breadcrumbs require `useBreadcrumbMapping()` and `definePageMeta`

- Jobs detail page updates breadcrumb with job title
- Experience stories page updates with company name
- Requires two mechanisms (`definePageMeta` + `useBreadcrumbMapping`)

**Impact:** Low - works but complex

**Recommendation:**

- Document breadcrumb pattern in style guide
- Consider Nuxt UI `<UBreadcrumb>` if it provides dynamic support

### 6. Loading & Error States

**Issue:** Loading and error handling is inconsistent

- Some pages use `<USkeleton>`
- Some pages use custom loading indicators
- Error messages use different patterns (`<UAlert>`, `errorMessage` strings)

**Impact:** Moderate - UX inconsistency

**Recommendation:**

- Create `LoadingCard` component for skeleton states
- Standardize error toast vs alert usage
- Create `ErrorBoundary` component for page-level errors

### 7. Empty States

**Issue:** Empty states are well-implemented but could be extracted

- Each page implements `<UEmpty>` with custom actions
- Pattern is consistent but repeated

**Impact:** Low - minor duplication

**Recommendation:**

- Create `EmptyState` wrapper with common patterns (icon, title, description, primary action)

### 8. Page Size

**Issue:** Some pages are very large

- `/jobs/[jobId].vue` - 485 lines
- `/applications/cv/new.vue` - 256 lines
- `/profile/experiences/[experienceId]/stories/[storyId].vue` - complex logic

**Impact:** Moderate - harder to maintain and test

**Recommendation:**

- Extract form logic into components
- Extract wizard steps into separate components
- Target max 200 lines per page (excluding types)

### 9. Type Definitions

**Issue:** Type definitions are sometimes inline

- Form state types defined in page files
- Some interfaces duplicated across files

**Impact:** Low - but reduces type reuse

**Recommendation:**

- Extract form state types to `types/forms.ts`
- Extract UI types to `types/ui.ts`
- Use domain types directly when possible

### 10. Composable Organization

**Issue:** Unclear distinction between workflow composables

- Some are in `src/composables/` (workflow level)
- Some are in `src/application/` (entity level)
- Naming could be clearer (`useJobAnalysis` vs `useJobDescription`)

**Impact:** Low - but affects developer experience

**Recommendation:**

- Keep `src/application/` for single-entity CRUD (`useUserProfile`, `useJobDescription`)
- Keep `src/composables/` for workflows (`useCvUploadWorkflow`, `useJobAnalysisWorkflow`)
- Rename for clarity where needed

## 9.3 Missing Patterns for Future EPICs

### 1. Tailoring Engine Pattern

**Needed for:** EPIC 6

**Requirements:**

- Context aggregation (profile + canvas + job + company + matching)
- Multi-step generation workflow
- Comparison UI (generic vs tailored)

**Recommendation:**

- Create `useTailoringEngine()` composable
- Design `TailoringContext` type
- Create `ComparisonView` component

### 2. Real-Time Chat Pattern

**Needed for:** EPIC 7 (Interview Simulator)

**Requirements:**

- Streaming AI responses
- Turn-based conversation
- Performance feedback
- Session persistence

**Recommendation:**

- Research Nuxt UI `<UChat>` component
- Design `ChatMessage` and `ChatSession` types
- Create `InterviewSimulator` component

### 3. Matching Visualization

**Needed for:** EPIC 5C (completed)

**Implemented:**

- Fit score display + score breakdown cards
- Strengths, skill match, risks, impact, tailoring lists
- Matching summary layout via `MatchingSummaryCard`

**Note:** Dedicated gauge/chart components are optional enhancements.

---

# 10. REFACTORING PLAN

## Phase 1: Component Extraction (1-2 weeks)

**Priority:** High  
**Impact:** Reduces duplication, improves maintainability

### Tasks:

1. **Extract List Components**
   - [ ] Create `JobList.vue` from `/jobs/index.vue` inline logic
   - [ ] Create `CvList.vue` from `/applications/cv/index.vue` inline logic
   - [ ] Deprecate `ExperienceList.vue` table component (card pattern is better)

2. **Extract Form Components**
   - [ ] Create `JobForm.vue` from `/jobs/[jobId].vue`
   - [ ] Create `CvGeneratorForm.vue` from `/applications/cv/new.vue`
   - [ ] Extract common form patterns into `FormCard.vue`

3. **Standardize Modals**
   - [ ] Replace all delete modals with existing `ConfirmModal.vue`
   - [ ] Add `type` prop to `ConfirmModal` (delete, warning, info)
   - [ ] Update 3 pages: `/profile/experiences`, `/jobs`, `/profile/experiences/[experienceId]/stories`

4. **Extract Empty States**
   - [ ] Create `EmptyState.vue` wrapper component
   - [ ] Update 5+ pages to use `EmptyState`

**Estimated Effort:** 10-15 hours  
**Files Affected:** ~10 pages, +5 new components

---

## Phase 2: Page Refactoring (1-2 weeks)

**Priority:** Medium  
**Impact:** Improves readability and testability

### Tasks:

1. **Reduce Page Complexity**
   - [ ] `/jobs/[jobId].vue` - extract `JobForm` component (485 → 150 lines)
   - [ ] `/applications/cv/new.vue` - extract wizard steps (256 → 100 lines)
   - [ ] `/profile/experiences/[experienceId]/stories/[storyId].vue` - extract mode selection logic

2. **Wizard Standardization**
   - [ ] Create `WizardContainer.vue` component
   - [ ] Create `WizardStep.vue` component
   - [ ] Update `/applications/cv/new.vue` to use wizard components
   - [ ] Update `/profile/cv-upload.vue` to use wizard components

3. **Loading & Error Standardization**
   - [ ] Create `LoadingCard.vue` component (skeleton wrapper)
   - [ ] Create `ErrorAlert.vue` component (standardized error display)
   - [ ] Update 10+ pages to use standardized components

**Estimated Effort:** 15-20 hours  
**Files Affected:** ~15 pages, +4 new components

---

## Phase 3: Type System Cleanup (3-5 days)

**Priority:** Low  
**Impact:** Improves type reuse and discoverability

### Tasks:

1. **Extract Form Types**
   - [ ] Create `src/types/forms.ts`
   - [ ] Move form state types from page files
   - [ ] Create generic `FormState<T>` type

2. **Extract UI Types**
   - [ ] Consolidate `PageHeaderLink`, `TableColumn`, etc. in `src/types/ui.ts`
   - [ ] Remove duplicated type definitions

3. **Document Type Patterns**
   - [ ] Add JSDoc comments to key types
   - [ ] Create type usage guide in docs

**Estimated Effort:** 5-8 hours  
**Files Affected:** ~20 files, +2 type files

---

## Phase 4: Composable Reorganization (3-5 days)

**Priority:** Low  
**Impact:** Improves developer experience

### Tasks:

1. **Clarify Naming**
   - [ ] Rename `useJobAnalysis()` → `useJobWorkflow()` (or keep if preferred)
   - [ ] Ensure all workflow composables have clear names

2. **Document Composable Patterns**
   - [ ] Create composable style guide
   - [ ] Document when to use `application/` vs `composables/`

3. **Audit Unused Composables**
   - [ ] Verify all composables are used
   - [ ] Remove or mark deprecated composables

**Estimated Effort:** 5-8 hours  
**Files Affected:** ~10 composables

---

## Phase 5: Future EPIC Preparation (2-3 weeks)

**Priority:** Medium (before starting EPICs 4, 6, 7)  
**Impact:** Enables faster EPIC implementation

### Tasks:

1. **Tailoring Engine Foundation (EPIC 6)**
   - [ ] Design `TailoringContext` type
   - [ ] Create `useTailoringEngine()` composable skeleton
   - [ ] Create `ComparisonView.vue` component
   - [ ] Create `TailoredContentEditor.vue` base component

2. **Matching Engine Foundation (EPIC 5C) ✅**
   - [x] Define `MatchingSummaryResult` type + validation
   - [x] Build `MatchingSummaryCard` layout with score breakdown
   - [x] Render strengths, skill match, risks, impact, tailoring lists

3. **Interview Engine Foundation (EPIC 7)**
   - [ ] Design `InterviewMessage`, `InterviewSession` types
   - [ ] Research streaming AI implementation
   - [ ] Create `InterviewChat.vue` component skeleton
   - [ ] Create `PerformanceFeedback.vue` component

4. **Company Canvas (EPIC 5B) ✅**
   - [x] Reuse personal canvas layout patterns
   - [x] Build `CompanyCanvasEditor` + `CanvasBlockSection`
   - [x] Build `CompanyForm` for company profile editing

**Estimated Effort:** 20-30 hours (parallel with EPIC development)  
**Files Affected:** +10 new components, +3 new composables

---

## Refactoring Success Metrics

### Code Quality

- [ ] Max page size: 200 lines (excluding types)
- [ ] Max component complexity: 16 (ESLint)
- [ ] Component reuse: 80%+ (pages use shared components)
- [ ] Type coverage: 100% (no `any` types)

### Developer Experience

- [ ] New page creation: < 100 lines (use shared patterns)
- [ ] Component discoverability: documented in style guide
- [ ] Composable clarity: clear naming + JSDoc

### Maintainability

- [ ] Reduced duplication: -30% code in pages
- [ ] Standardized patterns: wizard, list, form, modal
- [ ] Consistent error handling: unified approach

---

# 11. NEXT IMMEDIATE ACTIONS

## Before Starting EPIC 4/6/7

1. **Complete Phase 1 Refactoring** (Component Extraction)
   - Extract `JobForm`, `CvList`, `JobList` components
   - Standardize delete modals with `ConfirmModal`
   - Create `EmptyState` wrapper

2. **Document Component Library**
   - Create `docs/Component_Library.md`
   - Document when to use each component
   - Add usage examples

3. **Create Component Templates**
   - `ComponentList.vue.template` - for list pages
   - `ComponentForm.vue.template` - for form pages
   - `ComponentWizard.vue.template` - for wizard pages

4. **Establish Page Guidelines**
   - Max 200 lines per page
   - Required sections: script setup, template, types
   - Composable usage patterns

---

**END OF DOCUMENT**

**Last Updated:** 2025-12-30  
**Next Review:** After EPIC 5B completion
