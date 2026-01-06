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

- Must remain consistent with JSON/Text I/O for AI ops; no free-text to the app except for CV anc cover letter.
- Keep code CLEAN + DRY + YANGNI: reuse existing patterns; avoid duplicating canvas logic; prefer shared “canvas engine” abstractions if already present.
- No new frameworks; stay within Nuxt 3 + Nuxt UI + existing testing toolchain.

Output:

- Provide the set of master prompts in copy/paste-ready format.
- Each master prompt should be complete and standalone.
- Do not include code solutions; only implementation guidance and boundaries.

---

---

---

# Master Prompt 1 — Tailoring Contract + Shared Payload Builder

## 1) Title

EPIC 6 — Define Tailoring Contract + Shared Tailoring Payload Builder (Frontend)

## 2) Intro (context + why)

EPIC 6 is not a new documents EPIC: **CV, Cover Letter, and Speech generation already exist** and are used in production flows.
We now need a **consistent tailoring contract** used across all three generation workflows to tailor outputs to a specific **JobDescription + MatchingSummary + lightweight Company summary** (not canvas), while keeping CLEAN/DRY and testability.

## 3) Feature scope

**In scope**

- Define a shared “TailoringInput” shape used by the frontend when calling AI ops for:
  - generateCv
  - generateCoverLetter
  - generateSpeech

- Enforce EPIC constraints:
  - Inputs are **full objects** (not IDs).
  - Language is **English-only** for generation.
  - Company context is **summary only** (avoid CompanyCanvas or large dumps).

- Create a shared builder/normalizer that produces the final AI payload from:
  - UserProfile
  - selected Experiences/Stories (if applicable)
  - JobDescription
  - MatchingSummary
  - Company summary (lightweight)

**Out of scope**

- Changing business meaning of Match scoring
- Any multi-language support
- Using CompanyCanvas in tailoring payload

## 4) Composables / services / repositories / domain modules

- Create or update a shared helper (prefer in `src/composables/` or `src/application/` depending on existing conventions) such as:
  - `buildTailoringContext()` or `useTailoringContext()`

- It must:
  - accept full objects
  - validate required presence of `job` + `matchingSummary` for “tailored mode”
  - limit company fields to a curated subset (see acceptance criteria)

Prefer reuse of existing patterns like `useCvGenerator`, `useSpeechEngine`, `useCoverLetterEngine` (names may differ; follow repo conventions).

## 5) Components to create or update

- None required in this prompt (pure composable/contract)

## 6) Pages/routes to create or update

- None required in this prompt

## 7) AI operations impact

- No Lambda work in this prompt; only defines what frontend will send.
- Must explicitly avoid sending CompanyCanvas; send company summary only (e.g., name, industry, sizeRange, website, description, productsServices, targetMarkets, and optionally one short “companySummary” string if present).

## 8) Testing requirements

Vitest:

- Unit tests for the tailoring builder:
  - “minimal payload (job + match only)”
  - “payload includes company summary when provided”
  - “payload excludes CompanyCanvas fields”
  - “englishOnly enforced”
  - “fails/throws/returns structured error when job or matchingSummary missing in tailored mode”

## 9) Acceptance criteria (checklist)

- [ ] A single shared builder exists and is used by CV, Cover Letter, Speech generation flows.
- [ ] Builder takes **full objects** (UserProfile, JobDescription, MatchingSummary, optional Company).
- [ ] Company payload is **limited** (no CompanyCanvas; no large raw notes dump).
- [ ] Language is forced to **English**.
- [ ] Tests cover presence/absence, limits, and correctness.

---

# Master Prompt 2 — AI Operations Upgrade for Tailoring (generateCv / generateCoverLetter / generateSpeech)

## 1) Title

EPIC 6 — Update AI Ops Schemas + Prompts to Support Tailored Generation (CV/Letter/Speech)

## 2) Intro (context + why)

AI ops exist and are validated with strict schemas. EPIC 6 requires we **reuse the existing ops** and extend them to accept tailoring context so the outputs are ATS/human-screening optimized (keywords, relevant experience selection, strengths positioning).

## 3) Feature scope

**In scope**

- Update the **input schemas** and prompts for:
  - `ai.generateCv`
  - `ai.generateCoverLetter`
  - `ai.generateSpeech`

- Add optional “tailoring mode” inputs:
  - `jobDescription` (full object)
  - `matchingSummary` (full object)
  - `companySummary` (lightweight subset; not canvas)

- Ensure outputs remain the same format as today:
  - CV + Cover Letter: markdown content (existing pattern)
  - Speech: strict JSON structure already used in app

- Tailoring behavior definition (must be reflected in prompts):
  - include job-relevant keywords naturally
  - select most relevant experience/stories
  - emphasize strengths aligned to job + company
  - avoid inventing skills/experience
  - optimize for ATS + human screening

**Out of scope**

- New AI operations (no `generateTailoredCv` etc.)
- Any multilingual generation
- Any new document types (no interview scripts here)

## 4) Composables / services / repositories / domain modules

- Update the AI operations registry/types (shared types re-export pattern) so frontend stays type-safe.
- Update the Lambda validation schemas and fallback recovery rules to incorporate the new optional tailoring inputs.

## 5) Components to create or update

- None required in this prompt

## 6) Pages/routes to create or update

- None required in this prompt

## 7) AI operations impact (required detail)

Operations to update:

### `ai.generateCv`

- **Inputs (additions):**
  - `jobDescription?: JobDescription`
  - `matchingSummary?: MatchingSummary`
  - `company?: { companyName, industry?, sizeRange?, website?, description?, productsServices?, targetMarkets? }`
  - `language: "en"`

- **Outputs:** unchanged (markdown string)
- **Validation & fallback:**
  - If tailoring inputs are present but malformed: remove tailoring block and generate generic CV (with a warning flag if your contract supports it) OR fail with structured error (pick one consistent strategy).
  - Must not produce extra wrappers (no ``` fences, etc.) consistent with existing CV note-stripping behavior.

### `ai.generateCoverLetter`

- Inputs: same additions as above
- Output: unchanged (cover letter markdown/text, per existing contract)
- Must not invent company facts; use only provided company summary + job text.

### `ai.generateSpeech`

- Inputs: same additions
- Output: strict JSON (existing schema)
- Must include job-tailored key messages but keep schema stable.

Also update the **AI Interaction Contract documentation** to reflect the new inputs consistently across all three ops.

## 8) Testing requirements

Vitest (Lambda/unit):

- For each AI op:
  - “generic mode still works”
  - “tailored mode uses job + match and returns valid schema”
  - “company summary inclusion doesn’t break output”
  - “fallback path works when tailoring object missing required subfields”
    Sandbox E2E (if you have these patterns already for AI ops):

- One deployed invocation test per op in tailored mode (mirrors existing approach).

## 9) Acceptance criteria

- [ ] All 3 existing AI ops accept tailoring inputs and remain backwards-compatible.
- [ ] Strict schema validation updated + covered by tests.
- [ ] Tailored outputs include job-relevant keywords and emphasize relevant experience without hallucinations.
- [ ] Company context is limited to summary fields (no canvas).
- [ ] English-only generation enforced.

---

# Master Prompt 3 — Data Model + “Job Link” for Documents + Regenerate Overwrites

## 1) Title

EPIC 6 — Persist Job Association on Documents + Overwrite-on-Regenerate Rules

## 2) Intro (context + why)

EPIC 6 adds navigation and traceability: tailored documents must be linked back to the Job they target, and regenerating should **overwrite** (not create versions). This must match existing “single source of truth” patterns and owner-based auth.

## 3) Feature scope

**In scope**

- Ensure CV / CoverLetter / Speech entities can optionally reference a Job:
  - `jobId?: id`
  - (optionally) `job?: belongsTo(...)`

- Update domain services so:
  - Tailored generation sets/updates `jobId`
  - Regeneration overwrites content of the existing doc record

- Update repositories and composables accordingly

**Out of scope**

- Document version history
- Multi-job linking per document
- Company linking on documents (derive from job if needed)

## 4) Composables / services / repositories / domain modules

Update (or create if missing) consistently:

- GraphQL schema models:
  - `CVDocument`: add optional job relationship if not present
  - `CoverLetter`: ensure model exists and supports job relationship (if already exists, update it)
  - `SpeechBlock`: add optional job relationship if not present

- Repositories: CRUD updates + typed query includes job field when fetching
- Services: implement “regenerate overwrites” rule by updating existing record instead of creating new one
- Composables: expose `regenerateTailored({ job, matchingSummary })` methods

## 5) Components to create or update

- Minimal UI additions (actual UI work is in other prompts):
  - allow rendering a “Targeted job: …” link when `jobId` exists

## 6) Pages/routes to create or update

- None required here; only model + composable support.

## 7) AI operations impact

- Ensure generation workflows pass `jobDescription` + `matchingSummary` in calls (from shared builder), and store jobId on save/update.

## 8) Testing requirements

Vitest:

- Repository tests for new field mapping
- Service tests:
  - “generate tailored doc updates existing record”
  - “jobId is set/updated”
  - “generic generation preserves jobId = undefined”
    Nuxt tests:

- If you have component tests for doc pages, add one asserting the job link renders only when jobId exists.

## 9) Acceptance criteria

- [ ] CVDocument, CoverLetter, SpeechBlock each can optionally link to a Job.
- [ ] Tailored generation stores `jobId`.
- [ ] Regenerate overwrites content on same doc id (no duplicates).
- [ ] Tests cover persistence, overwrite logic, and relationship wiring.

---

# Master Prompt 4 — UI Entry Points: Job Page + Match Page “Generate Tailored” Links

## 1) Title

EPIC 6 — Add Tailored Documents Entry Points from Job and Match Pages

## 2) Intro (context + why)

Users should generate tailored application materials directly from where intent is strongest: the **JobDescription page** and the **MatchingSummary page**. This is a UX EPIC step: link existing doc systems, don’t rebuild them.

## 3) Feature scope

**In scope**

- On JobDescription page (`/jobs/:jobId`):
  - Add a bottom section “Application Materials”
  - Provide actions to:
    - create or regenerate a tailored CV
    - create or regenerate a tailored Cover Letter
    - create or regenerate a tailored Speech block

- On Match page (`/jobs/:jobId/match`):
  - Same “Application Materials” section, but uses the already-present MatchingSummary in page state.

- Buttons should navigate to the resulting doc pages after success (routes unchanged).

**Out of scope**

- New pages
- Multi-language toggles
- Company canvas access from here

## 4) Composables / services / repositories / domain modules

- Update/extend the job page composable(s) (e.g. `useJobDescription`, `useJobAnalysis`, `useMatchingSummary`) to expose:
  - `generateTailoredCvForJob(job, matchingSummary)`
  - `generateTailoredCoverLetterForJob(...)`
  - `generateTailoredSpeechForJob(...)`

- Must use shared tailoring builder from Master Prompt 1.
- Ensure these flows:
  - fetch company summary (lightweight) if job has a linked company
  - do NOT fetch CompanyCanvas

## 5) Components to create or update

- Create a reusable component, e.g. `ApplicationMaterialsActionsCard`:
  - Nuxt UI `<UCard>` with 3 actions (CV / Letter / Speech)
  - Loading + error states consistent with your patterns (toast/alert)
  - Shows whether a tailored doc already exists for that job (if feasible without heavy queries; otherwise keep MVP simple)

## 6) Pages/routes to create or update

Update:

- `/jobs/:jobId` (job details page)
- `/jobs/:jobId/match` (matching summary page)

Navigation behavior:

- After generation:
  - route to `/cv/:id`, `/cover-letters/:id`, `/speech/:id` (or existing equivalents)

- Breadcrumbs:
  - unchanged, but ensure the new card doesn’t break layout

## 7) AI operations impact

- Calls:
  - `ai.generateCv` with tailoring inputs
  - `ai.generateCoverLetter` with tailoring inputs
  - `ai.generateSpeech` with tailoring inputs

- Inputs are full objects; include company summary only.

## 8) Testing requirements

Vitest:

- Nuxt page/component tests:
  - card renders on both pages
  - clicking actions calls the correct composable method
  - error state is shown on failure
    Playwright:

- Single happy path E2E:
  1. user uploads/has profile data
  2. user uploads job
  3. user generates matching summary
  4. from match page, clicks “Generate tailored cover letter”
  5. lands on cover letter page with content present and job link visible

## 9) Acceptance criteria

- [ ] Job page and Match page show “Application Materials” section at bottom.
- [ ] Each action triggers tailored generation using job + matching summary (and optional company summary).
- [ ] Successful generation navigates to existing doc pages.
- [ ] Company canvas is not loaded/passed.
- [ ] One Playwright happy path covers the end-to-end flow.

---

# Master Prompt 5 — Document Pages: Show Target Job + “Regenerate Tailored” UX

## 1) Title

EPIC 6 — Add Job Backlink + Tailored Regeneration Controls on CV / Cover Letter / Speech Pages

## 2) Intro (context + why)

EPIC 6 requires bidirectional navigation: from job → docs and from docs → job. Also, users must be able to regenerate tailored content and it must **overwrite** existing content (no new versions).

## 3) Feature scope

**In scope**

- On CV detail page (`/cv/:id`):
  - If `jobId` exists, show “Target job” link to `/jobs/:jobId` near the top (header area)
  - Add a “Regenerate tailored” action if job context exists (uses stored job + matching summary if available, otherwise fetch latest matching summary for that job)

- On Cover Letter page (`/cover-letters/:id`):
  - Same job backlink + regenerate tailored

- On Speech page (`/speech/:id`):
  - Same job backlink + regenerate tailored

**Out of scope**

- Selecting a different job from the doc page (keep MVP simple)
- Document version history
- Multi-language

## 4) Composables / services / repositories / domain modules

- Update doc composables (CV, CoverLetter, Speech) to support:
  - `regenerateTailored()` that:
    - requires a job context
    - loads JobDescription + latest MatchingSummary if needed
    - calls the correct AI op with tailoring inputs
    - overwrites the existing doc content

- Ensure DRY: share “load job + load matching summary + load company summary” logic via shared helper if it exists.

## 5) Components to create or update

- Add a small reusable UI fragment, e.g. `TargetJobBanner`:
  - `<UAlert>` or `<UCard>` with:
    - job title
    - link back to job
    - optional “Regenerate tailored” button

- Update doc pages to include this banner in a consistent location.

## 6) Pages/routes to create or update

Update existing routes only:

- `/cv/:id`
- `/cover-letters/:id`
- `/speech/:id`

Breadcrumb behavior:

- Keep current route structure
- Add a backlink element without changing breadcrumbs if your current breadcrumb system is simple.

## 7) AI operations impact

- Regenerate triggers the same AI ops as initial generation, with tailoring inputs.
- Must overwrite persisted content.

## 8) Testing requirements

Vitest:

- Doc composable/service tests:
  - regenerate uses job + match inputs
  - overwrites existing record (same id)

- Nuxt page tests:
  - banner renders when jobId exists
  - regenerate button hidden when jobId missing
    Playwright (optional extra beyond the single EPIC E2E):

- If you keep only one E2E for EPIC 6, ensure it also asserts the backlink exists on the resulting doc page.

## 9) Acceptance criteria

- [ ] CV/CoverLetter/Speech pages show a Job backlink when jobId exists.
- [ ] “Regenerate tailored” overwrites content (no new doc created).
- [ ] Regenerate uses job + latest matching summary (and optional company summary).
- [ ] Tests cover banner conditional rendering + overwrite behavior.
