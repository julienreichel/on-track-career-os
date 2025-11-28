# Tech Foundations Spec — v1.0

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

# 2. Frontend Stack

- **Framework:** Nuxt 3 (Vue 3, Vite)
- **Language:** TypeScript (strict mode)
- **UI Library:** Nuxt UI
- **Styling:** TailwindCSS
  - Minimal config; extend gradually

## State Management

- Prefer **composables** over global stores

## Testing

- **Vitest**: unit + component tests
- **nuxt/test-utils** or **@vue/test-utils** for component tests
- **Playwright**: E2E tests

## Linting & Formatting

- **ESLint** strict rules:
  - Cyclomatic complexity limits
  - Max function length (optional)

- **Prettier** for formatting
- Lint + tests must pass before merge

## TDD / Test-first

- Write test (or skeleton + failing expectation) **before** implementation
- **Coverage target: 80%+**

---

# 3. Backend & Data Layer

## 3.1 Stack

- **AWS Lambda** (Node.js + TypeScript)
- **AWS Amplify v2** (hosting + orchestration)
- **Amplify Data (GraphQL)**
  - No DataStore
  - Direct GraphQL operations

---

## 3.2 Data Modeling

GraphQL schema is defined via Amplify Data style:

```ts
const schema = a.schema({
  UserProfile: a.model({
    experiences: a.hasMany('Experience', 'userId'),
  }),
  // ...
});
```

- Relationships mirror the CDM:
  - UserProfile
  - Experience
  - STARStory
  - JobDescription
  - JobRoleCard
  - Company
  - CompanyCanvas
  - MatchingSummary
  - CVDocument
  - CoverLetter
  - KPISet
  - InterviewSession

---

## 3.3 Data Access Pattern

- Create **model definition files** in `models/`
- Implement **repository pattern**:

Examples:

- `repositories/userProfileRepository.ts`
- `repositories/experienceRepository.ts`

Repositories handle:

- Type safety
- Mapping between GraphQL responses & domain types
- Optional access control checks

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

# 5. AI Integration Architecture

## Architecture Summary

- **One Lambda per AI operation**
  (aligned with AI Interaction Contract)

Example:

- `aiGeneratePersonalCanvas`
- `aiParseJobDescription`

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

# 7. Testing Strategy

## 7.1 Unit & Component Tests

- Vitest + nuxt/test-utils
- Snapshot tests for key components

## 7.2 E2E Tests

- Playwright
- Full flow coverage:
  - Create profile → Add experience → Add job → Generate CV

## 7.3 AI Testing

- Use a **fake AI provider**:
  - Deterministic responses
  - Avoids cost & flakiness

Environment flag:

```
FAKE_AI_PROVIDER=true
```

---

# 8. UI / UX Conventions

## Layout

- Sidebar navigation (Dashboard, Profile, Jobs, Applications, Interview)
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

# 9. Project Structure (Nuxt)

**Configuration:** We use `srcDir: 'src/'` in `nuxt.config.ts` to organize all application code under `src/`.

```
project-root/
├── src/                           # All application code (srcDir)
│   ├── app.vue                   # Root Nuxt component
│   │
│   ├── pages/                    # File-based routing (auto-imported)
│   │   ├── index.vue
│   │   ├── profile/
│   │   │   ├── index.vue
│   │   │   ├── experiences.vue
│   │   │   ├── experiences/[id].vue
│   │   │   ├── star/[id].vue
│   │   │   └── canvas.vue
│   │   ├── jobs/
│   │   │   ├── index.vue
│   │   │   ├── new.vue
│   │   │   └── [id]/role-card.vue
│   │   ├── companies/
│   │   │   ├── index.vue
│   │   │   ├── new.vue
│   │   │   └── [id]/canvas.vue
│   │   ├── matching/
│   │   │   └── [jobId]-[companyId].vue
│   │   ├── applications/
│   │   │   ├── cv.vue
│   │   │   ├── letter.vue
│   │   │   ├── speech.vue
│   │   │   └── kpis.vue
│   │   └── interview/
│   │       ├── questions.vue
│   │       └── simulator.vue
│   │
│   ├── components/               # Auto-imported Vue components
│   │   ├── layout/
│   │   │   ├── AppSidebar.vue
│   │   │   └── AppTopbar.vue
│   │   ├── profile/
│   │   │   ├── ProfileForm.vue
│   │   │   ├── ExperienceList.vue
│   │   │   ├── ExperienceForm.vue
│   │   │   └── StarStoryChat.vue
│   │   ├── canvas/
│   │   │   ├── PersonalCanvasBoard.vue
│   │   │   └── CompanyCanvasBoard.vue
│   │   ├── jobs/
│   │   │   ├── JobForm.vue
│   │   │   └── JobRoleCardView.vue
│   │   ├── companies/
│   │   │   └── CompanyForm.vue
│   │   ├── matching/
│   │   │   └── MatchingSummaryView.vue
│   │   ├── applications/
│   │   │   ├── CvEditor.vue
│   │   │   ├── LetterEditor.vue
│   │   │   ├── SpeechEditor.vue
│   │   │   └── KpiList.vue
│   │   └── interview/
│   │       ├── QuestionCategoryList.vue
│   │       └── InterviewChat.vue
│   │
│   ├── composables/              # Auto-imported composables
│   │   ├── useUserProfile.ts
│   │   ├── useExperienceStore.ts
│   │   ├── useStoryEngine.ts
│   │   ├── useCanvasEngine.ts
│   │   ├── useJobAnalysis.ts
│   │   ├── useMatchingEngine.ts
│   │   ├── useTailoringEngine.ts
│   │   ├── useInterviewEngine.ts
│   │   └── useAiClient.ts
│   │
│   ├── data/                     # Data layer (repositories, schemas)
│   │   ├── amplify/
│   │   │   └── schema.ts        # Re-export Amplify schema types
│   │   └── repositories/
│   │       ├── userProfileRepository.ts
│   │       ├── experienceRepository.ts
│   │       └── ...
│   │
│   ├── domain/                   # Domain logic & business rules
│   │   ├── models/
│   │   └── services/
│   │
│   ├── application/              # Application services & use cases
│   │   └── services/
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── userProfile.ts
│   │   ├── experience.ts
│   │   ├── job.ts
│   │   ├── company.ts
│   │   ├── canvas.ts
│   │   ├── matching.ts
│   │   ├── documents.ts
│   │   └── interview.ts
│   │
│   └── tests/                    # Vitest unit & component tests
│       ├── unit/
│       └── components/
│
├── amplify/                      # AWS Amplify backend (outside src)
│   ├── backend.ts
│   ├── auth/
│   │   └── resource.ts
│   └── data/
│       └── resource.ts          # GraphQL schema definitions
│
├── plugins/                      # Nuxt plugins (outside src)
│   └── 01.amplify-apis.client.ts
│
├── public/                       # Static assets (served at root)
│   └── robots.txt
│
├── docs/                         # Project documentation
│
├── nuxt.config.ts               # Nuxt configuration (srcDir: 'src/')
├── tsconfig.json                # TypeScript project references
└── package.json
```

**Key Points:**

- `srcDir: 'src/'` tells Nuxt all app code is in `src/`
- Components, composables, and utils are auto-imported
- `@amplify` alias configured for clean imports to backend types
- Repository pattern in `data/repositories/` for GraphQL operations
- Domain-driven design with `domain/` and `application/` layers

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
