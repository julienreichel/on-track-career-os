## EPIC 6 — Tailored Application Materials

### Single Implementation Checklist (execution order)

Use this as the **one-page runbook** to implement EPIC 6 cleanly end-to-end (schemas → AI ops → domain → UI → tests). Align with existing Nuxt 3 + TS(strict) + Nuxt UI + Amplify Gen2 + AI-Operations patterns and strict schema validation.

---

### 0) Pre-flight

- [ ] Pull latest main; confirm existing flows work:
  - CV generation + editor + print
  - Cover letter generation + editor
  - Speech generation + editor
  - Job upload + parse
  - Matching summary generation + page

- [ ] Confirm “English-only” generation baseline (no language selectors).

---

## Phase 1 — Data model + persistence rules (job linking + overwrite)

### 1.1 Update GraphQL models (Amplify Gen2)

- [x] Add optional `jobId` (+ belongsTo relationship if used elsewhere) to:
  - `CVDocument`
  - `CoverLetter` (ensure it exists; otherwise create minimal model)
  - `SpeechBlock`

- [x] Keep owner-based authorization consistent across models.

### 1.2 Update repositories/services

- [x] Repository: include `jobId` field in CRUD mapping for each document type.
- [x] Service rule: **regenerate overwrites** existing record (same id), no versioning.

### 1.3 Tests

- [x] Vitest unit tests:
  - “saving tailored doc persists jobId”
  - “regenerate overwrites content (no new record)”
  - “generic doc keeps jobId undefined”

---

## Phase 2 — Shared tailoring context (frontend payload builder)

### 2.1 Create shared TailoringContext builder

- [x] Implement shared helper/composable:
  - takes **full objects**: `UserProfile`, `JobDescription`, `MatchingSummary`, optional `Company (summary only)`
  - enforces `language: "en"`
  - **limits company fields** (no CompanyCanvas, no rawNotes dump)

- [ ] Ensure CV/Letter/Speech flows reuse it (no duplication).

### 2.2 Tests

- [x] Vitest tests for builder:
  - minimal tailored payload
  - includes company summary when present
  - excludes canvas/large fields
  - fails/returns structured error when missing job or matchingSummary in tailored mode

---

## Phase 3 — AI Operations upgrades (reuse existing ops, add tailoring inputs)

### 3.1 Update AI op input schemas + types

- [ ] Extend inputs for:
  - `ai.generateCv`
  - `ai.generateCoverLetter`
  - `ai.generateSpeech`

- [ ] Add optional tailoring fields:
  - `jobDescription?: JobDescription`
  - `matchingSummary?: MatchingSummary`
  - `company?: CompanySummarySubset`
  - `language: "en"`

- [ ] Update shared types re-exported to frontend (single source of truth).

### 3.2 Update prompts (behavior)

- [ ] Tailoring definition encoded:
  - incorporate job keywords naturally (ATS)
  - select relevant expertise/stories
  - emphasize strengths aligned to job/company
  - **no hallucinated skills/claims**
  - company context = summary only (no canvas)

### 3.3 Fallback strategy (must be deterministic)

- [ ] If tailoring payload invalid/malformed:
  - either (preferred) drop tailoring block and generate generic
  - or return structured schema error
    Pick one approach and apply consistently across all 3 ops.

### 3.4 Tests

- [ ] Vitest Lambda/unit tests per op:
  - generic mode still works
  - tailored mode returns valid output (schema / markdown expectations)
  - company summary doesn’t break output
  - fallback behavior covered

- [ ] Sandbox E2E AI tests (if existing pattern):
  - one invocation per op in tailored mode

---

## Phase 4 — Tailored generation orchestration (composables)

### 4.1 Add “generateTailored\*ForJob” workflow methods

- [ ] Implement/extend composables to support:
  - generate/regenerate tailored CV for a Job
  - generate/regenerate tailored Cover Letter for a Job
  - generate/regenerate tailored Speech for a Job

- [ ] Each method:
  - receives full `job` + `matchingSummary`
  - loads optional company summary (if job has company)
  - builds payload via shared TailoringContext builder
  - calls the existing AI op
  - saves doc with `jobId` set
  - returns doc id for navigation

### 4.2 Tests

- [ ] Vitest composable tests:
  - calls correct AI op with tailored payload
  - persists jobId
  - overwrite rule respected

---

## Phase 5 — UI entry points (Job page + Match page)

### 5.1 Add “Application Materials” section at bottom

- [ ] On `/jobs/:jobId`:
  - render a Nuxt UI card with 3 actions: CV / Letter / Speech
  - if matching summary not available here, either:
    - fetch latest matching summary for this job, or
    - guide user to generate match first (pick MVP approach and document it)

- [ ] On `/jobs/:jobId/match`:
  - same card, using already-loaded matching summary

### 5.2 Navigation behavior

- [ ] After success, route to existing pages:
  - `/cv/:id`
  - `/cover-letters/:id`
  - `/speech/:id`

- [ ] Keep existing routes; no new application routes.

### 5.3 Tests

- [ ] Nuxt component/page tests:
  - card renders on both pages
  - clicking each action triggers correct workflow method
  - error UI shown on failure

---

## Phase 6 — Document pages: backlink to Job + regenerate tailored

### 6.1 Add “Target job” banner

- [ ] On `/cv/:id`, `/cover-letters/:id`, `/speech/:id`:
  - if `jobId` present, show banner with job title + link back to `/jobs/:jobId`
  - show “Regenerate tailored” button (only when jobId exists)

### 6.2 Regenerate behavior

- [ ] Regenerate uses:
  - stored jobId → load job
  - load latest matching summary for that job (if not already stored/available)
  - optional company summary
  - call same AI op; overwrite same doc record

### 6.3 Tests

- [ ] Nuxt page tests:
  - banner visible when jobId exists, hidden otherwise
  - regenerate button conditional

- [ ] Vitest service/composable tests:
  - regenerate overwrites content (same id)

---

## Phase 7 — EPIC 6 single Playwright happy path (one test)

Create **one** E2E test that proves the whole EPIC:

- [ ] Setup fixture user with profile + experiences/stories (or use existing seed)
- [ ] Upload/create a Job
- [ ] Generate Matching Summary
- [ ] From `/jobs/:jobId/match`, click “Generate tailored cover letter”
- [ ] Assert navigation to cover letter page
- [ ] Assert:
  - content exists
  - job backlink is visible and points to `/jobs/:jobId`
  - (optional) content includes at least one keyword from job (light assertion, avoid brittle checks)

---

## Phase 8 — Documentation updates (done last, but required)

- [ ] Update **AI Interaction Contract** entries for the 3 ops to include tailoring inputs + fallback.
- [ ] Update Component→Page mapping with:
  - new “Application Materials” card on job + match pages
  - job backlink banner on document pages

- [ ] Confirm PROJECT_STATUS remains consistent with EPIC 6 progress.

---

### Exit criteria (EPIC done)

- [ ] Tailored CV/Letter/Speech can be generated from Job page and Match page.
- [ ] Documents persist `jobId` and show backlink.
- [ ] Regenerate overwrites (no duplicates).
- [ ] All tests green (Vitest + Playwright), schemas validated, no free-text leaks beyond existing markdown doc content.
