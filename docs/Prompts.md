You are an expert staff engineer + tech lead assistant for a Nuxt 4 + TypeScript (strict) app using Nuxt UI, Amplify Gen2 (GraphQL), and an AI-Operations Lambda layer with strict schema validation (AI Interaction Contract).

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

- Must remain consistent with JSON/Text I/O for AI ops; no free-text to the app except for CV anc cover letter.
- Keep code CLEAN + DRY + YANGNI: reuse existing patterns; avoid duplicating canvas logic; prefer shared “canvas engine” abstractions if already present.
- No new frameworks; stay within Nuxt 4 + Nuxt UI + existing testing toolchain.

Output:

- Provide the set of master prompts in copy/paste-ready format.
- Each master prompt should be complete and standalone.
- Do not include code solutions; only implementation guidance and boundaries.

---

---

---

## Master Prompt 1 — Add AI Operation: `ai.evaluateApplicationStrength` (Contract + Lambda + Registry)

### Intro

EPIC A2 adds a new evaluator layer that scores **actual materials** (CV + optional cover letter) against a **job description**, producing a decision gate + concrete improvements. Your stack already has deterministic AI ops with strict schema validation and fallbacks. This prompt exists to extend that AI-ops layer cleanly and safely.

### Feature scope

**Implement**

- New AI operation `ai.evaluateApplicationStrength` in the AI ops registry.
- Strict input/output schemas + normalization + fallback strategy.
- Lambda implementation (or handler) consistent with existing AI ops (same validation utilities, error handling, logging conventions).

**Out of scope**

- UI page, routing, PDF parsing in frontend, storage/persistence of evaluations.
- Any “auto-rewrite” of CV/letter content (correction engine remains suggestions only in V1).
- Any dependency on MatchingSummary (A2 is parallel to match).

### Composables / services / repositories / domain modules

- Update the AI operations domain module (whatever you use today: e.g., `AiOperationsService`, `AiOperationsRepository`, `useAiOperations()`).
- Add a typed client wrapper method like `evaluateApplicationStrength(input)` returning a strictly validated output type.
- Ensure operation is registered in the “AI operations registry” in the same way as existing ops (naming, routing, model selection).

### Components to create or update

- None (AI layer only). If you need a small internal helper: a shared `clampScore(0..100)` and `ensureMinImprovements(>=2)` utility in the AI ops layer.

### Pages/routes

- None.

### AI operations impact

**Operation**

- Name: `ai.evaluateApplicationStrength`
- Inputs (strict):
  - `job`: structured JobDescription fields (title, seniorityLevel, roleSummary, responsibilities[], requiredSkills[], behaviours[], successCriteria[], explicitPains[])
  - `cvText`: string
  - `coverLetterText`: string (may be empty)
  - `language`: string (output language)

- Output (strict):
  - `overallScore` (0–100 integer)
  - `dimensionScores`:
    - `atsReadiness`, `keywordCoverage`, `clarityFocus`, `targetedFitSignals`, `evidenceStrength` (0–100 int)

  - `decision`: `{ label: strong|borderline|risky, readyToApply: boolean, rationaleBullets: string[] (2–5) }`
  - `missingSignals`: string[]
  - `topImprovements`: array length ≥ 2 (prefer 3), each:
    - `title`, `action`, `impact: high|medium|low`
    - `target: { document: cv|coverLetter, anchor: string }`

  - `notes`: `{ atsNotes: string[], humanReaderNotes: string[] }`
    **Validation + fallback**

- Never return null; fill empty values with `""` or `[]`.
- Clamp scores to 0..100.
- If cover letter empty: do not produce cover-letter-only criticism; improvements default to CV targets.
- If `topImprovements` < 2: inject safe generic improvements targeting CV (`summary`, `skills`, `experience` or `general`).
- Enforce max length of bullets (e.g., ≤160 chars) at validation or post-processing.

**Where called from**

- Future caller: frontend `useApplicationStrength()` composable on `/jobs/[jobId]/application-strength`.

### Testing requirements

**Vitest (AI layer)**

- Schema validation tests:
  - accepts valid output
  - clamps invalid scores
  - fills missing keys
  - enforces at least 2 improvements
  - coverLetter empty path does not create coverLetter-only targets

- Repository/service tests:
  - correct operation name routed
  - request payload matches schema (including language)

**Playwright**

- None in this prompt.

### Acceptance criteria

- [ ] Operation exists in registry and is callable via existing AI ops infrastructure.
- [ ] Input and output schemas are defined and enforced.
- [ ] Fallback rules are implemented and covered by tests.
- [ ] No free-form AI text reaches the app except the provided CV/letter strings.
- [ ] Code matches existing AI ops patterns (naming, validation, error handling).

---

## Master Prompt 2 — Domain + Types: “Application Strength Evaluation” DTOs and Anchors (Frontend-safe, Ephemeral)

### Intro

EPIC A2 needs a clean typed representation of the evaluation output and “edit jump targets” without introducing persistence yet. This prompt creates the minimal domain/types needed to integrate the evaluator end-to-end while keeping everything ephemeral.

### Feature scope

**Implement**

- Domain types/DTOs for `ApplicationStrengthEvaluation` and `ImprovementTarget`.
- Anchor naming conventions and mapping strategy (for “jump to editor section”).
- A thin domain service interface used by UI composables.

**Out of scope**

- New GraphQL models (evaluation is ephemeral in V1).
- Any modifications to existing CVDocument / CoverLetter storage schemas.

### Composables / services / repositories / domain modules

Create or update:

- `src/domain/application-strength/`
  - `ApplicationStrengthEvaluation.ts` (types + helpers)
  - `ApplicationStrengthService.ts` (interface)
  - `ApplicationStrengthRepository.ts` (calls AiOperationsRepository)

- Update `src/application/ai-operations/useAiOperations.ts` (or equivalent) to expose the new method via the domain service.

Add helpers:

- `normalizeAnchor(anchor: string): AnchorId`
- `isAnchorSupported(anchor: string): boolean`
- `defaultAnchorForImprovementType(...)` (optional)

### Components to create or update

- None.

### Pages/routes

- None.

### AI operations impact

- Consumes output of `ai.evaluateApplicationStrength`.
- Define **canonical anchors** for V1:
  - CV anchors: `summary`, `skills`, `experience`, `education`, `projects`, `general`
  - Cover letter anchors: `coverLetterBody`, `opening`, `closing`, `general`

- Ensure repository normalizes unknown anchors to `general` (never break UI navigation).

### Testing requirements

**Vitest**

- Type-level and runtime tests for:
  - anchor normalization
  - unknown anchors → `general`
  - evaluation DTO guards (no nulls, arrays always present)

- Repository tests:
  - converts AI op response into domain DTO safely
  - stable defaults when fields missing

**Playwright**

- None.

### Acceptance criteria

- [ ] Domain module exists with clear DTO types and anchor normalization.
- [ ] No persistence added; evaluation remains in memory.
- [ ] Unknown/unsupported anchors never crash navigation (normalized).
- [ ] Unit tests cover normalization + DTO safety.

---

## Master Prompt 3 — Frontend Page: `/jobs/[jobId]/application-strength` (Inputs, Run Evaluation, Results)

### Intro

This is the user-facing EPIC A2 entry point. It must work **without running matching** and support both generated documents and user-provided materials (paste text + PDF→text). The page follows your Nuxt UI scaffold, composable-first logic, and “card” patterns.

### Feature scope

**Implement**

- New route page `/jobs/[jobId]/application-strength`
- Load job data by `jobId`
- Material input panel:
  - Select existing CVDocument (optional)
  - Select existing CoverLetter (optional)
  - Paste CV text (required if no CVDocument selected)
  - Paste cover letter text (optional)
  - Upload PDF for CV and/or letter → convert to text in frontend (reuse job upload PDF→text logic)

- “Evaluate” action that calls the domain service and shows results.

**Out of scope**

- Persist evaluation results.
- Auto-rewrite functionality.
- Any requirement to run MatchingSummary before evaluation.

### Composables / services / repositories / domain modules

Create:

- `useApplicationStrengthPage(jobId)` (or split):
  - `useApplicationStrengthInputs()` (material state + validation + pdf-to-text)
  - `useApplicationStrengthEvaluator()` (calls domain service + manages loading/errors)

- Reuse existing:
  - `useJobAnalysis()` to fetch JobDescription (read-only)
  - `useCvDocuments()` and `useCoverLetters()` (or whatever list composables exist)
  - Shared file-to-text utilities already used in job upload flow

State requirements:

- Form state with “source mode” per document: `selectedExisting | pastedText | pdfUpload`
- Derived `canEvaluate` boolean with clear UX errors (missing cv text, missing job)

### Components to create or update

Create components (Nuxt UI-based, card patterns):

- `ApplicationStrengthInputCard`
  - CV source selection
  - optional cover letter source selection
  - PDF upload area + “extracted text preview” (collapsed)
  - Paste text fields with char count

- `ApplicationStrengthResultsCard`
  - Overall score + decision label
  - Dimension breakdown cards
  - Missing signals list

- `ApplicationStrengthImprovementsCard`
  - List of top improvements (clickable)
  - Each item shows impact badge + target document + anchor

Reuse patterns:

- Use existing `TagInput` style for lists (missing signals, rationale bullets) but display-only is fine.

### Pages/routes to create or update

Create:

- `/jobs/[jobId]/application-strength`
  Navigation:
- Entry link from `/jobs/[jobId]` (job detail page) in a “Tools” or “Actions” card.
- Breadcrumb:
  - Jobs → Job Title → Application Strength

- Provide “Back to Job” button.

### AI operations impact

- Call `ai.evaluateApplicationStrength` via domain repository.
- Inputs must be **pure strings** for cvText/coverLetterText; job is structured.
- Ensure language is passed (use job language or user profile language default; if ambiguous, use app default but be consistent).
- Enforce client-side pre-validation:
  - if cvText empty → block and show error
  - if coverLetter missing → allowed

### Testing requirements

**Vitest**

- Page-level test: renders with job loaded, shows empty state before evaluation.
- Composable tests:
  - pdf→text populates text field
  - `canEvaluate` rules
  - evaluation call sets loading and stores result

- Component tests:
  - improvements render and emit `onJump` with correct target/anchor

**Playwright (single happy path)**

- Flow:
  1. Create/upload a job (or use seeded fixture)
  2. Open job page → click “Application Strength”
  3. Paste CV text → click Evaluate
  4. Assert overall score visible, 5 dimension cards visible
  5. Assert at least 2 improvements shown

### Acceptance criteria

- [ ] Page accessible from job page without running matching.
- [ ] Supports pasted CV text and CV PDF upload → text extraction.
- [ ] Cover letter optional (no blocking).
- [ ] Shows decision gate (Strong/Borderline/Risky + readyToApply).
- [ ] Shows at least 2 improvements and missing signals.
- [ ] UI uses standard scaffold + existing card patterns.
- [ ] No persistence added.

---

## Master Prompt 4 — “Jump to Edit” Actions (Deep Links + Anchor Handling)

### Intro

A2 must behave like a correction engine: improvements must be clickable and take the user to the right place to fix issues. Because inputs can be either existing in-app documents or external text, we need a robust navigation strategy with graceful fallback.

### Feature scope

**Implement**

- Clickable improvements that “jump” the user to:
  - CV editor (`/applications/cv/:id`) with anchor, when a CVDocument was selected
  - Cover letter editor (`/applications/cover-letters/:id`) with anchor, when selected
  - If pasted/PDF text mode: jump within the A2 page to the relevant textarea section (CV or cover letter) and highlight it.

**Out of scope**

- Automated rewriting / applying fixes.
- Persisting improvement completion status.

### Composables / services / repositories / domain modules

Create:

- `useImprovementNavigation()`
  - `jumpToTarget(improvement, context)` handles:
    - route navigation to existing editor pages
    - intra-page scrolling for pasted text mode

  - map anchors → editor UI section IDs

Update:

- CV editor page and Cover Letter editor page (only if needed) to support hash anchors or query param like `?anchor=skills`.
  - Keep minimal; prefer existing patterns for scroll-to-section if any exist.

### Components to create or update

Update:

- `ApplicationStrengthImprovementsCard` to emit `improvementClick`.

Update (minimal):

- CV editor/cover letter editor components: add `id` attributes for key sections and implement scroll-on-mount if `anchor` present.

### Pages/routes

- Update navigation from A2 page to include `anchor` (hash or query).
- Ensure breadcrumbs remain consistent when navigating back.

### AI operations impact

- No changes. Only consumes `target.document` and `target.anchor`.
- Must handle unknown anchors by treating as `general`.

### Testing requirements

**Vitest**

- `useImprovementNavigation` unit tests:
  - selected CVDocument → navigate to correct route with anchor param
  - pasted text mode → scroll within A2 page (mock scrolling)
  - unknown anchor → `general`

- Component test:
  - clicking improvement triggers navigation method with correct params

**Playwright**

- Extend the single EPIC happy path:
  - After evaluation, click first improvement
  - If using pasted text mode, assert focus/scroll to the CV textarea section
  - (Optional secondary assertion) If selecting an existing CVDocument fixture, assert navigation to editor page occurs

### Acceptance criteria

- [ ] Clicking an improvement always results in a meaningful navigation (no dead clicks).
- [ ] Works for both “existing document” and “pasted/PDF text” workflows.
- [ ] Unknown anchors don’t break UX (fallback to general).
- [ ] Minimal, consistent changes to existing editors.

---

## Master Prompt 5 — Cross-Cutting Quality: Error Handling, Telemetry, and Test Fixtures

### Intro

A2 is a “decision gate” feature. It must be reliable, debuggable, and testable with minimal flaky dependencies. This prompt ensures clean DX, stable tests, and consistent UX errors.

### Feature scope

**Implement**

- Frontend error handling states:
  - job not found
  - AI op failure / validation failure
  - pdf text extraction failure

- Deterministic UX messaging (i18n keys if applicable).
- Add minimal PostHog events, consistent with existing usage.

**Out of scope**

- Fancy analytics dashboards
- Persisting evaluation history

### Composables / services / repositories / domain modules

Update:

- `useApplicationStrengthEvaluator` to produce:
  - `status: idle|loading|success|error`
  - `errorCode` (typed) and `errorMessageKey` (i18n)
  - keep raw error only for logs (not UI)

Add:

- Fixtures utility for tests:
  - sample job JSON
  - sample CV text blocks
  - optional cover letter text

### Components to create or update

- `ErrorStateCard` (if you don’t already have one) reused across pages.
- Ensure consistent loading skeleton / disabled buttons.

### Pages/routes

- Ensure `/jobs/[jobId]/application-strength` handles:
  - direct URL entry
  - missing job
  - empty cvText

### AI operations impact

- Ensure AI op response validation failures surface as typed error in UI and log detailed failure for debugging.
- Fallback strategy should prevent most validation failures; still handle worst-case.

### Testing requirements

**Vitest**

- Error-path tests:
  - missing job → shows error state
  - AI failure → shows retry button
  - pdf parse failure → shows extraction error but allows paste fallback

- Snapshot/DOM tests for consistent card structure.

**Playwright**

- Happy path remains single.
- Add one assertion for “retry works” only if it’s stable; otherwise keep it Vitest-only.

### Acceptance criteria

- [ ] User never sees raw stack traces or internal error objects.
- [ ] Evaluation failures are recoverable (retry).
- [ ] Tests include stable fixtures and avoid network flakiness.
- [ ] UX remains consistent with Nuxt UI scaffold and existing patterns.

---

---

## Master Prompt 1 — Extend the Domain Model for Evidence Tagging (STARStory.skills/strengths)

1. **Title**
   C2-1: Add lightweight evidence mapping to STARStory (skills[] + strengths[])

2. **Intro (context + why)**
   EPIC C2 relies on a “skills/strengths ⇄ evidence” feedback loop. We explicitly do **not** add a new Competency model; instead we store lightweight mapping on `STARStory` so the UI can show which story proves which skill/strength and persist user confirmations. This must align with current Amplify Gen2 GraphQL modeling and strict TypeScript types.

3. **Feature scope (in / out)**
   **Implement:**

- Add `skills: string[]` and `strengths: string[]` fields to `STARStory` model (default `[]`).
- Ensure GraphQL types, generated client types, repositories/composables, and existing story editor flows can read/write these arrays.
- Add data migration/backfill strategy (minimal): existing stories get empty arrays.

**Out of scope:**

- New Competency entities/models.
- Automated backfill of skills/strengths for all existing stories (that is handled via the new AI operation, not a migration script).

4. **Composables / services / repositories / domain modules**
   Update existing story domain layers (keep existing conventions):

- `StoryRepository` (or equivalent): include `skills` + `strengths` in CRUD, list queries, and update mutations.
- `useStoryEditor()` / `useStoryList()` / `useStoryEngine()` (whatever exists): ensure local state includes new arrays and saves them.
- Add shared helper for dedupe/normalize arrays for tags: `normalizeTagList()` (case/trim/punctuation) used consistently across story + profile updates.

5. **Components to create or update**

- Update the story editor UI component that currently edits achievements/KPIs to also support:
  - TagInput for `skills[]`
  - TagInput for `strengths[]`

- Keep UI consistent with TagInput pattern already used for list fields.

6. **Pages/routes to create or update**

- Update existing Story Editor route(s) only (no new routes here).
- Ensure breadcrumbs/page titles continue to work with existing mapping (story detail pages should still show correct titles).

7. **AI operations impact**
   None directly in this prompt (only model readiness). Ensure that downstream AI operations can rely on `skills[]` / `strengths[]` being present (possibly empty) on every story.

8. **Testing requirements**
   Vitest:

- Model/repository layer tests: verify `STARStory` serialization/deserialization includes skills/strengths.
- Component tests for story editor: TagInput updates local state; save triggers mutation payload includes skills/strengths; dedupe/normalize is applied.

Playwright:

- Not required for this prompt alone (covered by EPIC-level E2E later).

9. **Acceptance criteria**

- [ ] `STARStory` GraphQL model includes `skills: string[]` and `strengths: string[]` with default empty arrays.
- [ ] Story CRUD reads/writes both arrays end-to-end (UI → GraphQL → UI).
- [ ] Story editor exposes TagInput controls for both arrays.
- [ ] No regressions in existing story creation/edit flows and tests remain green.
- [ ] TypeScript strict mode passes (no `any`, no missing fields).

---

## Master Prompt 2 — Implement AI Ops + Strict Validation for C2 (Coverage + Extraction)

1. **Title**
   C2-2: Add AI operations `ai.evaluateCompetencyCoverage` + `ai.extractSkillsAndStrengthsFromEvidence`

2. **Intro (context + why)**
   EPIC C2 requires deterministic AI operations with **strict JSON I/O** and schema validation. The app must never consume free-form text from AI. These ops power: (1) checking evidence coverage for skills/strengths/job-competencies, and (2) extracting proposed skills/strengths from user evidence.

3. **Feature scope (in / out)**
   **Implement:**

- Add both ops to the AI-ops registry (Lambda layer) with:
  - Input schema validation
  - Output schema validation + fallback normalization
  - Deterministic prompts aligned with AIC specs

- Ensure both ops accept and return only JSON (no markdown).

**Out of scope:**

- A single-item “suggestEvidenceForCompetency” op (explicitly not needed).
- Persisting coverage results on the job entity (we compute live to improve profile).

4. **Composables / services / repositories / domain modules**
   Backend (AI-ops):

- Add new operation handlers (naming and file structure consistent with your existing AI ops).
- Add shared normalization utilities in the Lambda layer:
  - ID list dedupe
  - prompt length clamp
  - confidence clamp
  - result array length guardrails

Frontend orchestration:

- Create or update a domain service/composable to call these AI ops:
  - `useCompetencyEvidenceEngine()` (or similar naming)
  - Methods:
    - `evaluateCoverageForProfileSkills()`
    - `evaluateCoverageForProfileStrengths()`
    - `evaluateCoverageForJobCompetencies(jobId)`
    - `extractSkillsAndStrengthsFromEvidence()`

5. **Components to create or update**
   None required here (focus on contracts + callable APIs). Provide minimal integration points for UI prompts later.

6. **Pages/routes to create or update**
   None required here.

7. **AI operations impact (must be explicit)**
   **Operation A: `ai.evaluateCompetencyCoverage`**

- **Inputs:** `competencyType`, `competencies[]`, `experiences[]`, `stories[]` (with storyId, experienceId, story text, story.skills[], story.strengths[])
- **Outputs:** `results[]` with coverage (`low|medium|high`), evidence story IDs, suggested experience IDs, recommended actions, prompts; plus `summary`.
- **Validation rules:**
  - All keys must exist; never null.
  - `results.length === competencies.length` (fallback fills missing).
  - Only IDs from inputs can be returned.
  - Prompts <= 90 chars; clamp/truncate.
  - Conservative grading: prefer medium if uncertain.

**Operation B: `ai.extractSkillsAndStrengthsFromEvidence`**

- **Inputs:** `existingSkills[]`, `existingStrengths[]`, `experiences[]`, `stories[]`.
- **Outputs:** `proposedSkills[]`, `proposedStrengths[]`, with evidence ids + conservative confidence, plus dedupe notes.
- **Validation rules:**
  - No invented evidence IDs.
  - Deduplicate against existing + within proposals.
  - Confidence clamped [0..1]; story-based > experience-only.

**Fallback strategies**

- Must match the AIC fallback behavior: malformed output → safe empty or conservative defaults, never crash UI.

8. **Testing requirements**
   Vitest (backend/unit):

- Schema validation tests for both ops: valid inputs pass; invalid inputs rejected.
- Fallback tests: malformed AI response yields valid fallback JSON.
- Edge cases:
  - Empty competencies
  - No stories
  - No experiences
  - IDs mismatch attempts (must be removed)

Playwright:

- Not required here (covered by EPIC-level E2E).

9. **Acceptance criteria**

- [ ] Both AI ops exist in registry and are callable from frontend.
- [ ] Input/output validated strictly; fallback always returns schema-compliant JSON.
- [ ] Ops never return nulls, never return IDs not present in input.
- [ ] Unit tests cover validation + fallback + key edge cases.
- [ ] No free-form AI text is consumed by the app.

---

## Master Prompt 3 — Profile Enhancements: Check Skills/Strengths + Propose from Evidence + Inline Story Creation

1. **Title**
   C2-3: Profile evidence loop UI (Check skills/strengths + Extract proposals + Add proof inline)

2. **Intro (context + why)**
   The profile is where users continuously improve their baseline skills/strengths and ensure each has at least one proof story. This is the “global coverage” half of EPIC C2 and should improve confidence and profile quality. It must reuse existing UI patterns (cards, TagInput, existing story creation UI).

3. **Feature scope (in / out)**
   **Implement:**

- On the full profile page section where skills and strengths are displayed:
  - Button: **Check skills**
  - Button: **Check strengths**
  - Button: **Propose skills & strengths from experiences/stories**

- A Coverage Results view showing low/medium/high per item with actions:
  - View evidence stories (links)
  - Add proof → inline story creation panel using the same UI pattern as your story creation flow (free-text → generateStarStory → persist story → tag story with skill/strength)

- Proposal flow:
  - Show proposed skills/strengths with “Add to profile” one-click
  - Optional: apply suggested story linkage (update story.skills/strengths) if returned by AI op

**Out of scope:**

- Any job-specific UI here.
- Any job-level persistence for coverage results.

4. **Composables / services / repositories / domain modules**

- Extend `useUserProfile()` to expose safe helpers:
  - `addSkill(label)`
  - `addStrength(label)`
  - Dedup/normalize behavior shared and tested

- Add `useCompetencyEvidenceEngine()` usage:
  - `runCoverageCheck(type)` calls `ai.evaluateCompetencyCoverage`
  - `runExtraction()` calls `ai.extractSkillsAndStrengthsFromEvidence`

- Add a small state machine composable for UI:
  - `useCompetencyEvidencePanel()` to manage:
    - idle/loading/error states
    - selected competency
    - inline story panel open/close
    - picked experience (if needed)

5. **Components to create or update**
   Create/Update components (Nuxt UI cards):

- `CompetencyCoverageCard`
  - Inputs: items, coverage counts
  - Rows: competency label + coverage badge + evidence chips + CTA

- `CompetencyProposalCard`
  - Lists proposed skills/strengths with “Add” actions

- `InlineStoryCreationPanel`
  - Reuse existing story creation UI patterns:
    - Experience picker (only if required by AI result)
    - Free-text input
    - Calls existing `generateStarStory` flow to generate structured story
    - Saves story and sets story.skills[] / story.strengths[] accordingly

6. **Pages/routes to create or update**

- Update: Full profile page only (where skills/strengths live today).
- Breadcrumb/title behavior should remain consistent; don’t add new routes.

7. **AI operations impact**

- Call `ai.evaluateCompetencyCoverage` from the profile page when “Check skills/strengths” is clicked.
- Call `ai.extractSkillsAndStrengthsFromEvidence` when “Propose…” is clicked.
- Ensure strict schema validation + fallback handling in composable:
  - No UI crashes on malformed responses
  - Show an error alert + allow retry

8. **Testing requirements**
   Vitest:

- `useCompetencyEvidenceEngine` unit tests:
  - correct payload construction (skills vs strengths)
  - dedupe/normalize behavior
  - fallback handling produces stable UI state

- Component tests:
  - Coverage card renders low/medium/high correctly
  - Clicking “Add” updates profile via mocked repository
  - Inline story panel triggers story generation + persists tags

Playwright (single EPIC happy path will cover core; here add minimal coverage if needed):

- Not required separately if EPIC E2E includes profile actions; otherwise add a small profile-only spec.

9. **Acceptance criteria**

- [ ] Profile page has 3 buttons: Check skills, Check strengths, Propose skills & strengths.
- [ ] Coverage results show low/medium/high with evidence story links when available.
- [ ] “Add proof” opens inline story creation; user can pick experience if needed; free-text leads to saved story tagged with the competency.
- [ ] Proposal list allows one-click add to profile (deduped).
- [ ] All flows handle AI fallback without breaking UI.

---

## Master Prompt 4 — Job Match Evidence Coverage UI + “Add skill / Add proof” Actions

1. **Title**
   C2-4: Job match evidence section on `/jobs/[jobId]/match` (job competencies → profile improvement)

2. **Intro (context + why)**
   The job match page is the “trigger” loop: once a job is analyzed, we use its competencies (requiredSkills + behaviours + responsibilities, normalized/deduped) to show whether the user has proof stories. From there, we offer fast actions to improve the user profile (add skill, add proof story, link story).

3. **Feature scope (in / out)**
   **Implement:**

- On `/jobs/[jobId]/match`:
  - Build normalized job-competency list from job fields
  - Call `ai.evaluateCompetencyCoverage` with `competencyType="jobCompetency"`
  - Render evidence coverage section:
    - list competency rows with coverage badge
    - evidence story chips/links
    - actions:
      - “Add skill to profile” (if missing from profile.skills[])
      - “Add proof” / “Add story”:
        - if skill missing → allow “Add skill + story”
        - if skill present but evidence missing → “Story only”

- Inline story creation panel (same as profile flow) with:
  - Suggested experiences from AI
  - Experience picker if required
  - Free-text → generateStarStory → persist + tag

**Out of scope:**

- Showing evidence on `/jobs/[jobId]` (match only for now).
- Persisting coverage at job level.

4. **Composables / services / repositories / domain modules**

- Update `useMatchingEngine()` or add `useMatchEvidenceCoverage()` to:
  - gather job fields (requiredSkills/behaviours/responsibilities)
  - normalize/dedupe
  - fetch profile skills for “missing skill” decision
  - call AI op via `useCompetencyEvidenceEngine`

- Update profile service to allow adding a skill from match page (no provenance).

5. **Components to create or update**

- Add section card: `JobCompetencyEvidenceCard`
  - Table/list rows, coverage badges, CTAs

- Reuse `InlineStoryCreationPanel` created in profile prompt (do not duplicate).
- Evidence chips should open existing story view modal or navigate to story page.

6. **Pages/routes to create or update**

- Update only: `/jobs/[jobId]/match`
- Ensure breadcrumb/title remains consistent (job name in title, match breadcrumb).

7. **AI operations impact**

- `ai.evaluateCompetencyCoverage` called when match page loads (or via “refresh evidence” button).
- Inputs must include:
  - normalized job competencies list
  - user experiences + stories (with ids + story text + story.skills/strengths arrays)

- Fallback:
  - If AI fails, show “Evidence unavailable” alert and allow retry; never block rest of match content.

8. **Testing requirements**
   Vitest:

- Normalization/dedupe helper tests (job fields combined).
- Match evidence composable tests:
  - ensures missing-skill logic is correct
  - ensures action dispatch updates profile & opens story panel

Playwright (EPIC happy path can include this; see next prompt):

- Validate the evidence section renders and action flows work.

9. **Acceptance criteria**

- [ ] Match page shows evidence coverage section using job competencies derived from 3 job arrays.
- [ ] Each competency displays low/medium/high + evidence story links if present.
- [ ] User can add missing skill to profile with one click.
- [ ] User can add proof via inline story creation (experience suggested/picked + free text).
- [ ] No data stored on job; changes reflect in profile and story tags.

---

## Master Prompt 5 — End-to-End Testing + Quality Gates for EPIC C2

1. **Title**
   C2-5: Testing plan (Vitest coverage + 1 Playwright happy path)

2. **Intro (context + why)**
   EPIC C2 touches data model, AI ops, and two UI surfaces (profile + match). We need robust tests to prevent regressions and ensure strict schema handling. The goal is confidence: deterministic AI-ops behavior, clean UX, and no broken flows.

3. **Feature scope (in / out)**
   **Implement:**

- Vitest tests across:
  - normalization/dedupe utilities
  - competency evidence composables
  - story tagging updates
  - profile add-skill/strength actions

- One Playwright E2E happy path that demonstrates the loop from job match → profile improvement.

**Out of scope:**

- Multiple E2E scenarios; keep it to one stable happy path.

4. **Composables / services / repositories / domain modules**

- Ensure composables are testable (dependency injection or clear mocking boundaries):
  - AI op callers mocked
  - GraphQL repositories mocked
  - UI state machines tested independently

5. **Components to create or update**

- Add component tests for:
  - `CompetencyCoverageCard`
  - `JobCompetencyEvidenceCard`
  - `InlineStoryCreationPanel`

6. **Pages/routes to create or update**
   No new routes; ensure tests cover:

- Full profile page skills/strengths section actions
- `/jobs/[jobId]/match` evidence section actions

7. **AI operations impact**

- Add contract tests (unit-level) ensuring:
  - invalid payload → rejected
  - malformed AI response → fallback output passes schema
  - outputs never include unknown IDs
  - prompts truncated correctly

8. **Testing requirements**
   Vitest checklist:

- Unit: normalization/dedupe logic
- Unit: `useCompetencyEvidenceEngine` payload construction + fallback handling
- Unit: story update persists skill/strength tags
- Component: coverage rendering + CTA triggers
- Page tests (Nuxt test utils): clicking “Check skills” renders results

Playwright single happy path:

- Seed a user with:
  - at least one job with competencies
  - at least one experience
  - zero story evidence initially for one competency

- Steps:
  1. Go to `/jobs/[jobId]/match`
  2. Evidence section shows a competency as **low**
  3. Click “Add skill to profile” (if missing)
  4. Click “Add proof”
  5. Pick an experience (if required) and enter free text
  6. Confirm story created and tagged; coverage becomes **high** (or at least not low)
  7. Navigate to profile full page and confirm the skill exists + evidence story is visible from “Check skills”

9. **Acceptance criteria**

- [ ] All new utilities/composables/components have unit tests.
- [ ] AI op schema validation + fallback are covered by unit tests.
- [ ] One Playwright test proves job match → add skill → add proof story → coverage improves → profile reflects updates.
- [ ] Tests are stable (no timing flakiness): use deterministic mocks for AI and consistent seeded fixtures.
- [ ] CI passes with strict TypeScript and linting.
