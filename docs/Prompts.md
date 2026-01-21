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

## Master Prompt — Dashboard Block 1: Active Jobs & Applications

### 1. Title

**F2-Dashboard-1: Active Jobs & Application Status Block**

---

### 2. Intro (context + why)

Once onboarding and positioning steps are complete, the **job becomes the unit of work**, not the profile or features.
This block transforms the dashboard from a tutor into a **job-centric working cockpit**, helping users immediately see where they stand for each job and what remains to be done.

This block directly serves the platform’s second core aim:

> Upload job descriptions, assess fit, and generate materials efficiently.

---

### 3. Feature scope

#### In scope

- Display a concise list of the last 3 **active jobs** the user has interacted with
- For each job, show:
  - Job title + company
  - Match status (score or qualitative label)
  - Material readiness indicators:
    - CV (present / missing)
    - Cover letter (present / missing)
    - Speech (present / missing)

  - A **single primary CTA** per job (“Continue”, “Improve”, “Generate missing”)

- Jobs should be ordered by **relevance** (recent activity or incomplete first)

#### Out of scope

- Full job editing
- Application tracking statuses beyond what already exists
- Analytics, timelines, or Kanban boards

---

### 4. Composables / services / domain modules

- Create or update composable: `useActiveJobsDashboard()`
  - Aggregate data from existing composables:
    - `useJobAnalysis()`
    - `useMatchingSummary()`
    - `useCvDocuments()`
    - `useCoverLetters()`
    - `useSpeechBlocks()`

  - Compute a **JobApplicationState** per job:
    - `matchStatus`
    - `materialsMissing[]`
    - `recommendedNextAction`

- No new repositories or GraphQL models
- No `list()` abuse — reuse existing cached data where possible

---

### 5. Components

- `ActiveJobsCard.vue`
  - Uses Nuxt UI `<UCard>`
  - Renders compact rows or mini-cards

- `JobApplicationStatusRow.vue`
  - Icons or subtle indicators for CV / Letter / Speech
  - One primary CTA button only

Visual priority must remain **below the main “Next Action” banner**, but above navigation cards.

---

### 6. Pages / routes

- Integrate into `/` (dashboard)
- CTAs must navigate to:
  - `/jobs/[jobId]/match`
  - `/applications/cv/new?jobId=…`
  - `/applications/cover-letters/new?jobId=…`
  - `/applications/speech/new?jobId=…`

Breadcrumbs unchanged.

---

### 7. AI operations impact

- None
- Must reuse persisted matching summaries and materials

---

### 8. Testing requirements

- Vitest:
  - `useActiveJobsDashboard.spec.ts` (state computation)
  - `ActiveJobsCard.spec.ts`

- Playwright:
  - Verify dashboard lists jobs and routes correctly from CTA

---

### 9. Acceptance criteria

- [ ] Dashboard clearly shows where each job stands
- [ ] Exactly one CTA per job
- [ ] Jobs with missing materials are visually obvious
- [ ] No duplicated logic from job or application pages
- [ ] Block adds value even when user has 5–10 jobs

---

---

## Master Prompt — Dashboard Block 2: Current Positioning Snapshot

### 1. Title

**F2-Dashboard-2: Positioning Snapshot (Read-Only Identity Mirror)**

---

### 2. Intro (context + why)

After profile and canvas creation, users don’t want to _edit_ constantly — they want to **feel oriented**.
This block provides a calm, read-only snapshot of how the system currently understands their professional positioning.

This directly supports the platform’s first core aim:

> Help the user understand what they have and how it is presented.

---

### 3. Feature scope

#### In scope

- Display a compact, read-only summary of:
  - Professional headline / role
  - 3–5 strongest value propositions (from personal canvas)
  - Target roles or job families

- Provide a **secondary “Edit” link** (not CTA-heavy)

#### Out of scope

- Inline editing
- Full canvas rendering
- Replacing profile or canvas pages

---

### 4. Composables / services / domain modules

- Create `usePositioningSnapshot()`
  - Reads from:
    - `useUserProfile()`
    - `usePersonalCanvas()`

  - Selects only **high-signal fields**

- No new domain models

---

### 5. Components

- `PositioningSnapshotCard.vue`
  - Nuxt UI `<UCard>`
  - Clear section labels
  - Text-first, no charts

- Optional: `ValuePropositionPill.vue` (reusing TagInput styling)

---

### 6. Pages / routes

- Integrate into `/` dashboard
- “Edit” links route to:
  - `/profile`
  - `/profile/canvas`

---

### 7. AI operations impact

- None

---

### 8. Testing requirements

- Vitest:
  - `usePositioningSnapshot.spec.ts`
  - `PositioningSnapshotCard.spec.ts`

- Snapshot tests should focus on **content presence**, not wording

---

### 9. Acceptance criteria

- [ ] User can understand their positioning at a glance
- [ ] Block feels reflective, not actionable
- [ ] No duplication of full canvas UI
- [ ] Editing remains optional and secondary

---

---

## Master Prompt — Dashboard Block 3: Next Improvements That Matter

### 1. Title

**F2-Dashboard-3: High-Impact Next Improvements (Mentor Guidance)**

---

### 2. Intro (context + why)

Once users are “done”, they still need **direction**, not tasks.
This block provides _mentor-like guidance_ by highlighting **1–3 improvements that will most improve outcomes**, without reopening onboarding.

---

### 3. Feature scope

#### In scope

- Display a ranked list of **1–3 high-impact suggestions**, e.g.:
  - Strengthen KPIs
  - Review job match gaps
  - Complete missing materials

- Each suggestion:
  - One sentence explanation
  - One direct link to act

#### Out of scope

- Checklists
- Percentages
- Progress bars
- AI-generated advice text

---

### 4. Composables / services / domain modules

- Create `useNextImprovements()`
  - Derives signals from:
    - Matching summaries
    - Missing materials
    - Weak or missing profile sections

  - Deterministic rules only

- Reuse logic from progress engine where possible

---

### 5. Components

- `NextImprovementsCard.vue`
  - `<UCard>`
  - Ordered list
  - No icons beyond subtle bullets

---

### 6. Pages / routes

- `/` dashboard only
- Links to exact relevant pages (job match, CV editor, profile section)

---

### 7. AI operations impact

- None

---

### 8. Testing requirements

- Vitest:
  - `useNextImprovements.spec.ts`
  - `NextImprovementsCard.spec.ts`

- Playwright:
  - Ensure suggestions change after user completes an improvement

---

### 9. Acceptance criteria

- [ ] Max 3 suggestions shown
- [ ] Each suggestion clearly actionable
- [ ] No generic or vague advice
- [ ] Guidance disappears when no longer relevant

---

---

## Master Prompt — Dashboard Block 4: Recent Work & Resume Continuity

### 1. Title

**F2-Dashboard-4: Recent Work & Resume Continuity Block**

---

### 2. Intro (context + why)

Users often return asking:

> “What was I working on last time?”

This block restores continuity and reduces re-orientation cost.

---

### 3. Feature scope

#### In scope

- Show last 3–5 recent items:
  - CVs
  - Jobs
  - Matching summaries
  - Cover letters or speeches

- For each:
  - Title
  - Type
  - Last updated timestamp
  - “Resume” link

#### Out of scope

- Full activity logs
- Filtering or search
- Analytics

---

### 4. Composables / services / domain modules

- Create `useRecentActivity()`
  - Aggregate timestamps from existing entities
  - Normalize into a common `RecentItem` shape

---

### 5. Components

- `RecentActivityCard.vue`
  - Simple vertical list
  - Time-based ordering

---

### 6. Pages / routes

- `/` dashboard only

---

### 7. AI operations impact

- None

---

### 8. Testing requirements

- Vitest:
  - `useRecentActivity.spec.ts`
  - `RecentActivityCard.spec.ts`

---

### 9. Acceptance criteria

- [ ] User can quickly resume work
- [ ] Items ordered by relevance
- [ ] No duplication of full lists

---

## Master Prompt 1 — Data Model & GraphQL: CV Templates + CV Settings

### 1) Title

EPIC 3C — Add CVTemplate + CVSettings to Amplify Gen2 (GraphQL) and update domain access patterns

### 2) Intro

EPIC 3C requires two new persisted capabilities: a **template library** (user-owned markdown templates, seeded from system exemplars) and **per-user generation settings** (sections + included experiences + ask-each-time). Today CV generation exists, but the data model does not yet support these persisted preferences and template CRUD in a consistent way.

### 3) Feature scope

**Implement**

- Amplify Gen2 GraphQL models for:
  - `CVTemplate` (user-owned templates; store markdown)
  - `CVSettings` (per-user defaults + ask-each-time)
- See docs/Conceptual_Data_Model.md

- Repo/service layer access aligned with existing patterns (no direct `list()` in production paths; use relationships and filtered queries).
- Minimal seed strategy for **3 system templates** (in code), plus a flow to “create user template from system exemplar” (persisted `CVTemplate`).
- use the bin/gen-model.js script to generate the Repo/service

**Out of scope**

- Any changes to CV content schemas beyond what’s required.

### 4) Composables / services / repositories / domain modules

Create/update modules consistent with existing “useXxx” and repository patterns:

- `cvTemplatesRepository` (CRUD; scoped to current user; get-by-id)
- `cvSettingsRepository` (get-or-create settings for current user; update)
- `useCvTemplates()` composable
  - loads user templates
  - exposes “create from system exemplar”

- `useCvSettings()` composable
  - loads settings; provides `saveSettings()`

- Update any existing `useCvDocuments()` / `cvDocumentsRepository` if it currently expects a template entity that doesn’t exist (keep changes minimal).

**Key constraints**

- Avoid `list()` in hot paths; use owner filters / relationships.
- Strict TypeScript typing for all model access.
- Keep seed templates in code (constants) but allow persisting a user-owned copy.

### 5) Components to create or update

None required in this prompt (this is backend + domain access). Only add minimal “shared types” if needed:

- `CvSectionKey` union type (centralized), used by settings and UI later.

### 6) Pages/routes

None (only data layer).

### 7) AI operations impact

No new AI ops.

- Ensure the domain layer can provide the downstream generator a `templateMarkdown` string when needed (from `CVTemplate.content` or from system exemplar → persisted copy).

### 8) Testing requirements

Vitest:

- Repository unit tests (mock Amplify client):
  - `cvSettingsRepository.getOrCreate()`
  - `cvTemplatesRepository.createFromExemplar()`
  - access control expectations: templates/settings must be user-scoped

- Composable unit tests:
  - `useCvSettings` initial creation path
  - `useCvTemplates` load + create-from-exemplar path

### 9) Acceptance criteria

- [ ] `CVTemplate` and `CVSettings` exist in schema; compile and typecheck passes
- [ ] Repos/composables exist and follow existing patterns (no ad-hoc data access in pages)
- [ ] User can persist at least one template derived from a system exemplar
- [ ] Settings are persisted per-user with a stable get-or-create behavior
- [ ] Unit tests cover core CRUD + “get-or-create” and pass reliably

---

## Master Prompt 2 — Template Library UI (CRUD + Editor) with System Exemplars

### 1) Title

EPIC 3C — Build CV Template Library page + Markdown editor (Nuxt UI)

### 2) Intro

Users must manage CV templates (select/edit/create) stored as Markdown. EPIC 3C also includes 3 seeded system templates (kept in code) that users can clone into their own library. This prompt implements the **Template Library** UI end-to-end using existing page scaffolds and reusable card patterns.

### 3) Feature scope

**Implement**

- Template list page (user templates) (see docs/High_Level_Navigation.md)
- “Start from system template” actions (3 exemplars)
- Create new template (blank)
- Edit template (Markdown editor)
- Delete template (with confirmation)
- Mark template as default (ties into CVSettings in later prompt; if convenient, allow it here too)

**Out of scope**

- Advanced templating language / placeholders beyond “Markdown exemplar”.
- Rich preview/print inside template editor (basic preview ok if already standard in project).

### 4) Composables / services / repositories / domain modules

Use the data access built in Prompt 1:

- `useCvTemplates()` (load list; CRUD actions; create-from-exemplar)
- (optional) `useMarkdownEditorState()` if you have an existing editor abstraction; otherwise keep local state in page component but keep logic DRY.

Add a `systemCvTemplates` module:

- Exports 3 exemplar templates (A classic, B modern, C competency-based) as markdown strings + metadata (`id`, `name`, `description`).
- This module must be pure, deterministic, and easy to test.

### 5) Components to create or update

Nuxt UI components, reuse existing “Card” patterns:

- `CvTemplateCard` (list item card: name, description, last updated, actions)
- `CvTemplateEditor` (Markdown editor + optional live preview)
- `ConfirmDeleteModal` (use existing modal pattern if present)
- `TemplateSourceBadge` (e.g., “User”, “System-derived”) – optional but helpful

### 6) Pages/routes

Add/implement:

- `/templates/cv`
  - UContainer → UPage → UPageHeader/UPageBody
  - List + create/clone actions

- `/templates/cv/[id]`
  - Editor page
  - Breadcrumbs: Home → Templates → CV Templates → {Template Name}

Navigation/breadcrumb behavior:

- Ensure top-level navigation includes Templates entry once EPIC is active (see Prompt 5).
- Back button behavior should return to `/templates/cv`.

### 7) AI operations impact

None. This is template management only.

- Templates are stored as Markdown exemplars and later passed into `generateCv` as `templateMarkdown`.

### 8) Testing requirements

Vitest:

- Component tests for `CvTemplateCard` (renders metadata; triggers actions)
- Page tests:
  - `/templates/cv` loads templates (mock repo)
  - create-from-exemplar creates a new user template and navigates to editor
  - delete removes template and updates list

- Editor tests:
  - edits update local dirty state; save persists via repo; shows toast/state feedback

Playwright:

- Not required here (single EPIC E2E will come later), but ensure selectors/data-testids are present for the EPIC flow.

### 9) Acceptance criteria

- [ ] User can see CV templates list and manage templates (create/edit/delete)
- [ ] User can clone any of the 3 system exemplars into a user template
- [ ] Editor saves Markdown content successfully and reloading page shows persisted content
- [ ] Nuxt UI scaffold and card patterns match project conventions
- [ ] Tests pass and cover happy path CRUD

---

## Master Prompt 3 — CV Settings UI (Sections + Experiences + Ask Each Time + Default Template)

### 1) Title

EPIC 3C — Implement CV Settings (defaults) and selection controls (sections/experiences)

### 2) Intro

EPIC 3C replaces the “new CV wizard” with a thin entry point. To make that work, users need saved defaults: which sections to include, which experiences are eligible, whether to be prompted each time, and which template is default. This prompt delivers the settings UI and ties it to persisted `CVSettings`.

### 3) Feature scope

**Implement**

- CV Settings page (or section) where user can:
  - Toggle `askEachTime`
  - Choose `defaultTemplateId`
  - Choose `defaultEnabledSections` (checklist)
  - Choose `defaultIncludedExperienceIds` (multi-select)

- Good empty states and sensible defaults (all sections on; all experiences included unless user changes)

**Out of scope**

- Sending `enabledSections` and `selectedExperienceIds` to AI Lambda (explicitly not needed); these settings are **frontend-only orchestration** and used to filter/prepare inputs.
- Any rework of how experiences are authored (assume they exist in profile).

### 4) Composables / services / repositories / domain modules

- `useCvSettings()` (load, edit, save)
- `useCvTemplates()` (for template dropdown options)
- `useUserExperiences()` (or existing profile composable) to list experiences for selection
- Create a small utility:
  - `getDefaultCvSettings(profile)` to initialize settings on first run

### 5) Components to create or update

- `CvSettingsForm`
  - Section selection checklist (Nuxt UI)
  - Experience multi-select:
    - Prefer TagInput-based list editing if that’s your standard
    - Show experience label (role + company + dates)

  - Template dropdown with “Edit templates” link
  - `askEachTime` toggle with inline explanation

- `SectionChecklist` (optional reusable component)
- `ExperienceMultiSelect` (optional reusable component)

### 6) Pages/routes

Add/implement:

- `/settings/cv` (recommended)
  - Breadcrumbs: Home → Settings → CV
  - Include a link to Template Library: `/templates/cv`

### 7) AI operations impact

No AI changes.

- Settings affect **frontend filtering + template selection** before calling `generateCv`.

### 8) Testing requirements

Vitest:

- `useCvSettings` tests:
  - get-or-create loads defaults
  - save updates persisted model

- Page test `/settings/cv`:
  - renders sections + experiences + templates
  - saving updates repository and shows success feedback

### 9) Acceptance criteria

- [ ] CV settings persist per user and reload correctly
- [ ] User can set default template and it is stored
- [ ] User can configure default included sections and experiences
- [ ] ask-each-time toggle is persisted and clearly explained
- [ ] No AI payload changes required for sections/experience selection (frontend-only)

---

## Master Prompt 4 — Replace /applications/cv/new with Thin Generate Flow + “Ask Each Time” Modal

### 1) Title

EPIC 3C — CV Generation Flow: thin `/applications/cv/new` + modal selection + template exemplar usage

### 2) Intro

EPIC 3C’s core UX change: `/applications/cv/new` becomes a **thin generate entry point**. If “ask each time” is enabled, the user gets a lightweight modal to confirm template + included sections + experiences. Generation then reuses existing CV generation/edit/print flow.

### 3) Feature scope

**Implement**

- Update `/applications/cv/new`:
  - Read `CVSettings`
  - If `askEachTime=false`: generate immediately using saved defaults
  - If `askEachTime=true`: open modal to select:
    - Template (default preselected)
    - Sections (default preselected)
    - Experiences (default preselected)

- Ensure section/experience selection is applied **in frontend orchestration**:
  - Filter selected experiences before building the `generateCv` input
  - Only include selected sections in the input content prepared for the AI (or in the post-processing/assembly step, whichever your project already uses)

- Apply template exemplar behavior:
  - The chosen user template markdown (or derived from system exemplar via persisted template) is passed as `templateMarkdown` to `generateCv`
  - Output remains Markdown; stored in CVDocument as today

**Out of scope**

- Rebuilding the CV editor/print pages (reuse existing).
- Any new wizard-like UI.

### 4) Composables / services / repositories / domain modules

Update existing generation orchestration composable(s), reusing patterns like `useJobAnalysis/useCanvasEngine`:

- `useCvGenerator()` (or equivalent)
  - Add ability to accept an optional “generation context” object from modal: `{ templateId, enabledSections, selectedExperienceIds }`
  - It must:
    - Load template markdown (from repo or system exemplar-derived user template)
    - Fetch experiences and filter to selected IDs
    - Assemble the AI operation input (JSON) and call AI registry

- Add `useCvGenerationModalState()` (optional) to keep `/applications/cv/new` page clean

### 5) Components to create or update

- `CvGenerateEntryCard` (thin page card: shows current defaults, actions)
- `CvGenerationModal`
  - Uses Nuxt UI modal pattern
  - Contains template dropdown, section checklist, experience multi-select
  - Primary action: “Generate CV”

- Ensure reusable controls (from Prompt 3) are reused, not duplicated.

### 6) Pages/routes

Update:

- `/applications/cv/new` (thin entry point)
  - Breadcrumbs: Home → Applications → CV → New
  - If generation starts, navigate to the newly created CV document page (existing route)
    No new routes required beyond settings/templates.

### 7) AI operations impact

Operation: `ai.generateCv`

Inputs:

- Must remain strict JSON input per AI Interaction Contract.
- Must include:
  - Profile and curated experiences (filtered)
  - Optional `templateMarkdown` string (Markdown exemplar)
  - Job-tailoring inputs if present (when generation is triggered from job context; template applies universally)

Outputs:

- Markdown string (CV content) is allowed for CV documents per project constraints.
- Must be validated according to the existing schema validation approach; if your AIC states “no free-form text”, ensure CV output is treated as the permitted exception and still handled deterministically (stored, shown in editor, printable).

Fallback rules:

- Reuse existing fallback strategy (provider fallback / retry policy) for `generateCv`.
- If template markdown is invalid/empty, fall back to a default system exemplar (classic) deterministically.

Call sites:

- `/applications/cv/new` generation entry
- Any existing “Generate CV from Job” entry must also use the same template/settings logic.

### 8) Testing requirements

Vitest:

- Page test `/applications/cv/new`:
  - When `askEachTime=false`: clicking Generate triggers generator with saved defaults
  - When `askEachTime=true`: modal opens; confirms selections; triggers generator with chosen values

- Composable tests for `useCvGenerator`:
  - Filters experiences correctly
  - Passes template markdown when present
  - Applies fallback template deterministically

Playwright (single EPIC happy path)

- Scenario: “ask each time enabled”
  1. Set CV settings: `askEachTime=true`, pick a default template
  2. Go to `/applications/cv/new`
  3. Modal opens → pick template + select subset of experiences → generate
  4. Land on CV editor page → verify content rendered → trigger print/export action (existing flow)

### 9) Acceptance criteria

- [ ] `/applications/cv/new` is a thin generate page (no wizard)
- [ ] ask-each-time modal appears only when enabled
- [ ] Selected experiences/sections affect generated CV (frontend orchestration)
- [ ] Template exemplar is used for all CV generation (generic + tailored)
- [ ] Deterministic fallback behavior exists when template missing/invalid
- [ ] Vitest + Playwright tests pass and cover the EPIC flow

---

## Master Prompt 5 — Navigation/Docs Alignment + Integration Polish (DX + UX)

### 1) Title

EPIC 3C — Navigation updates, breadcrumbs consistency, and documentation alignment

### 2) Intro

EPIC 3C introduces new user-facing surfaces (Templates + CV Settings) and changes the CV “new” flow. This prompt ensures navigation is coherent, breadcrumbs are consistent, and internal docs/route structure match reality so future EPICs don’t drift.

### 3) Feature scope

**Implement**

- Add visible navigation entries for:
  - CV Templates (`/templates/cv`)
  - CV Settings (`/settings/cv`)

- Ensure breadcrumbs follow your standard pattern everywhere
- Add contextual cross-links:
  - From CV new entry to Settings/Templates
  - From Settings to Templates

- Update high-level navigation doc to mark these as implemented (if you keep docs in repo)

**Out of scope**

- Any major IA redesign beyond placing these two pages cleanly.
- Any new observability/feedback work (separate EPIC).

### 4) Composables / services / repositories / domain modules

- If you have a central nav config, update it once; do not scatter links.
- Add any shared breadcrumb helper entries if that’s your pattern.

### 5) Components to create or update

- Update navigation shell component(s) to include new entries.
- Ensure consistent page headers using UPageHeader across:
  - `/templates/cv`
  - `/templates/cv/[id]`
  - `/settings/cv`
  - `/applications/cv/new`

### 6) Pages/routes

No new pages beyond those in earlier prompts; this is integration polish.

### 7) AI operations impact

None.

### 8) Testing requirements

Vitest:

- Minimal navigation rendering test if you have one (or add):
  - New nav entries appear for authenticated users

- Ensure page tests don’t break due to nav changes (update snapshots/selectors if any)

Playwright:

- Not a new scenario; ensure the EPIC E2E path can reach Templates/Settings via nav links.

### 9) Acceptance criteria

- [ ] Templates and CV Settings pages are reachable via navigation
- [ ] Breadcrumbs consistent across new/updated routes
- [ ] Cross-links reduce user friction (settings ↔ templates ↔ generate)
- [ ] Docs (navigation overview) reflect implemented EPIC 3C routes
- [ ] No broken routes; tests remain stable
