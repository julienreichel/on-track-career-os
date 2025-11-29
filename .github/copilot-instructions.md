# AI Career OS - Copilot Instructions

## Project Overview

**Your AI Career OS** is an AI-powered career development platform built with Nuxt 3 + AWS Amplify Gen2. The system guides users through self-discovery, job analysis, and application material generation using 17 structured AI operations with strict JSON schemas.

## Architecture & Key Patterns

### Stack

- **Frontend**: Nuxt 4 + TypeScript (strict) + Nuxt UI + Tailwind CSS
- **Backend**: AWS Amplify Gen2 (GraphQL) + Lambda functions
- **Auth**: Cognito with owner-based authorization
- **State**: Composables over global stores (use `useUserProfile()`, `useExperienceStore()`, etc.)
- **AI Integration**: One Lambda per AI operation, strict JSON I/O validation
- **Project Structure**: `srcDir: 'src/'` - all app code in `src/`, infrastructure outside

### Data Model Philosophy

The system uses a **five-domain conceptual data model** defined in `amplify/data/resource.ts`:

1. **User Identity**: `UserProfile`, `PersonalCanvas`, experiences
2. **Experience & Stories**: `Experience`, `STARStory` with STAR methodology
3. **Job & Company**: `JobDescription`, `JobRoleCard`, `Company`, `CompanyCanvas`
4. **Application Materials**: `CVDocument`, `CoverLetter`, `SpeechBlock`, `KPISet`
5. **Interview**: `InterviewQuestionSet`, `InterviewSession`

All entities use **owner-based authorization** - users can only access their own data. Always use `authorization((allow) => [allow.owner()])` on models.

### AI Operations Contract

17 AI operations defined in `docs/AI _Interaction_Contract.md`:

- **Never return free-form text** - all AI outputs must be structured JSON
- Each operation has: system prompt (constant) + user prompt (data-injected) + input schema + output schema + fallback strategy
- Lambda error contract: `{ success: boolean, data?: {}, error?: { code, message, details } }`
- AI operations include: `ai.parseJobDescription`, `ai.generatePersonalCanvas`, `ai.generateStarStory`, `ai.generateMatchingSummary`, etc.

### Key Relationships & Data Flows

```
UserProfile → Experiences → STARStories → ApplicationMaterials
     ↓
PersonalCanvas (auto-generated, editable)
     ↓
MatchingSummary (User ↔ Job ↔ Company)
     ↓
CVDocument/CoverLetter/KPISet (tailored to job)
```

## Development Workflows

### Setup & Running

```bash
npm install              # Install dependencies
npm run dev             # Start Nuxt dev server (localhost:3000)
npm run build           # Production build
npm run preview         # Preview production build
```

### Testing Requirements (TDD Expected)

- **Vitest**: Unit + component tests (`src/tests/`)
- **Playwright**: E2E smoke tests
- **Coverage target**: 80%+ required before merge
- Write tests BEFORE implementation (test-first approach documented in `docs/Tech_Fundation_Specs.md`)
- Tests must pass before merge to `main`

### Branching & Deployment

- **Trunk-Based Development**: Short-lived `feature/*` branches → PR to `main`
- Amplify auto-deploys `main` to production
- No long-lived `develop` or `release` branches

### Linting & Code Quality

- ESLint strict mode + Prettier formatting
- **Code Quality Enforced**:
  - Max cyclomatic complexity: 16 (limit function complexity)
  - Max nesting depth: 4 levels (prevent deeply nested code)
  - Max lines per function: 100 (keep functions focused)
  - Max function parameters: 4 (use objects for more params)
  - No magic numbers (except 0, 1, -1)
- TypeScript strict mode always on
  - No `any` types allowed (`@typescript-eslint/no-explicit-any: error`)
  - Use type imports (`import type { ... }`)
  - No unused vars except those starting with `_`
- Vue best practices enforced:
  - Max 3 attributes per line (single-line), 1 per line (multi-line)
  - Kebab-case component names in templates
  - Default props required
  - Prop types required
- Run `npm run lint` before committing
- **Test files have relaxed rules**: max 500 lines, complexity 30, allow `any` types
- **Git Commits**: MUST follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  - Format: `<type>(<scope>): <description>`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
  - Example: `feat(auth): add login page with Amplify UI`
  - Example: `fix(i18n): correct French translation keys`
  - Example: `refactor(layout): replace CSS classes with Nuxt UI components`

## Critical Conventions

### **MANDATORY: Internationalization (i18n)**

🚨 **NO HARD-CODED STRINGS ALLOWED** 🚨

- **ALL user-facing text MUST use i18n** - no exceptions
- Translation files: `i18n/locales/{locale}.json`
- Use `t('key.path')` for all strings in templates and code
- Example: `{{ t('app.title') }}` NOT `"AI Career OS"`
- Example: `t('errors.notFound')` NOT `"Not found"`
- Add new translation keys to `i18n/locales/en.json` when adding features
- Use nested keys for organization: `features.profile.title`

**How to use i18n:**

```vue
<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<template>
  <h1>{{ t('page.title') }}</h1>
  <p>{{ t('page.description') }}</p>
</template>
```

### **MANDATORY: Nuxt UI Components**

🚨 **USE NUXT UI COMPONENTS - NO RAW CSS CLASSES** 🚨

- **NEVER write raw Tailwind CSS classes** unless absolutely necessary
- Use Nuxt UI semantic components for ALL UI elements
- Available components: `UButton`, `UCard`, `UContainer`, `UHeader`, `UMain`, `UPage`, `UPageHeader`, `UPageBody`, `UPageCard`, etc.
- Example: Use `<UButton>` NOT `<button class="px-4 py-2 bg-blue-500">`
- Example: Use `<UCard>` NOT `<div class="rounded-lg shadow-md p-4">`
- Only use Tailwind classes for: spacing adjustments, custom layouts not covered by Nuxt UI
- Refer to [Nuxt UI documentation](https://ui.nuxt.com) for available components

**Component Priority:**

1. First choice: Nuxt UI component (e.g., `<UButton>`, `<UCard>`)
2. Second choice: Semantic HTML with minimal utility classes
3. Last resort: Custom CSS (only if Nuxt UI doesn't provide the component)

## Critical Conventions

### Project Structure

- **Use `srcDir: 'src/'`** - All application code lives in `src/` directory (configured in `nuxt.config.ts`)
- `src/app.vue` - Root Nuxt component
- `src/pages/` - File-based routing (auto-imported)
- `src/components/` - Auto-imported Vue components
- `src/composables/` - Auto-imported composables
- `src/data/` - Data layer (repositories, schema re-exports)
- `src/domain/` - Domain logic & business rules
- `src/application/` - Application services & use cases
- `src/types/` - TypeScript type definitions
- `amplify/` - Backend infrastructure (outside src)
- `plugins/` - Nuxt plugins (outside src)

### Component & Composable Patterns

- **Pages** in `src/pages/` follow domain structure: Profile / Jobs & Companies / Applications / Interview Prep
- **Components** in `src/components/` map to CDM entities (see `docs/Component_Page_Mapping.md`)
- **Composables** provide state + logic: `useUserProfile()`, `useStoryEngine()`, `useCanvasEngine()`, `useMatchingEngine()`, `useTailoringEngine()`, `useInterviewEngine()`, `useAiClient()`
- Prefer composables over Vuex/Pinia stores

### Data Access Pattern

- Implement **repository pattern** for GraphQL operations
- Create repositories in `src/data/repositories/` (e.g., `userProfileRepository.ts`, `experienceRepository.ts`)
- Repositories handle: type safety, GraphQL response mapping, access control checks
- Re-export Amplify schema types from `src/data/amplify/schema.ts` using `@amplify` alias

### Naming Conventions

- AI operations: `ai.operationName` (camelCase)
- JSON output: `snake_case`
- Content blocks: arrays only, no raw paragraphs
- GraphQL models: PascalCase, relationships use `hasMany`, `hasOne`, `belongsTo`
- Path aliases: `@amplify` for Amplify backend types (configured in `nuxt.config.ts`)

### Error Handling

- No silent errors - always provide clear user feedback
- Use structured AI error contract with codes: `AI_SCHEMA_ERROR`, `AI_PROVIDER_ERROR`, `AI_TIMEOUT`
- Frontend never calls AI providers directly - always through Lambda

## Key Documentation References

- **Architecture**: `docs/High_Level_Architecture.md`
- **AI Contract**: `docs/AI_Interaction_Contract.md`
- **Data Model**: `docs/Conceptual_Data_Model.md` + `amplify/data/resource.ts`
- **Component Mapping**: `docs/Component_Page_Mapping.md`
- **Tech Specs**: `docs/Tech_Fundation_Specs.md`
- **EPIC Roadmap**: `docs/EPIC_Roadmap.md`
- **Product Vision**: `docs/Product_Description.md`
- **Knowledge Base**: `KNOWLEDGE_BASE.md` (high-level summary)

## Current State & MVP Focus

**MVP Goal**: Build core job search workflow → understand user → understand job → generate materials

The codebase is in **initial setup phase**:

- Amplify backend structure defined (`amplify/backend.ts`, auth, data schema)
- Full GraphQL schema implemented with 25+ entities
- Project uses `srcDir: 'src/'` for clean separation of app code and infrastructure
- Frontend components/pages/composables structure ready but empty
- Documentation-complete, code-in-progress

When implementing features:

1. Start with data models (already in `amplify/data/resource.ts`)
2. Create composables for state/logic
3. Build components following Nuxt UI patterns
4. Implement pages per `docs/Component_Page_Mapping.md`
5. Add AI Lambda functions for operations
6. Write tests FIRST

## Secrets & Environment

- AI provider keys: Amplify environment variables (separate dev/prod)
- CI secrets: GitHub Secrets
- Use fake AI provider for testing
