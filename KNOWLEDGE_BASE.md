# Knowledge Base — On Track Career

**Purpose:** Core technical reference for understanding the project architecture, data model, and implementation patterns.

---

## 1. Global Context

**On Track Career** is a Nuxt 4 TypeScript application helping job seekers create targeted application materials through AI-powered analysis and generation. The system combines personal discovery (identity, skills, stories) with job analysis (company research, description parsing, matching) to generate customized CVs, cover letters, and speeches.

**Stack:** Nuxt 4 (TypeScript strict) + AWS Amplify Gen2 (GraphQL API, Lambda functions, Cognito auth) + Nuxt UI component library + PostHog analytics + Vitest/Playwright testing.

**Architecture:** Clean architecture with clear domain separation. All business logic in domain/application layers, UI components consume typed composables, GraphQL repositories handle data access, AI operations via Lambda functions with strict JSON contracts.

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────┐
│  UI Layer (Nuxt Pages + Components)         │  Vue 3 pages, Nuxt UI components
├─────────────────────────────────────────────┤
│  Composables Layer                          │  useUserProfile, useStoryEngine, etc.
├─────────────────────────────────────────────┤
│  Application Services Layer                 │  Business workflows, AI orchestration
├─────────────────────────────────────────────┤
│  Domain Layer                               │  Entities, value objects, rules
├─────────────────────────────────────────────┤
│  Data Repositories Layer                    │  GraphQL operations, type mapping
├─────────────────────────────────────────────┤
│  Backend (Amplify Gen2)                     │  GraphQL schema, Lambda AI ops
└─────────────────────────────────────────────┘
```

**Key Principles:**

- Domain-driven design with bounded contexts
- Repository pattern for data access
- Composables over Pinia stores (composition API native)
- Strict TypeScript (no `any` types)
- AI operations as Lambda functions with JSON I/O

---

## 3. Data Model (5 Domains)

### 3.1 Identity Domain

**UserProfile** — User identity, goals, contact info, profile photo  
**PersonalCanvas** — Personal Business Model Canvas (9 blocks)  
**Experience** — Work history entries with responsibilities, achievements

### 3.2 Experience Domain

**STARStory** — Achievement narratives (Situation, Task, Action, Result, KPIs)  
Linked to Experience (1-to-many), structured achievement tracking

### 3.3 Job Domain

**JobDescription** — Parsed job data (title, seniority, responsibilities, skills, benefits, culture)  
Status tracking (draft, active, closed), company relationship

### 3.4 Company Domain

**Company** — Company information (name, industry, size, markets)  
**CompanyCanvas** — Company Business Model Canvas (9 blocks)  
Research notes field for AI analysis input

### 3.5 Materials Domain

**CVDocument** — Generated CVs (markdown, template reference, experience selection)  
**CoverLetter** — Cover letters (markdown, job-targeted)  
**SpeechBlock** — Speech blocks (3 sections: pitch, story, why-me)  
**CVTemplate** — Markdown templates (system: 3 built-in, user: customizable)  
**CVSettings** — User CV defaults (template, sections, experiences)

### 3.6 Matching Domain

**MatchingSummary** — User-job fit analysis (score, strengths, gaps, recommendations)

### Authorization

All models: Owner-based auth via `authorization((allow) => [allow.owner()])`  
User-scoped data access enforced at GraphQL layer

---

## 4. Composables (State + Logic)

### Identity & Profile

`useUserProfile()` — Profile CRUD, photo upload, contact management  
`useCanvasEngine()` — Canvas generation, drag-drop editing, persistence  
`useExperience()` — Experience CRUD, timeline management

### Experience & Stories

`useStoryEngine()` — STAR story generation, achievement KPIs  
`useStoryList()` — List management, filtering, search  
`useStoryForm()` — Story editing, validation

### Job & Company

`useJobDescription()` — Job CRUD, PDF upload, AI parsing  
`useCompanies()` — Company CRUD, AI analysis  
`useCompanyCanvas()` — Company BMC generation

### Matching

`useMatchingEngine()` — Fit score calculation, recommendation generation

### Materials

`useCVGeneration()` — CV generation, template selection, experience filtering  
`useCoverLetterGeneration()` — Letter generation, job targeting  
`useSpeechGeneration()` — Speech block generation  
`useCVTemplates()` — Template library management  
`useCVSettings()` — User defaults management  
`useMaterialImprovementEngine()` — Shared C3 feedback/improve orchestration for CV + cover letter

### System

`useAuthUser()` — Authentication, user session  
`useUserProgress()` — 5-phase progress tracking, guidance inputs, unlocks  
`useGuidance()` — Route-level guidance resolver (banner / empty state / locked features)  
`useBadges()` — Badge eligibility + toast notifications  
`useActiveJobsDashboard()` — Active job states for dashboard  
`useBreadcrumbMapping()` — Dynamic breadcrumbs  
`useAnalytics()` — PostHog event capture + page naming
`useErrorDisplay()` — Page-level error state + i18n message keys + action toasts

### Onboarding Guidance Engine (Rule-based)

`src/domain/onboarding/progress.ts`  
- Computes `UserProgressState` across 5 phases.
- Defines gate completeness and missing keys (for example `jobUploaded`, `matchingSummary`).

`src/domain/onboarding/nextAction.ts`  
- Maps progress state to deterministic next route/action.
- Drives dashboard and onboarding recommendation continuity.

`src/domain/onboarding/guidanceCatalog.ts`  
- Maps `(routeKey, progress, context)` to UI guidance output:
  - banner
  - empty state
  - locked features
- Used by page-level guidance to keep messaging consistent across dedicated pages.

---

## 5. Pages & Navigation (4 Zones)

### Auth & Home

`/login` — Authentication  
`/` — Dashboard with active jobs, onboarding progress  
`/onboarding` — 4-step wizard (identity, canvas, stories, opportunities)

### Profile Zone

`/profile` — User profile summary  
`/profile/full` — Full profile editor  
`/profile/canvas` — Personal BMC generation and editing  
`/profile/experiences` — Experience list with timeline  
`/profile/experiences/:id/stories` — STAR stories for experience  
`/profile/stories` — All stories list  
`/profile/stories/new` — New story creation  
`/cv-upload` — Initial CV upload and parsing

### Jobs & Companies

`/jobs` — Job list with search, status filters  
`/jobs/:id` — 5-tab detail view (info, analysis, company, match, materials)  
`/jobs/:id/match` — Matching summary with fit score  
`/jobs/:id/application-strength` — Application strength evaluation with retryable error states  
`/companies` — Company list with search  
`/companies/:id` — Company detail with canvas

### Applications

`/applications/cv` — CV library  
`/applications/cv/new` — CV generation  
`/applications/cv/:id` — CV editor (markdown + preview)  
`/applications/cv/:id/print` — Print-optimized view  
`/applications/cover-letters` — Letter library  
`/applications/cover-letters/new` — Cover letter generation  
`/applications/cover-letters/:id` — Cover letter editor (markdown + C3 feedback/improve panel)  
`/applications/speech` — Speech library  
`/applications/speech/new` — Speech generation  
`/applications/speech/:id` — Speech editor

### Settings

`/settings/cv` — Template library (system + user templates)  
`/settings/cv/:id` — Template editor with markdown preview

---

## 6. AI Operations (14 Total)

All AI operations are Lambda functions with strict JSON I/O contracts:

**Input:** `{ operation: string, input: {...}, user_id: string }`  
**Output:** `{ success: boolean, data?: {...}, error?: { code, message, details } }`

### Categories

**Identity & Discovery (5):** parseCvText, extractExperienceBlocks, generatePersonalCanvas, generateStarStory, generateAchievementsAndKpis  
**Job & Company (3):** parseJobDescription, analyzeCompanyInfo, generateCompanyCanvas  
**Matching (1):** generateMatchingSummary  
**Materials (4):** generateCv, generateCoverLetter, generateSpeech, improveMaterial  
**Application Quality (1):** evaluateApplicationStrength

### Error Handling

Structured error codes remain backend-facing; frontend uses deterministic i18n keys for user messages.  
Current frontend pattern:
- `useErrorDisplay()` for page-level state and toasts
- `ErrorStateCard` for retryable page failures
- `logError()` / `logWarn()` for sanitized diagnostics only (no raw stack traces in UI)

---

## 7. Core Conventions

### TypeScript

- Strict mode, no `any` types
- Type imports only (`import type {...}`)
- Unused vars start with `_`
- Props interfaces for components

### Internationalization

- ALL text via `t('key.path')`
- No hard-coded strings
- Files in `i18n/locales/{locale}.json`

### Nuxt UI First

- Use Nuxt UI components before custom HTML/CSS
- Key components: UButton, UCard, UFormField, UInput, UTable, UModal, UToast, UIcon
- Composables: useToast(), useOverlay(), useFormField()

### Testing

- TDD: Write tests FIRST
- 80%+ coverage required
- Vitest (unit/integration), Playwright (E2E)
- Naming: `*.spec.ts`, `*.e2e.ts`

### Code Quality

- Complexity ≤16, nesting ≤4, function lines ≤100, params ≤4
- Repository pattern for data access
- Conventional commits: `feat|fix|docs|style|refactor|test|chore(scope): desc`

### Project Structure

- `srcDir: 'src/'` — All app code in src/
- `src/pages/` — File-based routing
- `src/components/` — Auto-imported UI components
- `src/composables/` — State + logic (auto-imported)
- `src/data/repositories/` — GraphQL operations
- `src/domain/` — Business entities and rules
- `src/application/` — Services and workflows
- `amplify/` — Backend (schema, AI ops, auth)

---

## 8. Development Workflow

### Setup

```bash
npm install
npx amplify sandbox  # Start local backend
npm run dev           # Start Nuxt dev server
```

### Testing

```bash
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
npm run test:coverage # Coverage report
```

### AI Development

1. Define JSON schema in `docs/AI_Interaction_Contract.md`
2. Create Lambda handler in `amplify/data/ai-operations/{operation}/handler.ts`
3. Register in `amplify/data/resource.ts`
4. Create repository in `src/data/repositories/`
5. Create service in `src/application/ai-operations/`
6. Expose via composable

---

## 9. Key Features

**Personal Discovery:** Profile creation, BMC generation, experience documentation, STAR story builder  
**Job Analysis:** PDF upload, AI parsing, company research, BMC generation  
**Matching:** Fit score (0-100), strengths/gaps analysis, tailoring recommendations  
**Material Generation:** Job-specific CVs, cover letters, speeches with markdown editing  
**Material Improvement (C3):** On-demand feedback + guided rewrite loop for tailored CV/cover letter  
**Customization:** Template library (3 system + user templates), CV defaults, section toggles  
**Onboarding:** 5-phase progress system, milestone badges, contextual guidance

---

**For Implementation Details:** See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)  
**For UI Mapping:** See [docs/Component_Page_Mapping.md](docs/Component_Page_Mapping.md)  
**For Architecture:** See [docs/High_Level_Architecture.md](docs/High_Level_Architecture.md)
