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

## Master Prompt 1 — Documentation + Contract Alignment for EPIC 4 (Speech)

### 1) Title

EPIC 4 — Align docs + AI Interaction Contract to single `ai.generateSpeech` (job optional)

### 2) Intro

We’re starting EPIC 4 implementation. Current docs are inconsistent: speech is referenced both as generic and tailored, and the AI contract currently defines `ai.generateUserSpeech` (not `ai.generateSpeech`) and includes a “no job targeting” rule, which conflicts with our “job optional tailoring” strategy. Fix docs/contracts first to prevent implementation drift.

### 3) Feature scope

**In scope**

- Update documentation and AI Interaction Contract to reflect the final decisions:
  - single op: `ai.generateSpeech`
  - optional `jobDescription` input enables tailored variant
  - routes: `/speech` and `/speech/[id]` (CV pattern)

- Update conceptual notes to clarify `SpeechBlock.jobId` is optional (tailoring comes later through same op)

**Out of scope**

- No production code changes beyond what is necessary to keep docs/contracts consistent with implementation (no UI building yet)
- No EPIC 6 pages/routes

### 4) Composables / services / repositories / domain modules

- None (doc-only), but call out any “naming changes” that the implementation must follow (operation name, schema key names).

### 5) Components

- None.

### 6) Pages/routes

- Ensure docs state:
  - List page: `/speech`
  - Detail editor: `/speech/[id]`

### 7) AI operations impact

Update **AI_Interaction_Contract.md**:

- Rename `ai.generateUserSpeech` → `ai.generateSpeech`
- Update **System Prompt rule**:
  - If `jobDescription` is absent → generic speech (no job targeting)
  - If `jobDescription` is present → tailor phrasing to role/job needs **without inventing facts**

- Ensure **Output Schema keys** exactly match what will be persisted in `SpeechBlock` (`elevatorPitch`, `careerStory`, `whyMe`) (avoid mismatches like “whyMeStatement” vs “whyMe”).

Update **Component_Page_Mapping.md**:

- Remove `ai.generateTailoredSpeech` references; keep a single `ai.generateSpeech`
- Update routes for speech from the planned `/applications/[jobId]/speech` to `/speech/[id]` and note tailoring occurs via optional job input (later)

Update **Conceptual_Data_Model.md**:

- Clarify SpeechBlock ↔ JobDescription relationship is **optional** (job-tailored speech is still SpeechBlock, with jobId nullable).

### 8) Testing requirements

- No tests (doc-only change), but ensure schemas are deterministic and validate-able.

### 9) Acceptance criteria

- [ ] AI Interaction Contract contains **`ai.generateSpeech`** (not `ai.generateUserSpeech`)
- [ ] Contract explicitly defines **optional job tailoring** behavior
- [ ] Output schema keys match persisted entity fields exactly: `elevatorPitch`, `careerStory`, `whyMe`
- [ ] Component/Page mapping references `/speech` + `/speech/[id]` and a single AI op
- [ ] Conceptual model clarifies `jobId` optional for SpeechBlock

---

## Master Prompt 2 — SpeechBlock Backend Model + Domain Layer (Repo/Service/Composables)

### 1) Title

EPIC 4 — Implement SpeechBlock CRUD domain layer (Amplify Gen2 + strict TS)

### 2) Intro

EPIC 4 is currently blocked because the SpeechBlock model exists but there is no domain layer (repository/service/composable). PROJECT_STATUS explicitly lists SpeechBlock model as implemented but everything else missing.

### 3) Feature scope

**In scope**

- Ensure GraphQL model for `SpeechBlock` supports:
  - required: `elevatorPitch`, `careerStory`, `whyMe`
  - relationship to `UserProfile` (owner)
  - optional relationship to `JobDescription` (future tailoring; keep nullable)
  - created/updated timestamps (follow existing conventions)

- Implement:
  - `SpeechBlockRepository` (CRUD)
  - `SpeechBlockService` (business rules + orchestration helpers)
  - composables: `useSpeechBlocks()` (list) and `useSpeechBlock(id)` (single), consistent with `useCVDocument(s)` patterns

**Out of scope**

- No AI operation implementation here
- No UI pages/components (those are separate prompts)
- No EPIC 6 job-tailoring page

### 4) Composables / services / repositories / domain modules

Create/update:

- `src/domain/speech/SpeechBlockRepository.ts`
- `src/domain/speech/SpeechBlockService.ts`
- `src/application/useSpeechBlocks.ts` (list + search/filter pattern if applicable)
- `src/application/useSpeechBlock.ts` (single CRUD)
- Types + mapper utilities consistent with existing domain conventions (no `any`, strict nullability)

Business rules (service level):

- “One generic speech block” recommendation can be enforced at UI later; service should be flexible:
  - allow multiple speech blocks
  - allow optional `jobId` (nullable)

- Add helper to “create draft SpeechBlock” (empty strings) for new flows if that matches CV patterns.

### 5) Components

- None in this prompt.

### 6) Pages/routes

- None in this prompt.

### 7) AI operations impact

- None. Domain layer must be ready to persist AI results later.

### 8) Testing requirements

Add Vitest unit tests:

- Repository CRUD happy path + error path (mock GraphQL client the same way as other repos)
- Service methods:
  - create/update validation (e.g., trimming, empty handling rules if you adopt them)
  - optional jobId behavior

- Composables:
  - loading/error state
  - list refresh after create/delete
  - optimistic update rules if used elsewhere

### 9) Acceptance criteria

- [ ] SpeechBlock CRUD works via repository/service/composables
- [ ] Strict TS types, no `any`, correct nullable job relationship
- [ ] Unit tests cover repository/service/composables (happy + error paths)
- [ ] Conventions match existing entities (naming, folder structure, error handling)

---

## Master Prompt 3 — Implement `ai.generateSpeech` Operation (Lambda + strict schema + fallback)

### 1) Title

EPIC 4 — Add AI operation `ai.generateSpeech` with strict JSON schema validation + fallback

### 2) Intro

EPIC 4 is blocked by the missing AI operation. The system uses a deterministic registry of AI operations with strict input/output schemas and fallback behavior. Speech generation must output JSON only. High-level intended sections are in roadmap/status docs: elevator pitch, career story, why-me.

### 3) Feature scope

**In scope**

- Implement `ai.generateSpeech` in the AI-Operations Lambda layer:
  - build prompt deterministically
  - validate response strictly against schema
  - implement contract-compatible fallback (retry once, then return safe empty JSON + needsUpdate flag if that’s the system pattern)

- Input must support:
  - user identity data (UserProfile + optionally PersonalCanvas)
  - selected experiences/stories summary (use existing patterns from CV/matching operations)
  - optional `jobDescription` (string or structured summary) to tailor output

- Output must be:
  - `{ elevatorPitch: string, careerStory: string, whyMe: string }` only (no extra keys)

**Out of scope**

- No UI calls directly into AI layer (must be orchestrated via composable/service)
- No streaming, no free-text
- No EPIC 6 tailoring engine

### 4) Composables / services / repositories / domain modules

- Add operation registration in existing AI ops registry (mirror `ai.generateMatchingSummary` or `ai.generateCv` patterns).
- Add small shared helper if needed for “speech prompt input building” (but avoid duplication; reuse existing aggregation utilities if any exist for profile/stories).

### 5) Components

- None.

### 6) Pages/routes

- None.

### 7) AI operations impact

Operation: `ai.generateSpeech`

**Input (recommendation)**

- `userProfile` minimal set (headline, strengths, goals, values, etc.)
- `personalCanvas` optional summary fields if already used elsewhere
- `experiences` / `stories` condensed arrays (strings), consistent with earlier “no objects in arrays unless contract says so” rules used in the contract
- `jobDescription?` optional string: if present, tailor; if absent, generic

**Output**

- Strict schema (exact keys):
  - `elevatorPitch: string`
  - `careerStory: string`
  - `whyMe: string`

**Validation & fallback rules**

- Validate JSON parse + schema exactness (no extra keys).
- Retry once with stricter “JSON only, exact keys” instruction.
- If still invalid: return fallback JSON with empty strings + set a `needsUpdate` flag only if your standard pattern supports it; otherwise keep empty strings but ensure UI stability. (Align with contract-wide fallback approach.)

### 8) Testing requirements

Vitest:

- AI operation unit tests with mocked model output:
  - valid output passes validation
  - extra keys rejected
  - invalid JSON triggers retry then fallback
  - jobDescription present changes prompt (assert prompt content includes job section)
    Sandbox E2E (if you follow the existing pattern like generateCv):

- GraphQL invocation of deployed lambda returns schema-valid JSON

### 9) Acceptance criteria

- [ ] `ai.generateSpeech` exists in registry and can be invoked via GraphQL
- [ ] Output is always strict JSON matching schema exactly
- [ ] Optional `jobDescription` influences prompt but does not change schema
- [ ] Retry + fallback works and is tested
- [ ] Tests exist: unit + sandbox E2E (if used in this repo for other ops)

---

## Master Prompt 4 — Speech UI Components + Editor Pattern (Nuxt UI, composable-first)

### 1) Title

EPIC 4 — Build Speech editor components (sections + generate/regenerate + save)

### 2) Intro

We need a consistent UI to view/edit the three speech sections, with a “Generate” action driven by the AI op. Use existing Nuxt UI scaffolds and “Card patterns”, and keep pages thin by pushing logic into composables/services (similar to CV + matching pages).

### 3) Feature scope

**In scope**

- Create reusable components for editing a SpeechBlock:
  - Three sections: Elevator pitch, Career story, Why me
  - Generate/regenerate controls
  - Save/cancel behaviors with dirty-state management

- Reuse existing design patterns:
  - `<UContainer> → <UPage> → <UPageHeader>/<UPageBody>`
  - `UCard` sections
  - consistent loading/error/empty states

**Out of scope**

- No job-specific tailoring UI yet (just keep the optional hook in place)
- No cross-export to CV/letter
- No rich text editor unless already used; default to `<UTextarea>` like planned

### 4) Composables / services / repositories / domain modules

Create/update:

- `useSpeechEngine()` (or similar) orchestration composable:
  - fetch required context (profile/canvas/stories) using existing composables
  - call backend service method that triggers AI op
  - merge AI output into editable local state
  - handle retry/fallback display states cleanly

- Keep persistence via `useSpeechBlock(id)` composable from Prompt 2.

### 5) Components to create or update

Suggested components (reuse naming conventions):

- `SpeechBlockEditorCard.vue` (main editor wrapper)
- `SpeechSectionEditor.vue` (DRY: label + helper copy + textarea + char count)
- `SpeechGenerateButton.vue` (optional: encapsulate loading + tooltip + disabled rules)
- `EmptyStateCard.vue` reuse if exists; otherwise use existing empty state pattern

### 6) Pages/routes to create or update

- `/speech` list page:
  - shows saved speech blocks as cards (CV-style)
  - primary CTA: “Create Speech Block”
  - each item links to `/speech/[id]`

- `/speech/[id]` detail page:
  - breadcrumb: Dashboard → Applications (or Speech) → Speech Block
  - header actions: Save, Generate/Regenerate, Delete (if consistent with other entities)
  - body: 3 section cards

Navigation alignment:

- Add entry in the dashboard/navigation area consistent with “Applications / Speech Builder” placement.

### 7) AI operations impact

- Pages/components must **not** call AI operation directly.
- AI op invoked from the orchestration layer (e.g., `useSpeechEngine()` or service method), consistent with matching rules.
- Inputs sourced deterministically from:
  - UserProfile + PersonalCanvas + selected Experiences/Stories

- Output merged into the editable SpeechBlock model.

### 8) Testing requirements

Vitest:

- Component tests:
  - `SpeechSectionEditor` renders, emits updates, shows validation/char count
  - `SpeechBlockEditorCard` merges AI output into form state

- Page tests:
  - `/speech` list renders empty state + list state
  - `/speech/[id]` loads data and binds fields, save triggers repository update
    Composable tests:

- `useSpeechEngine` builds deterministic AI op input and handles error + fallback states

### 9) Acceptance criteria

- [ ] `/speech` and `/speech/[id]` exist and follow Nuxt UI scaffold conventions
- [ ] User can edit all 3 sections and save to SpeechBlock
- [ ] Generate/Regenerate updates all sections from AI output (while preserving strict schema)
- [ ] Errors/fallbacks show stable UI (no crashes, no free-text leakage)
- [ ] Pages stay thin; logic in composables/services; code DRY

---

## Master Prompt 5 — End-to-End Workflow + Playwright Happy Path (EPIC 4)

### 1) Title

EPIC 4 — Single Playwright E2E happy path: create → generate → edit → save → reopen

### 2) Intro

EPIC 4 must ship with one Playwright happy-path flow, similar to job upload and matching flows. This validates integration across routing, persistence, AI orchestration, and UI states.

### 3) Feature scope

**In scope**

- Implement one E2E scenario:
  1. Navigate to `/speech`
  2. Create a new SpeechBlock
  3. Trigger Generate (mock AI if E2E uses mocking; otherwise sandbox approach)
  4. Confirm fields populated (3 sections)
  5. Edit one section manually
  6. Save
  7. Reload page / reopen the speech block and verify persistence

**Out of scope**

- No tailoring with job in E2E yet
- No export/print
- No multi-language assertions unless your E2E suite already covers i18n

### 4) Composables / services / repositories / domain modules

- Ensure E2E can run deterministically:
  - stable test ids / aria labels
  - predictable loading states
  - ability to mock AI op response if that’s how other E2Es are structured

### 5) Components

- Add `data-testid` where needed (consistent naming):
  - create button
  - generate button
  - three textareas
  - save button
  - toast/alert confirmation

### 6) Pages/routes

- `/speech` and `/speech/[id]` must support the flow without flakiness:
  - stable selectors
  - no ambiguous text collisions (Playwright strict mode)

### 7) AI operations impact

- In E2E, prefer one of:
  - mocked AI response at GraphQL layer, or
  - sandbox E2E suite that calls deployed lambda (match existing project practice for generateCv/matching if present)

### 8) Testing requirements

- Add `speech-flow.spec.ts` (or equivalent)
- Ensure it runs in CI with the existing Playwright command setup

### 9) Acceptance criteria

- [ ] One Playwright test passes reliably (no flaky selectors)
- [ ] Confirms generated content appears in all 3 fields
- [ ] Confirms manual edits persist after reload
- [ ] Confirms no strict-mode violations (selectors are precise)
- [ ] CI-ready: uses existing testing toolchain, no new deps

---

## Master Prompt 1 — EPIC 4B Contract & Model Alignment (Cover Letter)

### 1) Title

EPIC 4B — Align Cover Letter model, routes, and AI contract with CV & Speech patterns

### 2) Intro

EPIC 4B introduces cover letters as a first-class deliverable, parallel to CVs (EPIC 3) and Speech (EPIC 4). Before implementation, we must align the data model, routing, and AI contract to avoid divergence. This prompt ensures cover letters follow the same architectural rules: generic-first, optional job context later, strict JSON outputs, editable persistence.

### 3) Feature scope

**In scope**

- Confirm and document:
  - `CoverLetter` as a persisted domain entity
  - Generic cover letter as default (no job required)
  - Optional `jobId` for future tailoring (nullable)

- Align naming, routes, and contract expectations with CV & Speech

**Out of scope**

- No UI or backend implementation yet
- No EPIC 6 (tailored application bundle)

### 4) Composables / services / repositories / domain modules

- Documentation-only clarification of:
  - `CoverLetter` entity purpose and lifecycle
  - Relationship to `UserProfile` (required) and `JobDescription` (optional)

### 5) Components

- None

### 6) Pages/routes

Document the canonical routes:

- `/cover-letters` → list (same role as `/cv` and `/speech`)
- `/cover-letters/[id]` → editor/detail view

### 7) AI operations impact

- Confirm single AI operation name:
  - `ai.generateCoverLetter`

- Document that:
  - Job context is **optional**
  - Output schema is **stable regardless of job presence**
  - Tailoring is phrasing-level only when job is provided

### 8) Testing requirements

- None (doc-only)

### 9) Acceptance criteria

- [ ] `CoverLetter` is clearly defined as generic-first
- [ ] Optional job relationship is explicitly documented
- [ ] Routes follow CV/Speech symmetry
- [ ] AI op naming is consistent and unambiguous
- [ ] No references to separate “tailored cover letter” generators

---

## Master Prompt 2 — CoverLetter Backend Domain Layer (CRUD + Composables)

### 1) Title

EPIC 4B — Implement CoverLetter domain layer (GraphQL + repository + composables)

### 2) Intro

Cover letters must behave like CVs and Speech blocks: persisted, editable, regenerable, and owned by the user. This prompt covers the backend/domain foundation needed before UI or AI wiring.

### 3) Feature scope

**In scope**

- Implement `CoverLetter` domain support:
  - GraphQL model (owner-based auth)
  - CRUD repository
  - Service layer for orchestration rules
  - Application composables for list + single entity

- Fields should support:
  - `content` (string or structured blocks — follow CV/Speech consistency)
  - `jobId?` (nullable)
  - timestamps

**Out of scope**

- No AI generation yet
- No UI components
- No job-specific constraints beyond nullable link

### 4) Composables / services / repositories / domain modules

Create/update:

- `CoverLetterRepository`
- `CoverLetterService`
- `useCoverLetters()` (list, delete, refresh)
- `useCoverLetter(id)` (load, save, update)

Follow existing conventions from:

- `CVDocumentRepository`
- `SpeechBlockRepository`

### 5) Components

- None

### 6) Pages/routes

- None

### 7) AI operations impact

- None in this step

### 8) Testing requirements

Vitest:

- Repository CRUD tests (happy + error paths)
- Service tests (creation, update, delete)
- Composable tests:
  - loading/error states
  - refresh after create/delete
  - strict typing and nullability

### 9) Acceptance criteria

- [ ] CoverLetter CRUD works end-to-end
- [ ] Optional jobId handled correctly
- [ ] No duplication with CV/Speech logic
- [ ] Strict TypeScript typing
- [ ] Unit tests in place and passing

---

## Master Prompt 3 — AI Operation `ai.generateCoverLetter`

### 1) Title

EPIC 4B — Implement `ai.generateCoverLetter` (strict JSON, generic-first)

### 2) Intro

Cover letter generation must match the AI-operation discipline used elsewhere: deterministic input building, strict schema validation, and safe fallback behavior. This operation produces a **generic** cover letter by default and optionally adapts phrasing if job context is provided.

### 3) Feature scope

**In scope**

- Implement AI op `ai.generateCoverLetter`
- Deterministic prompt construction from:
  - UserProfile
  - PersonalCanvas
  - Selected experiences/stories
  - Optional JobDescription

- Strict JSON output only

**Out of scope**

- No streaming
- No free-form text to frontend
- No EPIC 6 bundling logic

### 4) Composables / services / repositories / domain modules

- Register the AI op in the AI registry
- Reuse shared helpers for:
  - profile/canvas/story aggregation

- Expose operation via GraphQL with schema validation

### 5) Components

- None

### 6) Pages/routes

- None

### 7) AI operations impact

Operation: `ai.generateCoverLetter`

**Input**

- `userProfile`
- `personalCanvas?`
- `stories[]`
- `jobDescription?`

**Output (exact schema)**

```json
{
  "content": "string"
}
```

**Rules**

- Generic if no job provided
- Tailored phrasing only if job is provided
- No invented facts
- Retry once on invalid output
- Fallback returns `{ content: "" }` (or platform-standard safe fallback)

### 8) Testing requirements

Vitest:

- Valid output passes schema
- Invalid JSON triggers retry then fallback
- Prompt differs when jobDescription is present
  Sandbox E2E (if used elsewhere):
- GraphQL invocation returns schema-valid JSON

### 9) Acceptance criteria

- [ ] AI op returns strict JSON only
- [ ] Output schema is stable
- [ ] Optional job context alters prompt, not schema
- [ ] Retry + fallback tested
- [ ] Operation registered and callable

---

## Master Prompt 4 — Cover Letter UI (List + Editor)

### 1) Title

EPIC 4B — Build Cover Letter UI (list + editor, CV/Speech parity)

### 2) Intro

Cover letters must feel familiar and predictable to users. The UX should mirror CV and Speech flows: list page, editor page, generate/regenerate, manual editing, save/reopen. This prompt covers UI implementation only.

### 3) Feature scope

**In scope**

- List page showing existing cover letters
- Editor page with:
  - Generated content
  - Manual editing
  - Generate / Regenerate action
  - Save / Delete

- Nuxt UI scaffolding and card patterns

**Out of scope**

- Job-specific selection UI
- Export/print
- EPIC 6 application bundling

### 4) Composables / services / repositories / domain modules

- Create orchestration composable:
  - `useCoverLetterEngine()`
    - builds AI input
    - calls service/AI op
    - merges result into editable state

- Persist via `useCoverLetter(id)`

### 5) Components to create or update

- `CoverLetterCard.vue` (list item)
- `CoverLetterEditor.vue`
- Reuse:
  - `<UTextarea>`
  - existing empty-state and card patterns

### 6) Pages/routes

- `/cover-letters`
  - empty state CTA: “Create cover letter”

- `/cover-letters/[id]`
  - breadcrumb aligned with CV/Speech
  - header actions: Generate, Save, Delete

### 7) AI operations impact

- UI never calls AI directly
- AI invoked via orchestration composable/service
- Loading and fallback states must be visible and stable

### 8) Testing requirements

Vitest:

- Component tests (editor rendering, updates)
- Page tests:
  - list renders empty + populated states
  - editor loads, edits, saves content
    Composable tests:

- AI input building
- merge + fallback behavior

### 9) Acceptance criteria

- [ ] Cover letter list and editor pages exist
- [ ] User can generate, edit, save, reopen a letter
- [ ] UI consistent with CV/Speech
- [ ] Logic in composables, pages thin
- [ ] No free-text leakage from AI

---

## Master Prompt 5 — Playwright E2E: Cover Letter Happy Path

### 1) Title

EPIC 4B — Playwright E2E happy path (generic cover letter)

### 2) Intro

As with CVs and Speech, EPIC 4B must ship with a single, reliable E2E test proving the full workflow works end-to-end.

### 3) Feature scope

**Scenario**

1. Go to `/cover-letters`
2. Create a new cover letter
3. Generate content
4. Verify content appears
5. Edit manually
6. Save
7. Reload and verify persistence

### 4) Composables / services / repositories / domain modules

- Ensure stable selectors (`data-testid`)
- Ensure AI op can be mocked or sandboxed consistently

### 5) Components

- Add test IDs for:
  - create button
  - generate button
  - textarea
  - save button
  - success toast

### 6) Pages/routes

- `/cover-letters`
- `/cover-letters/[id]`

### 7) AI operations impact

- Mock AI response or use sandbox pattern consistent with the rest of the repo

### 8) Testing requirements

- `cover-letter-flow.spec.ts`
- Runs in CI without flakiness

### 9) Acceptance criteria

- [ ] One Playwright test passes reliably
- [ ] Confirms generation + edit + persistence
- [ ] No strict-mode selector violations
- [ ] Uses existing test tooling only
