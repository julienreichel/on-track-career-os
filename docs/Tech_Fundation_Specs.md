# Tech Foundations Spec — v1.0

**Status:** Core foundations implemented (60% MVP complete)  
**Last Updated:** 2025-12-30

## 0. Goal

Define the **technical baseline for the MVP** so that:

- All developers share the same expectations
- Architectural decisions are explicit
- We avoid re-litigating foundational questions during implementation

This spec covers: stack, environments, auth, data, AI integration, testing, CI/CD, UI, i18n, error handling, logging, and basic structure.

---

# 1. Development Model & Environments

## 1.1 Branching & Workflow

### **Trunk-Based Development (TBD)**

- **Main branch:** `main` (single trunk)
- **Feature branches:** `feature/*` — short-lived
- Always merged back into `main` via PR
- **No** long-lived `develop` or `release` branches

---

## 1.2 Environments

### **Local**

- Nuxt dev server (`npm run dev`)
- Sandbox dev backend

### **Amplify environments**

- **prod**: Connected to `main` branch → auto-deploy on merge

---

## 1.3 Secrets

### **Backend / Amplify**

- AI provider keys stored as **Amplify environment variables**
- Separate values for dev & prod

### **CI / GitHub Actions**

- Use **GitHub Secrets** (e.g., fake AI key for test mode)

---

# 2. Frontend Stack ✅ IMPLEMENTED

- **Framework:** Nuxt 4 (Vue 3, Vite)
- **Language:** TypeScript (strict mode)
- **UI Library:** Nuxt UI
- **Styling:** TailwindCSS
  - Minimal config; extend gradually

## State Management ✅

- Using **composables** over global stores
- Two-layer composable pattern:
  - `src/application/` - Entity-level CRUD composables
  - `src/composables/` - Workflow orchestration composables

## Testing ✅ COMPREHENSIVE

- **Vitest**: 975 unit + integration tests, 31 sandbox tests (AI operations)
- **@vue/test-utils** + **@nuxt/test-utils** for component tests
- **Playwright**: 89 E2E tests across 9 test suites
- **Total:** 1095 tests, 100% passing

## Linting & Formatting ✅

- **ESLint** strict rules:
  - Cyclomatic complexity ≤ 16
  - Max function length: 100 lines
  - Max nesting depth: 4
  - Max parameters: 4
  - No unused vars (except `_` prefix)

- **Prettier** for formatting
- Lint + tests must pass before merge

## TDD / Test-first ✅

- Write test (or skeleton + failing expectation) **before** implementation
- **Coverage achieved: 80%+**

---

# 3. Backend & Data Layer

## 3.1 Stack

- **AWS Lambda** (Node.js + TypeScript)
- **AWS Amplify v2** (hosting + orchestration)
- **Amplify Data (GraphQL)**
  - No DataStore
  - Direct GraphQL operations

---

## 3.2 Data Modeling ✅ IMPLEMENTED

GraphQL schema is defined via Amplify Data style:

```ts
const schema = a.schema({
  UserProfile: a.model({
    experiences: a.hasMany('Experience', 'userId'),
    // ...
  }),
  // ...
});
```

**Implemented Models (9):**

- ✅ `UserProfile` - User identity, values, goals, strengths
- ✅ `Experience` - Work experiences with responsibilities, tasks, achievements
- ✅ `STARStory` - STAR methodology stories linked to experiences
- ✅ `PersonalCanvas` - 9-section Business Model Canvas for user
- ✅ `CVDocument` - Generated CV documents
- ✅ `JobDescription` - Job postings with parsed fields
- ✅ `Company` - Company information + analysis
- ✅ `CompanyCanvas` - Company Business Model Canvas (EPIC 5B)
- ✅ `MatchingSummary` - Job-user fit analysis (EPIC 5C)

**Planned Models (3):**

- ❌ `CoverLetter` - Cover letter documents (EPIC 6)
- ✅ `SpeechBlock` - Speech/pitch content (EPIC 4)

**Authorization:**

- All models use `authorization((allow) => [allow.owner()])` - owner-based access only

---

## 3.3 Data Access Pattern ✅ IMPLEMENTED

**Repository Pattern:**

- Repositories in `src/data/repositories/`
- Type-safe wrappers around GraphQL operations
- Mapping between GraphQL responses & domain types

**Implemented Repositories:**

- ✅ `userProfileRepository.ts`
- ✅ `experienceRepository.ts`
- ✅ `starStoryRepository.ts`
- ✅ `personalCanvasRepository.ts`
- ✅ `cvDocumentRepository.ts`
- ✅ `jobDescriptionRepository.ts`
- ✅ `companyRepository.ts`
- ✅ `companyCanvasRepository.ts`
- ✅ `matchingSummaryRepository.ts`

**Composable Layers:**

1. **Application Layer** (`src/application/`):
   - Single-entity CRUD operations
   - Examples: `useUserProfile(id)`, `useExperience(id)`, `useSTARStory(id)`
   - Direct repository usage

2. **Workflow Layer** (`src/composables/`):
   - Multi-step workflows
   - Examples: `useCvUploadWorkflow()`, `useStoryEditor()`, `useJobAnalysis()`
   - Orchestrates multiple repositories and AI operations

---

# 4. Authentication & Authorization

## Auth Provider

- **Amazon Cognito** (via Amplify)

## Login

- Email/password
- Google login planned later

## User linkage

- On first login:
  - Create a **UserProfile** tied to Cognito `sub`
  - `UserProfile.userId === Cognito sub`

## Access Control

- **Owner-based authorization** at GraphQL level
- Users can only read/write their own data
- No cross-user access in MVP

---

# 5. AI Integration Architecture ✅ PARTIAL (7/17 operations)

## Architecture Summary

- **One Lambda per AI operation**
  (aligned with AI Interaction Contract)

**Implemented Operations (7):**

1. ✅ `ai.parseCvText` - Extract profile from CV text
2. ✅ `ai.extractExperienceBlocks` - Extract experiences from CV
3. ✅ `ai.generatePersonalCanvas` - Generate 9-section BMC
4. ✅ `ai.generateStarStory` - Generate STAR stories
5. ✅ `ai.generateAchievementsAndKpis` - Generate KPIs from story
6. ✅ `ai.generateCv` - Generate markdown CV
7. ✅ `ai.parseJobDescription` - Parse job posting

**Planned Operations (7):**

- ✅ `ai.generateSpeech` (EPIC 4)
- ❌ `ai.analyzeCompanyInfo` (EPIC 5B)
- ✅ `ai.generateCompanyCanvas` (EPIC 5B)
- ✅ `ai.generateMatchingSummary` (EPIC 5C)
- ❌ `ai.generateCoverLetter` (EPIC 6)

Frontend **never** calls AI providers directly.

---

## 5.1 Lambda Responsibilities

Each AI Lambda:

1. Receives typed JSON payload
2. Validates input schema
3. Calls AI provider with predefined prompts
4. Validates output against schema
   - If invalid:
     - Attempt recovery (re-prompt with schema constraints)
     - If still invalid: return error

5. Returns:
   - `success: true` + data
   - OR `success: false` + structured error

---

## 5.2 Error Contract

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Failure

```json
{
  "success": false,
  "error": {
    "code": "AI_SCHEMA_ERROR" | "AI_PROVIDER_ERROR" | "AI_TIMEOUT",
    "message": "User-facing message",
    "details": "Optional tech info"
  }
}
```

---

# 6. CI / CD

## CI: GitHub Actions

### On each PR to `main`:

- Install dependencies
- Run lint
- Run Vitest (unit + component)
- Run Playwright E2E smoke suite
- Check coverage ≥ 80%

### Merge is blocked if:

- Lint fails
- Tests fail
- Coverage < 80%

---

## Deployment

- GitHub Actions **does not** deploy
- Deployments handled via **Amplify Hosting**
  - Auto build + deploy prod on merge to `main`

---

# 7. Testing Strategy ✅ COMPREHENSIVE

## 7.1 Unit & Component Tests ✅

- **Vitest** + **@nuxt/test-utils**
- **975 tests** across 94 files
- Coverage: domain, services, composables, repositories
- Component tests with Nuxt UI stub patterns

## 7.2 E2E Tests ✅

- **Playwright**
- **89 tests** across 9 test suites:
  - Smoke tests (3)
  - Home page (2)
  - Profile pages (8)
  - Experiences (11)
  - Stories (29) - most comprehensive
  - Canvas (11)
  - CV upload (10)
  - CV management (14)
  - Jobs (1 comprehensive flow)

**Full flow coverage:**

- ✅ Create profile → Add experience → Generate stories → Generate canvas
- ✅ Upload CV → Parse → Import experiences
- ✅ Upload job → Parse → Edit job details
- ✅ Generate CV → Edit → Print

## 7.3 AI Testing ✅

- **31 sandbox tests** for AI operations
- Uses **fake AI provider** for deterministic responses
- Avoids cost & flakiness in CI

**Environment flag:**

```
FAKE_AI_PROVIDER=true  # for testing
```

**Total Test Count:** 1095 tests (975 unit + 31 sandbox + 89 E2E)

---

# 8. UI / UX Conventions

## Layout

- Sidebar navigation (Dashboard, Profile, Jobs, Applications, Speech)
- Topbar with:
  - Environment indicator
  - User menu
  - Dark mode toggle

## Dark Mode

- Enabled from the start
- Tailwind + Nuxt UI theming

## Components

- Prefer Nuxt UI (`<UCard>`, `<UForm>`, `<UTable>`)
- Custom components only when necessary (e.g., AI chat panel)

## Tailwind

- Start with default config
- Add tokens incrementally

---

# 9. Project Structure (Nuxt) ✅ IMPLEMENTED

**Configuration:** We use `srcDir: 'src/'` in `nuxt.config.ts` to organize all application code under `src/`.

```
project-root/
├── src/                           # All application code (srcDir)
│   ├── app.vue                   # Root Nuxt component
│   │
│   ├── pages/                    # File-based routing (18+ pages) ✅
│   │   ├── index.vue             # Dashboard hub
│   │   ├── login.vue             # Auth page
│   │   │
│   │   ├── profile/              # Profile & Identity (EPIC 1A, 1B)
│   │   │   ├── index.vue         # Profile summary hub
│   │   │   ├── full.vue          # Full profile editor
│   │   │   ├── cv-upload.vue     # CV upload wizard
│   │   │   ├── experiences/
│   │   │   │   ├── index.vue     # Experience list
│   │   │   │   ├── [id].vue      # Experience editor
│   │   │   │   └── [experienceId]/
│   │   │   │       └── stories/
│   │   │   │           ├── index.vue            # Per-experience stories
│   │   │   │           └── [storyId].vue        # Story editor (3 modes)
│   │   │   ├── stories/
│   │   │   │   └── index.vue     # Global story library
│   │   │   └── canvas/
│   │   │       └── index.vue     # Personal canvas (EPIC 1B)
│   │   │
│   │   ├── cv/                   # CV Generation (EPIC 3, 3B)
│   │   │   ├── index.vue         # CV list
│   │   │   ├── new.vue           # CV generator wizard
│   │   │   └── [id]/
│   │   │       ├── index.vue     # CV editor (markdown split-view)
│   │   │       └── print.vue     # Print layout (A4)
│   │   │
│   │   ├── jobs/                 # Job Analysis (EPIC 5A) ✅
│   │   │   ├── index.vue         # Job list
│   │   │   ├── new.vue           # Job upload
│   │   │   └── [jobId].vue       # Job detail editor (5 tabs)
│   │   │
│   │   ├── companies/            # Company Analysis (EPIC 5B) ❌
│   │   │   └── (planned)
│   │   │
│   │   ├── matching/             # Matching Engine (EPIC 5C) ✅
│   │   │   └── (planned)
│   │   │
│   │   └── applications/         # Tailored Materials (EPIC 6) ❌
│   │       └── (planned)
│   │
│   ├── components/               # Auto-imported Vue components ✅
│   │   ├── ExperienceForm.vue    # Reusable experience CRUD
│   │   ├── ExperienceCard.vue
│   │   ├── StoryBuilder.vue      # 3-mode story creation
│   │   ├── StoryForm.vue         # STAR form fields
│   │   ├── StoryList.vue
│   │   ├── StoryCard.vue
│   │   ├── StoryViewModal.vue
│   │   ├── TagInput.vue          # Reusable tag editor
│   │   ├── AchievementsKpisPanel.vue
│   │   ├── PersonalCanvasComponent.vue
│   │   ├── CanvasSectionCard.vue
│   │   ├── ItemCard.vue
│   │   ├── ConfirmModal.vue
│   │   ├── UnsavedChangesModal.vue
│   │   │
│   │   ├── cv/                   # CV-specific components
│   │   │   ├── ExperiencePicker.vue
│   │   │   ├── GeneratingStep.vue
│   │   │   ├── UploadStep.vue
│   │   │   ├── ParsingStep.vue
│   │   │   ├── ProfilePreview.vue
│   │   │   ├── ExperiencesPreview.vue
│   │   │   ├── ImportSuccess.vue
│   │   │   └── (9 total)
│   │   │
│   │   ├── job/                  # Job-specific components
│   │   │   ├── JobCard.vue
│   │   │   └── JobUploadStep.vue
│   │   │
│   │   └── profile/              # Profile-specific components
│   │       ├── FullForm.vue
│   │       ├── SummaryCard.vue
│   │       └── section/
│   │
│   ├── composables/              # Workflow orchestration composables ✅
│   │   ├── useAuthUser.ts
│   │   ├── useCvUploadWorkflow.ts
│   │   ├── useCvParsing.ts
│   │   ├── useExperienceImport.ts
│   │   ├── useProfileMerge.ts
│   │   ├── useJobAnalysis.ts
│   │   ├── useJobUpload.ts
│   │   ├── useCvGenerator.ts
│   │   ├── useCvDocuments.ts
│   │   ├── useStoryList.ts
│   │   ├── useStoryEditor.ts
│   │   ├── useStoryEnhancer.ts
│   │   └── useBreadcrumbMapping.ts
│   │
│   ├── application/              # Entity-level CRUD composables ✅
│   │   ├── useAiOperations.ts
│   │   ├── useUserProfile.ts
│   │   ├── useExperience.ts
│   │   ├── useSTARStory.ts
│   │   ├── usePersonalCanvas.ts
│   │   ├── useCVDocument.ts
│   │   ├── useJobDescription.ts
│   │   ├── useCompany.ts
│   │   ├── useStoryEngine.ts
│   │   └── useCanvasEngine.ts
│   │
│   ├── data/                     # Data layer (repositories) ✅
│   │   └── repositories/
│   │       ├── userProfileRepository.ts
│   │       ├── experienceRepository.ts
│   │       ├── starStoryRepository.ts
│   │       ├── personalCanvasRepository.ts
│   │       ├── cvDocumentRepository.ts
│   │       ├── jobDescriptionRepository.ts
│   │       └── companyRepository.ts
│   │
│   ├── domain/                   # Domain models & services ✅
│   │   ├── models/
│   │   └── services/
│   │
│   ├── types/                    # TypeScript type definitions ✅
│   │   ├── userProfile.ts
│   │   ├── experience.ts
│   │   ├── story.ts
│   │   ├── canvas.ts
│   │   ├── cvDocument.ts
│   │   ├── jobDescription.ts
│   │   └── (domain types)
│   │
│   └── tests/                    # Vitest tests (975 tests) ✅
│       ├── unit/                 # Unit tests
│       ├── integration/          # Integration tests
│       └── sandbox/              # AI operation tests (31 tests)
│
├── test/                         # E2E tests (outside src)
│   └── e2e/                      # Playwright tests (89 tests) ✅
│       ├── smoke.spec.ts
│       ├── index-page.spec.ts
│       ├── profile-page.spec.ts
│       ├── experiences.spec.ts
│       ├── stories.spec.ts       # 29 tests (most comprehensive)
│       ├── canvas-flow.spec.ts
│       ├── cv-upload-flow.spec.ts
│       ├── cv-management.spec.ts
│       ├── jobs-flow.spec.ts
│       ├── auth.setup.ts
│       └── fixtures/
│
├── amplify/                      # AWS Amplify backend ✅
│   ├── backend.ts
│   ├── auth/
│   │   └── resource.ts           # Cognito configuration
│   └── data/
│       └── resource.ts           # GraphQL schema (7 models)
│
├── i18n/                         # Internationalization ✅
│   └── locales/
│       └── en.json               # English translations
│
├── public/                       # Static assets
│   └── robots.txt
│
├── docs/                         # Project documentation ✅
│   ├── Tech_Fundation_Specs.md   # This file
│   ├── Conceptual_Data_Model.md
│   ├── Component_Page_Mapping.md
│   ├── High_Level_Architecture.md
│   ├── High_Level_Navigation.md
│   ├── AI_Interaction_Contract.md
│   ├── EPIC_Roadmap.md
│   ├── E2E_Testing_Setup_Summary.md
│   └── Product_Description.md
│
├── nuxt.config.ts                # Nuxt configuration ✅
├── playwright.config.ts          # Playwright configuration ✅
├── eslint.config.mjs            # ESLint configuration ✅
├── tsconfig.json                # TypeScript configuration ✅
└── package.json                 # Dependencies & scripts ✅
```

**Key Points:**

- ✅ `srcDir: 'src/'` tells Nuxt all app code is in `src/`
- ✅ Components, composables auto-imported
- ✅ `@amplify` alias for backend types
- ✅ Repository pattern in `data/repositories/`
- ✅ Two-layer composable architecture (application + workflow)
- ✅ Domain-driven design with `domain/` and `application/` layers
- ✅ i18n with all text via `t('key.path')`
- ✅ Comprehensive testing (1095 tests total)

---

# 10. Error Handling

## Principles

- Clear, human-readable errors
- No silent failures
- Retry when possible

## Frontend Pattern

For each AI action:

- Show loading state
- On error:
  - `<UAlert color="red">`
  - Example:
    **“We couldn’t process this request right now. Please try again.”**
  - Retry button

## Error Types

- AI errors → “Problem contacting our AI assistant.”
- Validation errors → field-level messages
- Backend errors → “Something went wrong. Your data is safe.”

---

# 11. Logging & Observability

## Backend (Lambdas)

- `console.log` with:
  - Correlation ID
  - Input summary (no PII)
  - AI error details

- Logs in CloudWatch

## Frontend

- For MVP: no external tracking
- Future: add Sentry

---

# 12. Cost & Rate Limiting

## MVP

- No explicit rate limits
- Manual monitoring of AI usage

## Future

- AI usage counters per user
- Hard/soft usage limits
