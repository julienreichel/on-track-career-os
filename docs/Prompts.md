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
