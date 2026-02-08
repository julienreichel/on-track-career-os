# Codebase Audit Report

Date: 2026-02-08
Scope: Repository audit following docs/Codebase_Audit.md

## 1) P0 Security & Privacy

1. Finding: Markdown rendering uses `v-html` without sanitization
severity: P0
category: 1.2 Rendering untrusted content (XSS risks)
location: src/components/MarkdownContent.vue
symptom: `marked()` output is injected via `v-html` without sanitization.
whyItMatters: User-generated markdown can contain HTML/JS payloads, enabling XSS in CV/cover letter views.
suggestedFix: Sanitize `marked()` output using `dompurify` (already in dependencies). Consider a strict allowlist, strip dangerous attributes, and disable raw HTML in marked if possible.
estimatedEffort: S
risk: high

2. Finding: Error logging may expose PII in client logs
severity: P0
category: 1.1 Sensitive data exposure
location: src/components/profile/FullForm.vue; src/components/onboarding/steps/OnboardingStepProfileBasics.vue; src/composables/useCvDocuments.ts; src/pages/applications/cover-letters/new.vue; src/pages/applications/cv/[id]/index.vue
symptom: Multiple `console.error(...)` calls log raw error objects during profile, CV, and cover letter flows.
whyItMatters: Error objects from GraphQL/AI services can include payloads (email, phone, raw CV/job text). This risks PII exposure in browser logs, support screenshots, and monitoring tooling.
suggestedFix: Centralize client logging with a redaction step. Log only a short error code/message and store detailed errors in a secure backend channel. Disable verbose logging in production builds.
estimatedEffort: M
risk: medium

3. Finding: No explicit restriction on raw HTML in markdown pipeline
severity: P1
category: 1.2 Rendering untrusted content (XSS risks)
location: src/components/MarkdownContent.vue
symptom: `marked()` is used with default options, which allow inline HTML in markdown.
whyItMatters: Even with sanitization, allowing raw HTML increases attack surface and maintenance burden.
suggestedFix: Configure `marked` to disallow raw HTML or use a markdown-it pipeline with explicit allowlist settings.
estimatedEffort: S
risk: medium

Note: No server-only secrets were observed in `runtimeConfig.public` in nuxt.config.ts during this audit.

## 2) P0 Data & GraphQL Performance

1. Finding: Global “fetch all pages” helper used in hot paths
severity: P0
category: 2.1 Forbidden / costly patterns
location: src/data/graphql/pagination.ts; src/domain/job-description/JobDescriptionRepository.ts; src/domain/company/CompanyRepository.ts; src/domain/user-profile/UserProfileRepository.ts
symptom: `fetchAllListItems` loads all pages for list queries with no paging or limits in UI flows.
whyItMatters: As data grows, these calls will become slow, expensive, and memory-heavy, especially for mobile clients.
suggestedFix: Add pagination in list views (cursor/limit). Keep `fetchAllListItems` only for explicit admin exports or background jobs.
estimatedEffort: M
risk: high

2. Finding: Large selection sets fetch full nested graphs
severity: P0
category: 2.1 Forbidden / costly patterns
location: src/domain/user-profile/UserProfileRepository.ts (getProgressSnapshot), src/domain/job-description/JobDescriptionRepository.ts (getWithRelations), src/domain/experience/ExperienceRepository.ts (listWithStories)
symptom: Selection sets pull multiple nested relationships with `.*` fields in a single request.
whyItMatters: Over-fetching increases payload size, latency, and can hit AppSync resolver limits. It also makes caching harder.
suggestedFix: Split into smaller, targeted queries, or introduce a lightweight “summary” selection set for dashboard usage. Consider GraphQL fragments for consistent shapes.
estimatedEffort: M
risk: high

3. Finding: “Fetch all then filter” for company matching
severity: P1
category: 2.1 Forbidden / costly patterns
location: src/domain/company/CompanyRepository.ts (findByNormalizedName)
symptom: Loads all companies for an owner, then filters client-side to find a match.
whyItMatters: O(n) scan and full dataset transfer on every match lookup; grows linearly with user data.
suggestedFix: Add a normalizedName index in the backend and query by normalized value, or maintain a server-side search endpoint.
estimatedEffort: M
risk: medium

## 3) P0 Reliability & Error Handling

1. Finding: Errors are swallowed in breadcrumb resolution
severity: P1
category: 3.1 Missing states (loading / empty / error)
location: src/composables/useBreadcrumbMapping.ts
symptom: Errors are logged and the UI silently falls back to IDs with no user-facing indicator.
whyItMatters: Users see confusing breadcrumb IDs; failures remain hidden and harder to diagnose.
suggestedFix: Provide a lightweight error indicator or fallback label ("Unknown") and surface a toast or banner when mapping fails.
estimatedEffort: S
risk: medium

2. Finding: Inconsistent error UX patterns across pages
severity: P1
category: 3.2 Inconsistent error UX
location: src/pages/applications/cv/new.vue; src/pages/applications/cover-letters/new.vue; src/pages/jobs/index.vue; src/pages/profile/experiences/index.vue
symptom: Some flows use toasts, others inline `UAlert`, and some only set error refs.
whyItMatters: Users get inconsistent feedback, and some errors are easy to miss.
suggestedFix: Define a single error display standard (e.g., inline `UAlert` for page-scoped errors + toast for actions). Encapsulate in a shared composable.
estimatedEffort: S
risk: low

## 4) P0 Architecture & Boundaries

1. Finding: UI layers call repositories/services directly
severity: P1
category: 4.1 Layering violations
location: src/pages/settings/cv/index.vue; src/pages/profile/experiences/index.vue; src/pages/profile/experiences/[experienceId]/stories/index.vue; src/components/cv/ExperiencePicker.vue
symptom: Pages/components import repositories and services directly.
whyItMatters: UI becomes tightly coupled to data access, making testing and refactors harder. Business logic leaks into views.
suggestedFix: Move data access into application-level composables/services, and keep pages as orchestration only.
estimatedEffort: M
risk: medium

2. Finding: Repeated form validation and error messages in multiple flows
severity: P2
category: 4.2 Single source of truth breaches
location: src/components/profile/FullForm.vue; src/components/onboarding/steps/OnboardingStepProfileBasics.vue; src/composables/useCvDocuments.ts
symptom: Similar validation patterns and error strings are duplicated in multiple UI flows.
whyItMatters: Increases drift risk and inconsistent validation rules.
suggestedFix: Centralize validation and message keys in a shared module and enforce via composables.
estimatedEffort: S
risk: low

## 5) P1 Dead Code & Duplication

1. Finding: Coverage artifacts checked into `src/coverage`
severity: P1
category: 5.1 Dead code
location: src/coverage/*
symptom: HTML/JS coverage output lives inside the production `src/` tree.
whyItMatters: Adds noise to the repo, risks accidental bundling, and complicates search results.
suggestedFix: Move coverage artifacts to `coverage/` only and add ignore rules for build tooling.
estimatedEffort: S
risk: low

2. Finding: Duplicate upload workflows
severity: P2
category: 5.2 Duplicated code (logic + UI)
location: src/composables/useJobUpload.ts; src/composables/useCompanyUpload.ts; src/composables/useCvUploadWorkflow.ts
symptom: Near-identical error handling and text sanitization patterns repeated across upload flows.
whyItMatters: Fixes and improvements require changes in multiple files.
suggestedFix: Extract shared upload workflow helpers (validation, error state, sanitization).
estimatedEffort: M
risk: low

## 6) P1 UI Consistency & Design System Compliance

1. Finding: Global markdown/print styles are custom and not tokenized
severity: P2
category: 6.1 Custom CSS / non-Nuxt UI patterns
location: src/assets/css/main.css
symptom: Large blocks of custom typography styles (`.doc-markdown`, `.doc-print`) bypass Nuxt UI theming.
whyItMatters: Visual drift and maintenance cost when the design system changes.
suggestedFix: Migrate key typography tokens to Nuxt UI theme config or central design tokens, keeping only minimal overrides.
estimatedEffort: M
risk: low

## 7) P1 Complexity Hotspots

1. Finding: Very large page and service files with multiple responsibilities
severity: P1
category: 7.1 Over-complex pages/components
location: src/pages/jobs/[jobId]/index.vue; src/components/profile/FullForm.vue; src/application/tailoring/useTailoredMaterials.ts; src/application/starstory/useStoryEngine.ts
symptom: Files exceed 400–900 lines and combine orchestration, data access, and presentation logic.
whyItMatters: Harder to test, debug, and onboard contributors.
suggestedFix: Extract domain logic into composables/services and split UI into subcomponents (page orchestrates, components render, composables own logic).
estimatedEffort: L
risk: medium

## 8) P1 i18n Readiness

1. Finding: Hard-coded error strings in composables
severity: P1
category: 8.1 Hard-coded strings
location: src/composables/useCvDocuments.ts; src/composables/useActiveJobsDashboard.ts
symptom: Error strings like "Missing user information" and "Unknown error occurred" are hard-coded in code.
whyItMatters: Blocks localization and creates inconsistent wording across the app.
suggestedFix: Move these strings into i18n keys and reference via `t()`.
estimatedEffort: S
risk: low

## 9) P2 Testing Health

1. Finding: Multiple skipped tests
severity: P2
category: 9.1 Skipped or flaky tests
location: test/unit/composables/useBreadcrumbMapping.spec.ts; test/e2e/11 - profile-page.spec.ts; test/e2e/21 - matching-summary-flow.spec.ts; test/e2e/23 - canvas-flow.spec.ts; test/e2e/31 - cover-letter-flow.spec.ts; test/e2e/32 - speech-flow.spec.ts; test/e2e/33 - tailored-materials-flow.spec.ts
symptom: Several unit and e2e tests are skipped with `test.skip`/`it.skip`.
whyItMatters: Reduces regression coverage for key onboarding, matching, and content flows.
suggestedFix: Convert skip conditions into proper test setup/fixtures and stabilize selectors.
estimatedEffort: M
risk: low

## 10) P2 Dependency & Build Hygiene

1. Finding: Test utilities included in runtime Nuxt modules
severity: P2
category: 10.1 Dependency bloat
location: nuxt.config.ts
symptom: `@nuxt/test-utils` and `@nuxt/test-utils/module` are included in `modules`, which affects runtime builds.
whyItMatters: Increases bundle size and may introduce unintended behavior in production.
suggestedFix: Remove test-utils from runtime modules and keep them only for test configuration.
estimatedEffort: S
risk: low

2. Finding: Coverage artifacts live under `src/` and are excluded via tsconfig only
severity: P2
category: 10.2 Build & runtime anti-patterns
location: src/coverage/*; nuxt.config.ts (tsConfig exclude)
symptom: Coverage artifacts are excluded from TS but still reside in `src/` and may be processed by tooling.
whyItMatters: Risk of accidental bundling or linting overhead.
suggestedFix: Move coverage outputs out of `src/` and update ignore rules.
estimatedEffort: S
risk: low

---

## Top 10 Refactor Backlog (P0 → P2)

1. Add pagination to list queries (`fetchAllListItems` in list pages).
2. Reduce heavy GraphQL selection sets in profile/job/experience queries.
3. Centralize client error logging with redaction.
4. Replace “fetch all then filter” in company matching with indexed query.
5. Establish a consistent error UX standard (toast vs inline).
6. Split the largest pages/services into smaller composables and UI components.
7. Remove test-utils from runtime Nuxt modules.

## Quick Wins (≤ 1h each)

1. Remove `@nuxt/test-utils` modules from runtime `nuxt.config.ts`.

## Big Rocks (multi-day)

1. Paginated data access across Job, Company, CV, and Profile lists (UI + GraphQL queries).
2. Rework heavy selection sets into targeted queries and fragments.
3. Refactor large pages/services into smaller composables and components.
4. Standardize error handling and logging (centralized error pipeline + UX pattern).
