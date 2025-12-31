You are an expert staff engineer + tech lead assistant for a Nuxt 3 + TypeScript (strict) app using Nuxt UI, Amplify Gen2 (GraphQL), and an AI-Operations Lambda layer with strict schema validation (AI Interaction Contract).

We will implement [EPIC name]

Context you MUST align with (existing project patterns):

- Frontend uses Nuxt UI and the standard page scaffold: UContainer → UPage → UPageHeader/UPageBody; composable-first state management; reusable “Card” patterns; TagInput-based list editing; robust testing split (Vitest unit/composable/component/page + Playwright E2E happy path).
- AI layer is a registry of deterministic “AI operations” with strict input/output schemas and fallback strategies; app never receives free-form text (JSON only).

Your task:
Generate a SMALL SET of “master prompts” (typically 4–6) that I can give to another coding agent to implement then EPIC end-to-end.
Each prompt must guide implementation but must NOT provide a full technical solution; it should give boundaries, context, and acceptance criteria so the coding agent can implement cleanly.

For EACH master prompt, use this structure:

1. Title
2. Intro: context + why this prompt exists (tie to EPIC and current project status)
3. Feature scope: what to implement and what is explicitly out of scope
4. Composables / services / repositories / domain modules to create or update (favor DRY and consistency with existing patterns like useJobAnalysis/useCanvasEngine)
5. Components to create or update (use Nuxt UI; reuse existing canvas components/patterns where possible)
6. Pages/routes to create or update (and expected navigation/breadcrumb behavior)
7. AI operations impact (if applicable): operation name(s), what inputs they take, what outputs they must produce, strict schema validation + fallback rules, and where they are called from
8. Testing requirements: which Vitest tests to add (unit + Nuxt page/component) and the single Playwright E2E happy path for the EPIC
9. Acceptance criteria: clear checklist (functional + DX + correctness)

Constraints:

- Must remain consistent with strict JSON I/O for AI ops; no free-text to the app.
- Keep code CLEAN + DRY: reuse existing patterns; avoid duplicating canvas logic; prefer shared “canvas engine” abstractions if already present.
- No new frameworks; stay within Nuxt 3 + Nuxt UI + existing testing toolchain.

Output:

- Provide the set of master prompts in copy/paste-ready format.
- Each master prompt should be complete and standalone.
- Do not include code solutions; only implementation guidance and boundaries.

---

---

---

## Master Prompt 1 — Implement `ai.generateMatchingSummary` AI Operation (Lambda + schemas + tests)

### 1) Title

EPIC 5C — Add AI Operation `ai.generateMatchingSummary` (strict JSON, deterministic, validated)

### 2) Intro (context + why)

EPIC 5C is blocked primarily by the missing AI operation that produces the **matching summary** used by the UI and downstream EPIC 6 tailoring. The project uses a deterministic **AI operations registry** where **the app never receives free-form text**—only JSON validated by strict schemas + fallback rules. `ai.generateMatchingSummary` is explicitly planned and currently missing.

### 3) Feature scope

**Implement:**

- A new Lambda-backed AI operation: `ai.generateMatchingSummary`
- Strict input/output schema validation (pre-call + post-call)
- Fallback strategy consistent with the AI Interaction Contract “ERROR FALLBACK RULES”
- Unit/sandbox tests for schema validation + fallback behavior

**Out of scope:**

- Any “fit score” (the data model mentions score as V2; treat it as optional/not produced by AI in MVP)
- Any new frameworks or UI work (handled in other prompts)

### 4) Composables / services / repositories / domain modules

- Add operation definition to the AI operations registry (same pattern as existing ops like `ai.parseJobDescription`, `ai.analyzeCompanyInfo`)
- Add shared schema types exported in the same “single source of truth” style used elsewhere (Lambda → types re-exported to frontend)

### 5) Components

- None

### 6) Pages/routes

- None

### 7) AI operations impact (names, inputs/outputs, validation + fallback, call sites)

**Operation name:** `ai.generateMatchingSummary`

**Output schema (MVP):**
Return JSON containing these fields (names should match app expectations; allow snake_case → normalize to camelCase if your Lambda infra already supports that):

- `fitSummary: string`
- `impactAreas: string[]`
- `contributionMap: string[]`
- `risks: string[]`

(Also note the CDM expects “riskMitigationPoints” and “summaryParagraph” for the stored entity; the agent must decide how to map/rename consistently across AI output vs entity fields—keep it DRY and explicit.)

**Input schema (define explicitly):**
Use structured inputs only—no raw free-text. Input should be a JSON object that can be composed from existing models:

- `userProfile: {…}` (the profile fields used by other operations)
- `personalCanvas?: {…}` (optional but recommended; if missing, AI must still produce stable output)
- `jobDescription: {…}` (the analyzed job fields, not the raw posting)
- `company?: { companyProfile?: {…}, companyCanvas?: {…} }` (optional, because job may not have a linked company/canvas)

**Fallback rules (must implement):**
Follow the contract’s global rules:

- If output is not valid JSON → attempt substring parse → retry once with “Return ONLY VALID JSON matching schema”
- Missing strings → `""`; missing arrays → `[]`; missing objects → `{}`
- If hallucinated content detected by validator heuristics (e.g., mentions facts not in inputs) → strip, keep only input-grounded items (best-effort)
- Log fallback steps used + store input/output payloads for traceability

**Where it is called from (later prompts implement caller):**

- Called by `useMatchingEngine()` (workflow composable) when user requests/opens the match page, and persisted to `MatchingSummary`

### 8) Testing requirements

Add tests at the same rigor level as existing AI ops:

- Lambda unit tests:
  - Valid input → valid output schema passes
  - Output missing fields → fallback fills defaults
  - Output invalid JSON → retry path exercised (mock AI response)

- Sandbox E2E AI tests (if your repo uses these for ops): one happy path, one fallback path

### 9) Acceptance criteria (checklist)

- [ ] `ai.generateMatchingSummary` exists in the AI ops registry and can be invoked with strict schemas
- [ ] Output JSON is always normalized + schema-valid (never free text reaches app)
- [ ] Fallback behavior matches contract rules (retry + defaults)
- [ ] Comprehensive tests pass (unit + sandbox), consistent with existing AI op quality gates
- [ ] No new dependencies/frameworks introduced

---

## Master Prompt 2 — Add MatchingSummary Domain Layer (Repository + Service + Application Composable)

### 1) Title

EPIC 5C — Implement MatchingSummary domain layer (Amplify Gen2 GraphQL + type-safe repo/service)

### 2) Intro (context + why)

The CDM already includes `MatchingSummary`, but EPIC 5C is missing the domain layer: repository/service/composables. The app follows a clean split: repositories in `src/data/repositories`, domain services, and entity CRUD composables in `src/application`, plus workflow composables in `src/composables`.

### 3) Feature scope

**Implement:**

- Repository for `MatchingSummary` CRUD using Amplify GraphQL patterns
- Service encapsulating “upsert for (userId, jobId, companyId?)” semantics
- Application-layer composable `useMatchingSummary(matchId | byJobId)` consistent with other entities

**Out of scope:**

- Workflow orchestration or AI calls (covered in Prompt 3)
- UI rendering (Prompt 4)

### 4) Composables / services / repositories / domain modules to create or update

Create/update:

- `src/data/repositories/matchingSummaryRepository.ts`
- `src/domain/services/MatchingSummaryService.ts` (or existing naming conventions used in the repo)
- `src/application/useMatchingSummary(...)` (entity-level CRUD composable)

Key domain decisions to enforce (DRY):

- Support “get existing summary for user+job(+company)” and update it instead of creating duplicates
- Persist fields aligned with CDM:
  - `impactAreas`
  - `contributionMap`
  - `riskMitigationPoints` (or alias mapping from AI `risks`)
  - `summaryParagraph` (or alias mapping from AI `fitSummary`)

### 5) Components

- None

### 6) Pages/routes

- None

### 7) AI operations impact

- None directly (domain layer should be AI-agnostic; workflow comp will call AI then persist via service)

### 8) Testing requirements

Vitest tests:

- Repository tests:
  - create/read/update
  - list/query patterns used by the workflow

- Service tests:
  - “upsert-by-job” behavior (no duplicates)
  - mapping logic between AI output DTO and persisted entity fields (explicit mapping function)

### 9) Acceptance criteria

- [ ] `MatchingSummary` has a full repo/service/application composable consistent with other entities
- [ ] Upsert behavior prevents duplicates for the same job context
- [ ] Field mapping is centralized (single mapping function) and unit tested
- [ ] All tests pass; lint clean; no new patterns introduced

---

## Master Prompt 3 — Build `useMatchingEngine()` Workflow Composable (data gathering + AI call + persistence)

### 1) Title

EPIC 5C — Implement workflow composable `useMatchingEngine()` (User × Job × Company)

### 2) Intro (context + why)

The matching page needs a single orchestration layer that gathers all required structured inputs (user profile, personal canvas, job description, optional company+canvas), invokes `ai.generateMatchingSummary`, applies fallback rules, and persists the result into `MatchingSummary`. The mapping doc explicitly calls for a `useMatchingEngine()` composable and reuse of existing patterns like `useJobAnalysis()` and `useCanvasEngine()`.

### 3) Feature scope

**Implement:**

- `useMatchingEngine(jobId)` (or similar signature matching your conventions)
- A single “generate or refresh matching” method:
  - load required models
  - validate prerequisites
  - call AI operation
  - persist summary
  - expose UI-ready computed state (loading/error/empty)

**Out of scope:**

- Any new global store
- Any background regeneration strategy (no polling); keep it user-triggered or page-entry-triggered

### 4) Composables / services / repositories / domain modules to create or update

Create:

- `src/composables/useMatchingEngine.ts`

Reuse:

- `useUserProfile()` for current user data
- `useCanvasEngine()` / `usePersonalCanvas()` for personal canvas access
- `useJobAnalysis()` / job composables for `JobDescription`
- Company composables from EPIC 5B for `Company` and `CompanyCanvas` (optional)

### 5) Components

- None (but shape the returned data so components can stay “dumb”)

### 6) Pages/routes

- None

### 7) AI operations impact (where called from + fallback)

- Call `ai.generateMatchingSummary` only with structured JSON input (no raw text)
- Enforce “optional company context”:
  - If job has no company or company has no canvas, still produce stable output

- Apply the same strict schema validation and fallback approach used across AI ops (but don’t duplicate the Lambda validator—use shared client-side type guards if present, or rely on the fact Lambda already returns validated JSON)

### 8) Testing requirements

Vitest:

- Workflow composable tests:
  - happy path: all inputs exist → AI called → persisted → state updated
  - missing company/canvas path: still calls AI with reduced input
  - missing personal canvas path: either block with a clear error state or proceed with reduced input (choose one behavior and test it)
  - error path: AI op fails → composable exposes stable error + no partial writes

### 9) Acceptance criteria

- [ ] `useMatchingEngine` composes existing composables (no duplication of canvas/job/company logic)
- [ ] Works with or without linked company/canvas
- [ ] Exposes clear states: `isLoading`, `error`, `matchingSummary`, and `regenerate()`
- [ ] Tests cover all major branches; lint clean; strict TS passes

---

## Master Prompt 4 — Implement Matching Summary UI (components + `/jobs/[jobId]/match` page + navigation)

### 1) Title

EPIC 5C — Create `/jobs/[jobId]/match` page + MatchingSummary components (Nuxt UI scaffold)

### 2) Intro (context + why)

EPIC 5C’s planned UI route is `/jobs/[jobId]/match`. The mapping doc defines the UI primitives (UCard/UAlert/UBadge/UProgress) and required data (MatchingSummary + Job + Canvas context). The UI must follow the standard scaffold: `UContainer → UPage → UPageHeader/UPageBody`, reuse card patterns, and integrate breadcrumbs/navigation consistent with the Jobs & Companies section.

### 3) Feature scope

**Implement:**

- New page: `/jobs/[jobId]/match`
- Page header:
  - breadcrumb: Jobs & Companies → Job (title) → Match
  - optional action button: “Generate / Refresh match”

- Page body:
  - A primary “Matching Summary” card rendering:
    - `summaryParagraph` / `fitSummary`
    - impact areas
    - contribution map
    - risks + mitigation points (depending on final field naming)

- Optional “Fit score visualization” UI element:
  - If no score exists (MVP), render a placeholder or hide component (do not invent score)

**Out of scope:**

- Any tailoring pages (EPIC 6)
- Any new charting library/framework

### 4) Composables / services / repositories / domain modules

Use:

- `useMatchingEngine()` for orchestration
- Existing job composable to show job title & linked company badge in header area (reuse `LinkedCompanyBadge` if appropriate)

### 5) Components to create or update (Nuxt UI)

Create components (keep them presentational; data comes from composable):

- `MatchingSummaryCard` (renders summary + lists)
- `FitScoreVisualization` (optional; should accept nullable/optional score; hide when undefined)
- Consider reusing existing “Card pattern” components used in other pages (do not fork patterns)

### 6) Pages/routes to create or update (navigation/breadcrumb behavior)

Create:

- `pages/jobs/[jobId]/match.vue`

Update:

- `pages/jobs/[jobId].vue` to include a visible navigation entry/button/link to “View Match” (only enabled when job is analyzed; optionally warn if prerequisites missing)

Breadcrumb expectations:

- Must include dynamic job title
- Must be consistent with existing job detail breadcrumb pattern

### 7) AI operations impact

- The page should call `useMatchingEngine().regenerate()` on user action and/or on initial mount (choose one consistent behavior; avoid double calls)
- Must never handle free-form text; render only validated fields already persisted/returned by the workflow

### 8) Testing requirements

Vitest:

- Page test for `/jobs/[jobId]/match`:
  - renders loading state
  - renders empty/error state
  - renders match data state (with mocked composable)

- Component tests:
  - `MatchingSummaryCard` renders lists robustly for empty arrays
  - `FitScoreVisualization` hides safely when score missing

Playwright is covered in Prompt 5.

### 9) Acceptance criteria

- [ ] `/jobs/[jobId]/match` exists with standard Nuxt UI scaffold
- [ ] Uses `useMatchingEngine` and does not duplicate orchestration logic
- [ ] Presents summary + 3 sections (impact, contribution, risks) with good empty states
- [ ] Navigation from job detail → match works and breadcrumb is correct
- [ ] All Vitest component/page tests pass; strict TS; lint clean

---

## Master Prompt 5 — Add the Single Playwright E2E Happy Path for EPIC 5C

### 1) Title

EPIC 5C — Playwright E2E: job → match generation → persistence → refresh

### 2) Intro (context + why)

The repo maintains robust E2E “happy path” coverage per EPIC (e.g., jobs-flow, company-workflow). EPIC 5C requires exactly one E2E spec validating that a user can open a job and generate/view a matching summary using strict JSON AI output and persisted `MatchingSummary`.

### 3) Feature scope

**Test must cover:**

- Navigate to an existing analyzed job (or create one if your E2E pattern does that)
- Go to `/jobs/[jobId]/match`
- Trigger matching generation (button or auto-generate)
- Verify key UI elements render (summary + at least one list section)
- Refresh/reload page and verify it loads from persisted `MatchingSummary` (no re-generation required unless user triggers it)

**Out of scope:**

- Negative cases (AI failure), separate tests
- Visual regression

### 4) Composables/services/repositories

- None directly; but the test assumes the full stack is wired (workflow composable, AI op, persistence)

### 5) Components

- Use stable locators:
  - Prefer `getByRole()` / `getByTestId()` patterns consistent with your existing suite
  - Avoid ambiguous `getByText()` strict mode pitfalls (scope locators to region/cards)

### 6) Pages/routes (navigation expectations)

- Start from `/jobs` list → open job detail
- Use explicit link/button to match page OR direct navigation to `/jobs/${jobId}/match`
- Validate breadcrumb shows job title and “Match”

### 7) AI operations impact

- The E2E should use the real AI operation in the environment if that’s the standard for your other E2Es; otherwise, follow the same mock/sandbox approach used in existing workflows
- Must validate the UI receives JSON-shaped content (implicitly, by presence of rendered structured sections)

### 8) Testing requirements

Add **one** Playwright spec file, similar style to `jobs-flow.spec.ts` / `company-workflow.spec.ts`:

- Setup: authenticated user
- Steps: open job → open match → generate → assert → reload → assert

### 9) Acceptance criteria

- [ ] One Playwright test exists for EPIC 5C and passes reliably
- [ ] Uses stable locators and avoids strict mode collisions
- [ ] Demonstrates persistence (reload shows same match without manual re-entry)
- [ ] Leaves the environment clean (if tests create data, they should delete it per your existing conventions)
