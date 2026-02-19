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

---

---

---

## Master Prompt 1 — Landing Data Model: Pipeline Dashboard Derivations (No New Schema)

1. **Title**
   LND-1: Implement “Pipeline Dashboard Mode” data derivations (todo/active/done/stalled + focus list)

2. **Intro: context + why**
   With EPIC B0, the Kanban becomes the heartbeat. The landing page must shift from “last modified jobs” to “what should I do next”, without showing the full board. Because users can rename stages, the landing must derive behavior from **stage keys** (`todo`, `done`) and treat everything else as “active”. This prompt creates a deterministic, testable derivation layer that powers the new landing sections.

3. **Feature scope**
   Implement:
   - Derivation logic from `JobDescription.kanbanStatus` and `KanbanSettings.stages`:
     - `todoJobs` where status === `todo`
     - `doneJobs` where status === `done`
     - `activeJobs` where status !== `todo` && !== `done`

   - “Focus Today” list:
     - up to 3 jobs, prioritized: active first, then todo
     - stable sort (e.g., by `updatedAt` desc; if not available use `createdAt` desc)

   - “Stalled” list:
     - jobs not done whose `updatedAt` (or equivalent) older than N days (e.g., 7), excluding brand-new jobs if needed

   - Pipeline summary counts: { todoCount, activeCount, doneCount }
     Explicitly out of scope:
   - No new models or schema changes.
   - No reminders or nudges (C5).
   - No analytics dashboards.
   - No AI operations.

4. **Composables / services / repositories / domain modules**
   Create a composable + pure helper module:
   - `useLandingPipelineDashboard()` (or `usePipelineDashboardSummary()`):
     - loads `KanbanSettings` and job list using existing repositories/composables
     - exposes computed arrays: `focusJobs`, `todoJobsPreview`, `activeJobsPreview`, `stalledJobsPreview`, `counts`
     - exposes a deterministic “view state” enum: `empty|todoOnly|active|allDone`

   - Pure helpers (unit-testable):
     - `derivePipelineBuckets(jobs, stages)` (handles unknown status fallback to todo)
     - `rankFocusJobs(buckets)` (stable ordering)
     - `computeStalled(jobs, now, thresholdDays)`
       Reuse existing job list fetching (avoid duplicating GraphQL queries used in `/jobs` or pipeline page).

5. **Components to create or update**
   None required in this prompt (derivation layer only), aside from possibly a minimal “loading state card” if the composable demands it (prefer existing patterns).

6. **Pages/routes to create or update**
   None.

7. **AI operations impact**
   None. Confirm no AI ops are added or invoked.

8. **Testing requirements**
   Vitest unit tests for helpers:
   - Unknown kanbanStatus → falls back to `todo`
   - Correct bucketing counts for varied job sets
   - Focus ranking is stable and respects priority order
   - Stalled logic based on threshold days
     Vitest composable tests:
   - `useLandingPipelineDashboard` returns correct `viewState` for each scenario (no jobs / todo-only / active / all-done)

9. **Acceptance criteria**
   - [ ] Deterministic bucketing and focus ranking implemented with pure helper tests.
   - [ ] Uses stage keys (`todo`, `done`), not stage names, so renaming is safe.
   - [ ] No schema changes; no AI ops; no extra GraphQL calls beyond reusing existing data access patterns.
   - [ ] TS strict + Vitest pass.

---

## Master Prompt 2 — Landing UI: Pipeline Summary Bar + Focus Today Section

1. **Title**
   LND-2: Replace post-onboarding landing “Active jobs” with Pipeline Summary Bar + Focus Today cards

2. **Intro: context + why**
   Current landing shows last modified jobs and actions to generate materials. With Kanban now the heartbeat, landing should present a compact pipeline view and “Focus Today” to drive momentum. This prompt introduces the two highest-value sections without showing full Kanban.

3. **Feature scope**
   Implement:
   - A compact “Pipeline Summary Bar” (counts only): To Start / Active / Done
   - “Your Focus Today” section:
     - up to 3 cards from `focusJobs`
     - each card shows: Job title, Company, Created date, current stage display name
     - primary CTA: “Open in Pipeline” (navigate to pipeline page)
     - optional secondary CTA: “View job” (only if consistent with your nav)
       Explicitly out of scope:

   - No full Kanban on landing.
   - No drag and drop here.
   - No per-card material generation actions on landing (keep those in job/app flows).

4. **Composables / services / repositories / domain modules**
   - Consume `useLandingPipelineDashboard()` from LND-1.
   - If you have shared “Card list” patterns (e.g., for jobs list), reuse them.
   - Add an adapter function: `getStageLabel(stageKey, settingsStages)` to display renamed stage names.

5. **Components to create or update**
   Create:
   - `PipelineSummaryBarCard` (or `PipelineSummaryBar`):
     - simple row of count badges (Nuxt UI `UBadge` or equivalent)

   - `FocusJobCards` section component:
     - wraps card list rendering
       Update:

   - Replace existing “Active jobs” landing section with these components.
     Keep scaffold: `UContainer → UPage → UPageHeader/UPageBody`.

6. **Pages/routes to create or update**
   Update the landing page (`/`):
   - Post-onboarding mode: show Summary + Focus Today
     Breadcrumb behavior:
   - Home should remain “Home” (or “Dashboard”), consistent with existing breadcrumb-driven titles .
     Navigation:
   - “Open in Pipeline” should route to the pipeline page (existing B0 route).

7. **AI operations impact**
   None.

8. **Testing requirements**
   Vitest component/page tests:
   - summary counts render correctly for each `viewState`
   - focus list renders max 3 cards, correct stage labels even if renamed
   - CTA navigates to pipeline route (mock router)
     Playwright (defer to final EPIC E2E prompt or include here if you prefer one):
   - post-onboarding user sees Summary + Focus Today and can click to pipeline.

9. **Acceptance criteria**
   - [ ] Landing no longer displays “last modified 3 jobs” section.
   - [ ] Landing shows pipeline counts and focus jobs derived by keys, not names.
   - [ ] Navigation to pipeline works and is consistent with breadcrumb system.
   - [ ] No DnD on landing; no AI ops.

---

## Master Prompt 3 — Landing UI: Ready to Move + Stalled Sections (Momentum Without C5)

1. **Title**
   LND-3: Add “Opportunities waiting” (ToDo preview) and “Stalled” sections to landing

2. **Intro: context + why**
   Users need direction, not a grid. Beyond “Focus Today”, the landing should highlight (1) jobs waiting in ToDo and (2) jobs that haven’t moved in a while. This provides momentum support without implementing reminders or full coaching (C5).

3. **Feature scope**
   Implement:
   - “Opportunities waiting” section:
     - only shown if `todoCount > 0`
     - show 1–2 job previews + “View in Pipeline” CTA

   - “Stalled” section:
     - only shown if `stalledJobs.length > 0`
     - show 1–2 job previews + CTA

   - Keep copy and tone gentle.
     Explicitly out of scope:
   - No notifications/reminders.
   - No forced actions or modals.
   - No scoring analytics.

4. **Composables / services / repositories / domain modules**
   - Consume `todoJobsPreview` and `stalledJobsPreview` from `useLandingPipelineDashboard()`.
   - Ensure the stalled heuristic uses a single constant threshold (e.g., 7 days) defined in one place (no magic numbers scattered).

5. **Components to create or update**
   Create:
   - `TodoPreviewSection`
   - `StalledPreviewSection`
     Both should reuse a shared `JobPreviewCard` component if one exists; otherwise create a single shared “job mini card” variant used in both.

6. **Pages/routes to create or update**
   Update `/` landing:
   - Render these sections below “Focus Today”
   - Keep layout balanced (avoid very long page)
   - Ensure empty states don’t create awkward whitespace

7. **AI operations impact**
   None.

8. **Testing requirements**
   Vitest page/component tests:
   - “Opportunities waiting” appears only when todo > 0
   - “Stalled” appears only when stalled > 0
   - Stage label shown is derived from settings name
     Playwright happy path is covered in the final EPIC E2E.

9. **Acceptance criteria**
   - [ ] Landing shows ToDo + Stalled previews only when relevant.
   - [ ] CTAs route to pipeline.
   - [ ] No new data models; no AI ops; deterministic logic.

---

## Master Prompt 4 — View States + Empty States (No Jobs / Todo Only / Active / All Done)

1. **Title**
   LND-4: Implement landing “view states” and empty-state messaging aligned with gentle coach tone

2. **Intro: context + why**
   Landing should feel alive and contextual. Users may have no jobs, only todo jobs, active jobs, or all done. This prompt makes landing respond to these states with clear messaging and the right primary CTA, improving “feel of control” and retention.

3. **Feature scope**
   Implement:
   - `viewState` mapping (from LND-1): `empty|todoOnly|active|allDone`
   - Show a top-of-page banner/card:
     - `empty`: prompt “Analyze your first job”
     - `todoOnly`: “You have opportunities waiting—move one forward”
     - `active`: “You have active opportunities—keep momentum”
     - `allDone`: “Pipeline is empty—add new opportunities”

   - Primary CTA always visible and consistent: “Analyze job” or “Open pipeline”
     Explicitly out of scope:
   - No reminders.
   - No gamification beyond simple copy.

4. **Composables / services / repositories / domain modules**
   - Use `viewState` from `useLandingPipelineDashboard()`.
   - Reuse existing CTA patterns and button components (avoid duplicating “Analyze job” logic).

5. **Components to create or update**
   Create:
   - `LandingNextStepBannerCard`
     - includes message + primary CTA
     - optionally shows counts
       Keep copy short; match existing tone and i18n patterns.

6. **Pages/routes to create or update**
   Update `/` landing:
   - Banner at top of `UPageBody` above summary/focus sections.
   - Hook “Analyze job” CTA to existing job creation/analyze entry route (`/jobs/new` or current flow).

7. **AI operations impact**
   None.

8. **Testing requirements**
   Vitest:
   - banner content switches correctly by viewState
   - CTA targets correct route
     i18n coverage test updates if you add new keys.

9. **Acceptance criteria**
   - [ ] Landing displays the correct banner for each state.
   - [ ] Primary CTA always available.
   - [ ] i18n keys added and covered by existing key coverage tests .

---

## Master Prompt 5 — End-to-End: Replace Old Landing Section + Single E2E Happy Path

1. **Title**
   LND-5: Integrate new landing pipeline dashboard end-to-end + one Playwright happy path

2. **Intro: context + why**
   This ties everything together: the old landing “Active jobs / last modified jobs + generate materials” flow is replaced by the new pipeline-centric sections. We must ensure we didn’t regress onboarding behavior and that the landing works reliably regardless of stage renaming.

3. **Feature scope**
   Implement:
   - Remove/disable the old post-onboarding landing jobs section and material CTAs.
   - Ensure onboarding landing experience remains intact for users still in onboarding mode.
   - Ensure stage renaming affects labels displayed, but does not break bucketing/logic.
     Explicitly out of scope:
   - No new onboarding features.
   - No new analytics dashboards.

4. **Composables / services / repositories / domain modules**
   - Ensure the landing composes:
     - onboarding mode logic (existing)
     - pipeline dashboard mode logic (new)

   - Avoid double fetching jobs/settings (centralize fetch in one composable and pass down).

5. **Components to create or update**
   - Update landing page composition:
     - `LandingNextStepBannerCard`
     - `PipelineSummaryBar`
     - `FocusTodaySection`
     - `TodoPreviewSection`
     - `StalledPreviewSection`
       Ensure consistent spacing and skeleton/loading states (reuse existing loading components).

6. **Pages/routes to create or update**
   - Update `/` landing
   - Ensure breadcrumbs and page titles remain correct and consistent with existing breadcrumb-driven system .
   - Ensure navigation links to `/pipeline` (or chosen route) and `/jobs/new` are correct.

7. **AI operations impact**
   None.

8. **Testing requirements**
   Vitest:
   - Landing page test cases for:
     - onboarding mode still shows onboarding next steps
     - post-onboarding mode shows pipeline dashboard sections
     - stage rename changes label display but not counts/bucketing
       Playwright (single happy path):

   - Setup: user is post-onboarding and has KanbanSettings with renamed stages (e.g., `applied` name changed to “Sent”).
   - Steps:
     1. Visit `/` landing → verify Summary counts appear
     2. Verify “Focus Today” shows a job in an active stage and displays renamed stage name
     3. Click “Open in Pipeline” → lands on pipeline page
     4. Return to `/` → verify still consistent
        Keep it stable: no drag/drop required in this E2E (B0 covers DnD); this EPIC validates landing correctness.

9. **Acceptance criteria**
   - [ ] Old post-onboarding landing “last modified jobs + generate materials” is removed/replaced.
   - [ ] New landing shows summary + focus + todo/stalled sections as appropriate.
   - [ ] Logic depends on stage keys (`todo`, `done`) not names; renaming stages updates labels only.
   - [ ] Onboarding mode remains unchanged.
   - [ ] One Playwright happy path passes; Vitest coverage added; TS strict & lint pass.
