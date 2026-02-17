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

## Master Prompt 1 — GraphQL Model Extensions + Data Defaults (JobDescription + KanbanSettings)

1. **Title**
   B0-1: Extend GraphQL models for Kanban tracking (JobDescription.kanbanStatus + notes) and user KanbanSettings

2. **Intro (context + why)**
   EPIC B0 V1 introduces a global Kanban board where each card is a `JobDescription`. We must add a separate `kanbanStatus` (do not replace existing `JobDescription.status` lifecycle) and add `notes` directly on the job. We also need per-user Kanban stage configuration, similar in spirit to existing settings models (e.g., CVSettings). The goal is minimal but solid schema changes that unblock UI while keeping YAGNI.

3. **Feature scope**
   Implement:
   - Add `kanbanStatus` field to `JobDescription` (string key referencing a stage).
   - Add `notes` field to `JobDescription` (string).
   - Add new model `KanbanSettings` (1 per user) containing a stages array of `{ key, name, isSystemDefault }`.
   - Provide defaults:
     - New/imported jobs default `kanbanStatus = "todo"`.
     - KanbanSettings default stages: `todo`, `applied`, `interview`, `done` with ToDo/Done locked.
       Explicitly out of scope:

   - No reminders, no checklists, no analytics, no per-stage notes.
   - No forward-only constraints.
   - No AI ops.

4. **Composables / services / repositories / domain modules**
   Update/create domain modules consistent with current clean layering:
   - `job` domain: update JobDescription repository to read/write `kanbanStatus` and `notes`.
   - `settings` domain (or new `kanban` domain): create repository for `KanbanSettings` with:
     - `getOrCreateKanbanSettings(userId)`
     - `updateKanbanStages(userId, stages[])`
     - `ensureSystemStages(stages)` helper (enforce todo/done presence).
       Ensure DRY with existing settings patterns (reuse base repository helpers if present).

5. **Components**
   None required in this prompt.

6. **Pages/routes**
   None required in this prompt.

7. **AI operations impact**
   None. Confirm no new AI operations are added.

8. **Testing requirements**
   Vitest (unit):
   - `ensureSystemStages` guarantees `todo` and `done` exist and are marked system defaults.
   - `sanitizeStages` (if created) ensures stage keys are unique and stable.
   - `getOrCreateKanbanSettings` returns defaults when missing.
   - Default job creation sets `kanbanStatus = "todo"`.
     No Playwright in this prompt.

9. **Acceptance criteria (checklist)**
   - [ ] `JobDescription` schema includes `kanbanStatus` and `notes` with sensible defaults.
   - [ ] `KanbanSettings` schema exists and persists `stages[]` objects.
   - [ ] Deterministic default stages created if settings missing.
   - [ ] System stages `todo` and `done` cannot be removed at repository/service level (guardrails).
   - [ ] All changes compile in TS strict mode; GraphQL types updated; tests pass.

---

## Master Prompt 2 — Kanban Stage Settings UI (Settings Page + TagInput-like List Editing)

1. **Title**
   B0-2: Build Kanban stage settings (add/remove/reorder/rename) with locked system stages

2. **Intro (context + why)**
   EPIC B0 V1 allows users to customize their Kanban board stages globally. We need a settings UI that follows existing “list editing” UX patterns (TagInput-based editing, DRY card layout, deterministic validation). ToDo and Done must always exist and cannot be removed. This page is foundational for the Kanban board rendering.

3. **Feature scope**
   Implement:
   - New settings page to edit `KanbanSettings.stages`.
   - Features:
     - Reorder stages
     - Rename stage display name
     - Add a new custom stage (generate unique stable `key`)
     - Remove a stage (except `todo` and `done`)

   - Persist changes via repository/service.
     Explicitly out of scope:
   - Per-stage checklists, reminders, analytics.
   - Stage colors or advanced styling.
   - Bulk migration of existing jobs across renamed keys (avoid key renames; allow name edits only).

4. **Composables / services / repositories / domain modules**
   Create composable aligned with project patterns:
   - `useKanbanSettings()`:
     - `state: { stages, isLoading, error }`
     - `load()`, `save(stages)`
     - `addStage(name)`, `removeStage(key)`, `moveStage(from,to)`, `renameStage(key,name)`
     - enforce invariants via shared helpers (`ensureSystemStages`)

   - If you already have `useSettingsEngine`/`useCanvasEngine` style abstractions, reuse the same “load/save/error” shape.

5. **Components**
   Create reusable settings components:
   - `KanbanStageListEditorCard` (Nuxt UI Card pattern)
     - list rows with drag handles (if existing sortable pattern exists, reuse it)
     - rename inline (UInput)
     - delete button disabled for system stages

   - Keep UI consistent: `UPageHeader`, `UPageBody`, `UCard`, `UButton`, `UInput`, `UFormGroup`.

6. **Pages/routes**
   Create:
   - `/settings/kanban` (or `/settings/pipeline` — pick the convention used in repo)
     Navigation/breadcrumbs:
   - Add to existing settings nav.
   - Ensure breadcrumb/title consistent with current “breadcrumb-driven page titles” system .

7. **AI operations impact**
   None.

8. **Testing requirements**
   Vitest:
   - Component tests for editor behaviors:
     - cannot delete `todo`/`done`
     - add stage generates unique key
     - reorder updates list deterministically

   - Page test:
     - loads default settings if none exist
     - persists and reloads correctly
       Playwright (single happy path for this prompt only if you prefer splitting; otherwise defer to final EPIC E2E):

   - Visit settings page → add custom stage → save → refresh → stage persists.

9. **Acceptance criteria**
   - [ ] Settings page exists and is reachable via navigation.
   - [ ] Users can add/remove/reorder/rename stage **names**.
   - [ ] `todo` and `done` are always present and cannot be removed.
   - [ ] Stage keys remain stable; renaming does not change keys.
   - [ ] Errors handled via existing error pattern (`useErrorDisplay` / `ErrorStateCard` if applicable) .
   - [ ] TS strict, lint, unit tests pass.

---

## Master Prompt 3 — Kanban Board Page (Drag & Drop + Persist kanbanStatus)

1. **Title**
   B0-3: Implement global Kanban board page for JobDescriptions with drag & drop between columns

2. **Intro (context + why)**
   The Kanban is the “heartbeat” operational view: one board per user, cards represent `JobDescription`, and column membership is driven by `JobDescription.kanbanStatus`. This prompt implements the core UX: render stages from settings, show job cards, allow drag-and-drop across columns, and persist status changes. Keep it simple and deterministic.

3. **Feature scope**
   Implement:
   - New Kanban page displaying columns based on `KanbanSettings.stages` order.
   - Fetch all JobDescriptions for user (existing jobs list query patterns).
   - Group by `kanbanStatus` → render cards.
   - Drag & drop a card from any column to any column:
     - update local state optimistically
     - persist `kanbanStatus` on the JobDescription
     - handle failure with rollback + toast/error UI (existing pattern)

   - Fallback behavior:
     - if a job has unknown `kanbanStatus` → treat as `todo`
       Explicitly out of scope:

   - No WIP limits, no swimlanes, no filtering/search (unless trivial and already available).
   - No auto stage transitions.
   - No reminders, checklists, analytics.

4. **Composables / services / repositories / domain modules**
   Create composables aligned with existing “engine” patterns:
   - `useKanbanBoard()`:
     - dependencies: `useKanbanSettings()`, `useJobsRepository()`
     - `columns: { stage, jobs[] }[]` computed
     - `moveJob(jobId, toStageKey)` action with optimistic update + persistence
     - `normalizeJobStatus(job, stages)` helper

   - Ensure DRY: if there’s an existing jobs list composable used in `/jobs`, reuse it rather than re-querying.

5. **Components**
   - `KanbanBoard` (layout wrapper)
   - `KanbanColumn` (renders stage header + droppable area)
   - `KanbanJobCard` (reusable card pattern)
     - shows title, company, created date, optional strength badge (see separate prompt)
       Use Nuxt UI components for structure. For drag & drop, use an existing library already in repo; if none exists, implement minimal native HTML5 DnD with clean TS typing (no new frameworks).

6. **Pages/routes**
   Create:
   - `/pipeline` or `/applications` (choose the canonical route; project status mentions `/applications` exists but might be materials-related—be consistent)
     Navigation/breadcrumbs:
   - Add to main nav.
   - Breadcrumb shows “Pipeline” (or chosen name).
   - Ensure page title is set through the breadcrumb/title system.

7. **AI operations impact**
   None. Do not call AI ops from this page.

8. **Testing requirements**
   Vitest:
   - `useKanbanBoard` unit tests:
     - grouping by stages
     - unknown status fallback → todo
     - optimistic update + rollback on repo failure (mock)

   - Component test for `KanbanJobCard` rendering required fields.
     Playwright (EPIC-level happy path can be done here or final prompt):
   - Create/import job → appears in ToDo
   - Drag to Applied → persists after refresh

9. **Acceptance criteria**
   - [ ] Board renders columns in user-configured order.
   - [ ] Cards = JobDescriptions; unknown status falls back to ToDo.
   - [ ] Drag & drop moves card and persists `kanbanStatus`.
   - [ ] Failure handling is deterministic (rollback + visible error).
   - [ ] No AI ops invoked; performance acceptable (no excessive GraphQL calls).
   - [ ] Tests pass (unit + component + E2E baseline as planned).

---

## Master Prompt 4 — Job Notes Field (Edit + Persist on JobDescription)

1. **Title**
   B0-4: Add free-text notes on JobDescription (simple string) and integrate into job detail UX

2. **Intro (context + why)**
   EPIC B0 V1 requires simple global notes per job (not stage-dependent). Notes support “rejection reason”, follow-ups, and interview feedback without introducing a new note entity. This should be a small, safe enhancement integrated into existing job detail/edit flows.

3. **Feature scope**
   Implement:
   - `notes: string` display and editing UI on JobDescription detail page (or an existing edit form).
   - Persist changes to GraphQL.
   - Ensure notes are accessible from Kanban navigation (card click leads to job details).
     Explicitly out of scope:
   - No per-stage notes, no note history/timestamps, no rich text.
   - No AI summarization or extraction.

4. **Composables / services / repositories / domain modules**
   Update job repository and job detail composable:
   - Add `updateJobNotes(jobId, notes)` method.
   - Reuse existing `useJobDetails()` / `useJobEditor()` patterns if present.
   - Add minimal validation (max length if you already have a standard; otherwise keep simple).

5. **Components**
   - Update existing Job detail page card:
     - `UTextarea` bound to notes
     - Save button or auto-save pattern (prefer existing conventions in app)

   - Reuse existing `Card` and error patterns.

6. **Pages/routes**
   Update:
   - `/jobs/:id` (or whichever job details route exists)
     Ensure navigation from Kanban card lands here.

7. **AI operations impact**
   None.

8. **Testing requirements**
   Vitest:
   - repository update method called with correct payload
   - page/component test: notes field renders and persists
     Playwright:
   - From Kanban → open a job → edit notes → save → refresh → notes persist

9. **Acceptance criteria**
   - [ ] Notes field exists on JobDescription and can be edited.
   - [ ] Notes persist reliably with deterministic error handling.
   - [ ] Notes are accessible via Kanban → job detail navigation.
   - [ ] No new models or AI ops added.
   - [ ] Tests pass.

---

## Master Prompt 5 — Strength Score Badge on Kanban Card (Read-Only, No New Computation)

1. **Title**
   B0-5: Show Application Strength badge on Kanban cards (read-only) without triggering evaluation

2. **Intro (context + why)**
   You want the Kanban card to optionally display a strength score badge if available. EPIC A2 already exists with application strength evaluation and a dedicated page . For B0 V1, we must keep Kanban fast and deterministic: show the latest known score if it exists, but do not compute or refresh it here.

3. **Feature scope**
   Implement:
   - Display a small badge on `KanbanJobCard` if a score is already stored/available in the data model.
   - If no score exists, render nothing (no placeholder).
     Explicitly out of scope:
   - No calling `ai.evaluateApplicationStrength` from Kanban.
   - No “strength vs outcome” analytics.
   - No background refresh.

4. **Composables / services / repositories / domain modules**
   - Identify the current persistence location for strength evaluation results (existing model/page state from A2).
   - Add a lightweight selector:
     - `getLatestStrengthScore(jobId)` or enrich job list query if the score is denormalized.

   - Keep it DRY: do not duplicate A2 evaluation logic; only consume stored results.

5. **Components**
   - Update `KanbanJobCard`:
     - add `UBadge` (or existing badge component)
     - show score + optional label (e.g., “Strength 72” or a short category)

   - Ensure consistent formatting with existing score UI in `/jobs/:id/application-strength` .

6. **Pages/routes**
   None required, but card click should still navigate to job detail (or strength page if you already link it elsewhere—do not change behavior without a clear pattern).

7. **AI operations impact**
   None. Explicitly verify no AI ops invoked.

8. **Testing requirements**
   Vitest:
   - card renders badge when score present
   - no badge when missing
   - no calls to A2 evaluation op from Kanban context
     Playwright (optional if already covered):
   - Ensure badge visible for a job with known score

9. **Acceptance criteria**
   - [ ] Strength badge displays only when existing data is available.
   - [ ] No computation/evaluation triggered from Kanban.
   - [ ] UI remains performant; no extra GraphQL calls per card beyond an approved query shape.
   - [ ] Tests pass.

---

### Recommended EPIC-Level Playwright Happy Path (single test)

If you want **one** E2E to cover EPIC B0 V1 end-to-end, implement:

1. Ensure user has default Kanban settings
2. Import/create a job → verify it appears in **ToDo**
3. Drag job ToDo → Applied → refresh → persists
4. Open job detail → add notes → refresh → persists
5. (Optional) If fixture has strength score, verify badge appears

This aligns with your “single happy path” philosophy and keeps E2E stable .
