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

## **C3 Backend — Add `ai.improveMaterial` AI Operation (Markdown Output) + Contract Validation**

### Intro

EPIC C3 adds an **editorial improvement loop** for **tailored CV + cover letter**. A2 already evaluates strength; C3 must **reuse A2 evaluation internally** but introduce a new AI operation that **rewrites an existing document** based on internal improvement priorities + user presets, returning **Markdown** (like existing `generateCv`/`generateCoverLetter`). This prompt exists to implement the backend operation in a deterministic, contract-driven way with robust fallbacks.

### Feature scope

**Implement:**

- New AI op `ai.improveMaterial` in the AI-ops Lambda layer
- Strict input schema validation (Zod or existing contract validator)
- Strict output validation: **must be Markdown string**, non-empty, no JSON
- Retry + fallback behavior (return original markdown unchanged on failure)

**Out of scope:**

- New evaluation/scoring logic (reuse existing evaluation op)
- Token/pricing limits
- Versioning/history of improvements (overwrite happens on frontend/model update)

### Composables / services / repositories / domain modules

**Backend only:**

- Add handler under `amplify/data/ai-operations/improveMaterial/handler.ts`
- Register in `amplify/data/resource.ts` (or wherever AI ops registry lives)
- Add/update contract definition in `docs/AI_Interaction_Contract.md` (new section only; keep existing ops unchanged)
- Create internal helper to build a **model prompt** that **does not mention A2 by name**; use a generic `improvementContext` summary

### Components to create or update

- None (backend-only)

### Pages/routes to create or update

- None (backend-only)

### AI operations impact

**Operation:** `ai.improveMaterial`
**Inputs (must validate strictly):**

- `language`, `materialType: "cv" | "coverLetter"`, `currentMarkdown`
- `instructions: { presets: string[], note?: string }`
- `improvementContext: { overallScore, weakDimensions, missingSignals, priorityActions, readerNotes? }`
- Grounding context: `profile`, `experiences`, optional `stories`, optional `jobDescription`, optional `matchingSummary`, optional `company`

**Output:**

- **Markdown string only** (full rewritten doc)
- Validation rules:
  - string, length threshold (e.g., >200 chars)
  - must not parse as JSON object/array
  - must not contain “```json” fences or “{” as first non-whitespace (guardrails; be pragmatic)

- Fallback:
  - Retry once with stricter “Markdown only” instruction
  - If still invalid: return **original** `currentMarkdown` unchanged and surface an AI-op error code (deterministic) to frontend

**Where called from:**

- CV page and Cover Letter page improvement panel (frontend will call op after it already has evaluation result)

### Testing requirements

- Backend unit tests for:
  - Input schema validation (missing fields, wrong types, empty markdown)
  - Output validation (JSON-like output rejected)
  - Fallback path returns original markdown
  - Prompt builder redacts internal naming (no “A2” string in prompt)

- Contract tests (if you have a suite): ensure op is registered and callable in sandbox

### Acceptance criteria

- [ ] `ai.improveMaterial` exists, registered, and callable in local sandbox
- [ ] Strict input validation rejects invalid payloads deterministically
- [ ] Output is always Markdown string; invalid outputs trigger retry then fallback
- [ ] No mention of “A2” in the model prompt content
- [ ] Error codes are deterministic and map cleanly to i18n keys on frontend

---

## 2) Title

**C3 Frontend — Create a Shared “Material Improvement Engine” (Composable + Service) Reusing Existing Error/State Patterns**

### Intro

C3 is a **user-triggered** loop: “Get feedback → choose presets → Improve.” You already have typed evaluator states and `useErrorDisplay` / `ErrorStateCard` patterns from A2. This prompt exists to implement the orchestration cleanly and DRY so CV and letter pages share the same improvement logic.

### Feature scope

**Implement:**

- A shared composable to:
  - Trigger evaluation (reuse existing evaluation flow/op)
  - Hold evaluation summary (score + optional expanded details)
  - Trigger improvement (`ai.improveMaterial`)
  - Maintain deterministic UI state: `idle | analyzing | ready | improving | error`
  - Provide a single `runFeedback()` + `runImprove()` API

**Out of scope:**

- New stores/frameworks (no Pinia unless already used)
- Persisting feedback results as new models (use local state; overwrite markdown in existing doc models)

### Composables / services / repositories / domain modules

Create or update (names are suggestions—keep consistent with your repo):

- `src/application/materials/materialImprovementService.ts`
  - Pure orchestration: builds payloads, calls repositories, maps errors to deterministic keys

- `src/data/repositories/aiImproveMaterialRepository.ts`
  - Calls Amplify function/op for `ai.improveMaterial`

- `src/composables/useMaterialImprovementEngine.ts`
  - Unified engine for both CV + cover letter
  - Accepts parameters: material type, current doc ID, job context IDs, and getters/setters for markdown
  - Reuses `useErrorDisplay()` and analytics capture patterns (if present)

### Components to create or update

- None required in this prompt (UI panel is next prompt), but ensure composable returns:
  - `state`, `score`, `details`, `presets`, `note`, `canImprove`, `actions`

### Pages/routes to create or update

- None in this prompt; integration happens in later prompts

### AI operations impact

- Calls **existing evaluator** op/service to compute feedback (do not re-implement scoring)
- Calls `ai.improveMaterial` with:
  - current markdown
  - instruction presets + optional note
  - improvementContext derived from evaluation output (internal mapping)
  - grounding context payload similar to existing generation ops

### Testing requirements

Vitest:

- Unit test `materialImprovementService` payload builders:
  - improvementContext mapping from evaluation output
  - instruction presets mapping

- Composable tests:
  - state transitions
  - error mapping to deterministic keys
  - overwrite behavior: returned markdown replaces current markdown via injected setter

Playwright (define the single happy path later; here just ensure composable is testable/mocked)

### Acceptance criteria

- [ ] One composable powers both CV + letter improvement
- [ ] No duplicated orchestration logic between pages
- [ ] Deterministic state machine + deterministic error keys
- [ ] Improvement overwrites markdown via a single pathway (no forks)
- [ ] Payload builders are covered by unit tests

---

## 3) Title

**C3 UI — Build `MaterialFeedbackPanel` (Nuxt UI) With Presets Multi-Select + “Score First, Expand for Details”**

### Intro

C3 lives inside existing CV and cover letter pages. We need a reusable Nuxt UI panel that shows **score by default**, allows expanding details, provides a **shared preset multi-select**, and triggers “Improve” on demand. This prompt exists to implement UI cleanly and consistently with your card patterns and i18n rules.

### Feature scope

**Implement:**

- A single reusable component `MaterialFeedbackPanel.vue`
- Default view: score badge + “Get feedback”
- Expand/collapse details (missing signals, top actions) only when user requests
- Presets multi-select (shared set) + optional note input
- Primary CTA “Improve” (disabled until feedback exists and not busy)
- Uses injected engine/composable (no direct repository calls in component)

**Out of scope:**

- Inline diff viewer
- Section-level suggestions / click-to-jump anchors
- Auto-trigger feedback on page load

### Composables / services / repositories / domain modules

- Consume `useMaterialImprovementEngine` from prompt #2
- Store preset list in a single shared module (e.g., `src/domain/materials/improvementPresets.ts`) and map to i18n labels

### Components to create or update

Create:

- `src/components/materials/MaterialFeedbackPanel.vue`
  - Built with Nuxt UI: `UCard`, `UButton`, `UBadge`, `UAccordion` or `UCollapsible`, `USelectMenu`/chips, `UTextarea`, `USkeleton`
  - Follow “UContainer → UPage → UPageHeader/UPageBody” page patterns (panel itself is a card)

Update (optional):

- Re-use `ApplicationStrengthResultsCard`/`ApplicationStrengthImprovementsCard`/ `ScoreSummaryCard`

### Pages/routes to create or update

- None in this prompt; integration happens next prompts

### AI operations impact

- None directly (component calls `engine.runFeedback()` and `engine.runImprove()`)

### Testing requirements

Vitest component tests:

- Renders score-only state by default
- Expand toggles show details
- Presets multi-select updates engine state
- “Improve” disabled when:
  - no feedback yet
  - engine busy

- Emits/executes callbacks correctly (use mocks)

### Acceptance criteria

- [ ] Single component reusable on CV + letter pages
- [ ] Score is visible by default; details are opt-in
- [ ] Presets are multi-select and shared set
- [ ] No hard-coded strings (full i18n)
- [ ] Component is dumb: no direct API calls

---

## 4) Title

**C3 Integration — Add Feedback + Improve Loop to Tailored CV Page (Overwrite Markdown)**

### Intro

CV is one of the two target material types. This prompt exists to integrate the panel and engine into the **existing CV editor page**, ensuring the improvement overwrites current markdown and keeps navigation/breadcrumbs consistent with your app scaffolding.

### Feature scope

**Implement:**

- Add the feedback panel to the tailored CV page (where job context exists)
- Wire:
  - “Get feedback” → existing evaluator call (job + current CV markdown)
  - “Improve” → `ai.improveMaterial` → overwrite markdown in the current CVDocument

- Ensure the overwrite is persisted (existing save/update flow for markdown)

**Out of scope:**

- Creating new CVDocument versions
- New routes
- Auto-refresh feedback after improvement (optional; if included, keep it manual by default)

### Composables / services / repositories / domain modules

Update:

- CV page composable (whatever currently loads/saves markdown) to expose:
  - current markdown getter/setter
  - save method / debounced save hook (reuse existing)
    Add:

- Instantiate `useMaterialImprovementEngine` with:
  - `materialType: "cv"`
  - current markdown
  - job + matching context references

### Components to create or update

Update:

- CV editor page layout to include `MaterialFeedbackPanel` in a consistent place:
  - either a right column panel (if layout supports)
  - or above/below editor in `UPageBody` as a `UCard`

### Pages/routes to create or update

Update existing route (do not add new):

- `/applications/cv/:id` (or wherever tailored CV editing happens)
  Navigation/breadcrumbs:
- Ensure existing breadcrumbs remain correct
- Add a breadcrumb node only if your pattern already supports it (avoid UX churn)

### AI operations impact

- Uses existing evaluation op for feedback
- Calls `ai.improveMaterial` on Improve
- Ensure improvement payload includes job context for tailored docs

### Testing requirements

Vitest page tests:

- Panel renders and can trigger mocked feedback and improve
- Markdown overwrite occurs in editor state

Playwright E2E (partial; final single happy path is defined in prompt #6 if you choose 6 prompts—here keep to unit-level or reuse later)

### Acceptance criteria

- [ ] User can run feedback on-demand from CV page
- [ ] User can select presets + note and improve
- [ ] Improved markdown overwrites current markdown and is persisted
- [ ] Errors show via existing `useErrorDisplay`/`ErrorStateCard` pattern
- [ ] No duplicated CV-specific logic in engine/panel

---

## 5) Title

**C3 Integration + E2E — Add Feedback + Improve Loop to Cover Letter Page and Ship One End-to-End Happy Path**

### Intro

Cover letter is the second target. This prompt exists to replicate the CV integration using the same shared engine + panel, then add **one Playwright happy path** covering the full C3 loop end-to-end.

### Feature scope

**Implement:**

- Integrate `MaterialFeedbackPanel` into cover letter editor page
- Wire it to:
  - on-demand feedback
  - on-demand improvement
  - overwrite markdown persistently

- Add **one** Playwright E2E happy path test for C3 (CV or letter; pick one and keep it stable)

**Out of scope:**

- Multiple E2E flows
- Visual diffs
- Auto re-analysis after improvement

### Composables / services / repositories / domain modules

Update:

- Cover letter page’s markdown load/save composable to allow engine injection
- Instantiate `useMaterialImprovementEngine` with `materialType: "coverLetter"`

### Components to create or update

- No new component: reuse `MaterialFeedbackPanel`

### Pages/routes to create or update

Update existing route:

- `/applications/cover-letters/:id` (or current cover letter editor route)
  Breadcrumbs:
- Keep existing structure; do not introduce a new breadcrumb system

### AI operations impact

- Same as CV integration:
  - evaluator op used for feedback
  - `ai.improveMaterial` used for rewrite

### Testing requirements

Vitest:

- Cover letter page integration test (mock engine; ensure overwrite)

Playwright (single happy path for EPIC):

- Scenario:
  1. Navigate to a known tailored material page (prefer one with job context available)
  2. Click “Get feedback”
  3. Assert score appears (default view)
  4. Select 1–2 presets (multi-select)
  5. Click “Improve”
  6. Assert markdown content changes (simple string change assertion)
  7. Optional: open “details” and ensure it renders (no deep content assertions)

Keep it deterministic:

- mock AI ops at network layer if your E2E already does
- or use sandbox fixtures with stable responses

### Acceptance criteria

- [ ] Cover letter page has the same C3 UX as CV page
- [ ] Improvement overwrites existing markdown and persists
- [ ] Only one shared preset list is used across both materials
- [ ] One Playwright happy path passes reliably in CI
- [ ] No new models, no new routes, no duplicated logic

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
