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

## MASTER PROMPT 2 — Domain Layer: Company + CompanyCanvas (Repository/Service/Composables)

Intro (context + why)
EPIC 5B introduces Company and CompanyCanvas as first-class entities in the Job & Company domain. We need a clean domain layer that matches the Conceptual Data Model (CDM) and supports later EPICs (5C matching).

Feature scope

- Implement domain/repository/services/composables for:
  - Company CRUD
  - CompanyCanvas read/update
  - “needsUpdate” and “lastGeneratedAt” semantics
- Integrate with Amplify Gen2 GraphQL models already present in the backend schema.
  Out of scope
- No matching engine logic (EPIC 5C)
- No advanced dedupe/matching across companies

Composables / services / repositories to create or update

- Domain types:
  - `Company`
  - `CompanyCanvas` with 9 canonical blocks per CDM :contentReference[oaicite:6]{index=6}
- Repositories:
  - `CompanyRepository` (list/get/create/update/delete)
  - `CompanyCanvasRepository` (getByCompanyId, update, setNeedsUpdate, setLastGeneratedAt)
- Services:
  - `CompanyService` (orchestrate create + optional analyze step; keep orchestration here, not UI)
  - `CompanyCanvasService` (generate/regenerate orchestration; merges AI result into persisted canvas)
- Frontend composables (Nuxt):
  - `useCompanies()` (list/search/create/delete)
  - `useCompany(companyId)` (load/update)
  - `useCompanyCanvas(companyId)` (load/edit/save/regenerate; exposes “dirty” state)

Implementation instructions (clean + DRY)

- Reuse existing project conventions for repositories/composables (same patterns as JobDescription flows).
- Single source of truth for canvas block keys (shared constant/enum) to avoid typos and duplicated UI mapping.
- Ensure updates are partial/patch-like where appropriate; avoid replacing the entire entity when editing one block.
- Normalize array entries (trim, dedupe, remove empty strings) at a single layer (service), not scattered in UI.

Testing requirements

- Vitest:
  - Unit tests for normalization/dedupe helpers
  - Repository/service tests with mocked API client
  - Composable tests for state transitions (loading, saving, error, dirty flags)

Acceptance criteria

- Create, read, update, delete company works end-to-end via domain layer.
- CompanyCanvas can be loaded, edited, and saved without AI.
- `needsUpdate` and `lastGeneratedAt` are updated consistently (generation sets lastGeneratedAt and clears needsUpdate).
- No duplicated “canvas keys” logic across UI/components.

## MASTER PROMPT 3 — AI Ops Integration for EPIC 5B (analyzeCompanyInfo + generateCompanyCanvas)

Intro (context + why)
EPIC 5B requires two AI operations with strict JSON I/O and validation. Implement integration so the UI triggers AI safely and results map cleanly into Company and CompanyCanvas. :contentReference[oaicite:7]{index=7} :contentReference[oaicite:8]{index=8}

Feature scope

- Add/extend AI operation registry + client calls:
  - `ai.analyzeCompanyInfo`
  - `ai.generateCompanyCanvas`
- Enforce strict input/output schema validation + fallback handling as per AI contract.
  Out of scope
- No “web research” or external enrichment beyond user-provided text.
- No free-form text returned to the app.

AI operations impact (must follow contract)

- `ai.analyzeCompanyInfo`:
  - Inputs: companyName, industry, size, rawText, optional jobContext :contentReference[oaicite:9]{index=9}
  - Output: `companyProfile` object with normalized fields (website, productsServices, targetMarkets, customerSegments, summary, etc.) :contentReference[oaicite:10]{index=10}
  - Mapping: update Company entity fields (do not overwrite user edits blindly—define merge rules).
- `ai.generateCompanyCanvas`:
  - Inputs: companyProfile + additionalNotes[] :contentReference[oaicite:11]{index=11}
  - Output: 9-block BMC fields + companyName :contentReference[oaicite:12]{index=12}
  - Mapping: write to CompanyCanvas entity (blocks are arrays of strings)

Implementation instructions (clean + DRY)

- AI calls should be orchestrated in a service layer (not in page components).
- Define deterministic merge strategy:
  - analyzeCompanyInfo: fill empty fields, append to lists with dedupe, never erase non-empty user-provided data unless explicitly “Replace with AI result” is chosen.
  - generateCompanyCanvas: replace the 9 blocks by default (canvas is a generated artifact), but preserve user edits if you support “regenerate only empty blocks” as an enhancement (optional).
- Add operation-level logging hooks (inputs/outputs/fallback steps) consistent with project patterns.

Testing requirements

- Vitest:
  - Schema validation tests for both ops (valid, missing fields, wrong types)
  - Service orchestration tests: analyze → persist Company; generate → persist Canvas
  - Merge strategy tests (user field wins, dedupe behavior)
- Playwright:
  - Covered in the final E2E master prompt

Acceptance criteria

- Both AI ops can be executed from the app with strict JSON validation (no free text leakage).
- Invalid AI responses trigger fallback strategy and still return a safe object shape per contract. :contentReference[oaicite:13]{index=13}
- Company fields update is predictable (no surprising overwrites).
- CompanyCanvas generated data matches the 9-block CDM structure. :contentReference[oaicite:14]{index=14}

## MASTER PROMPT 4 — UI Pages for EPIC 5B (Nuxt UI): /companies, /companies/new, /companies/[id]

Intro (context + why)
EPIC 5B requires a user-facing flow to create a company, optionally analyze pasted notes, and generate/edit a 9-block CompanyCanvas. UI must be consistent with existing Nuxt UI patterns and keep code DRY by reusing canvas editing components. :contentReference[oaicite:15]{index=15}

Feature scope

- Implement pages:
  - `/companies` list/search/create/delete
  - `/companies/new` intake form (companyName, industry, sizeRange, website optional, products/services, markets, segments, raw notes paste)
  - `/companies/[companyId]` company detail + canvas view/edit + regenerate actions
    Out of scope
- No multi-user sharing, permissions, or collaboration
- No file upload parsing (only text paste for now, unless upload infra already exists)

Components to create/update (Nuxt UI)

- Reusable components:
  - `CompanyCard` (list item)
  - `CompanyForm` (create/edit basic fields)
  - `CompanyNotesInput` (raw notes textarea + helper text)
  - `CompanyCanvasEditor` (maps 9 blocks to editable sections; uses TagInput-style editing)
  - `CanvasBlockSection` (generic, blockKey + label + list editor)
- UI behaviors:
  - Clear CTA separation: “Save Company”, “Analyze Company Info (AI)”, “Generate Canvas (AI)”, “Save Canvas”
  - Show lastGeneratedAt and needsUpdate (CDM fields) :contentReference[oaicite:16]{index=16}
  - Loading + error states per action

Implementation instructions (clean + DRY)

- Use a single canonical “blocks config” array (key/label/help) to render the 9 sections.
- Keep page components thin: they call composables/services; no direct GraphQL or AI calls inside UI.
- Avoid duplicating list editing logic—centralize in one list-editor component.

Testing requirements

- Vitest:
  - Component tests for `CompanyForm`, `CompanyCanvasEditor`, and `CanvasBlockSection`
  - Page tests for basic rendering + route param handling
- Basic accessibility checks (labels, button names, headings)

Acceptance criteria

- User can create a company with minimal data and lands on company detail page.
- User can edit and save company fields.
- User can view and edit the 9 canvas blocks and save them.
- UI remains consistent with Nuxt UI design system and existing app conventions.

## MASTER PROMPT 5 — Connect EPIC 5A Job Flow to Companies (Select/Create + Persist companyId)

Intro (context + why)
JobDescription supports linking to a Company (CDM indicates Company ↔ Jobs relationship). EPIC 5B must provide minimal UX to associate a job with a company to enable later matching and context-aware generation. :contentReference[oaicite:17]{index=17}

Feature scope

- From Job detail page (EPIC 5A):
  - Allow selecting an existing Company
  - Allow creating a new Company quickly (inline modal or redirect to /companies/new with return path)
  - Persist linkage into JobDescription.companyId (or equivalent field in current backend)
    Out of scope
- No automatic company detection from job text (future enhancement)
- No multi-company per job

Composables/components/pages to update

- Composables:
  - Extend `useJobDescription(jobId)` to support setting/clearing company link
  - Reuse `useCompanies()` for search/select
- Components:
  - `CompanySelector` (searchable select + “Create new” action)
  - `LinkedCompanyBadge` (quick navigation to /companies/[id])

Implementation instructions

- Keep the link operation explicit and undoable (clear link).
- Don’t block job editing on company data completeness.

Testing requirements

- Vitest:
  - Company linking composable/service tests
  - Component test for selector (select existing, clear)
- Include in Playwright E2E (next prompt)

Acceptance criteria

- A job can be linked to a company and the link persists after reload.
- User can navigate from the job to the linked company page.
- User can clear the link cleanly.

## MASTER PROMPT 6 — EPIC 5B End-to-End Playwright E2E + Key Vitest Coverage

Intro (context + why)
EPIC 5B adds a multi-step workflow (create company → analyze → generate canvas → edit/save → link from job). We need one reliable E2E happy path + targeted unit/component tests to prevent regressions.

Feature scope

- Add a single Playwright E2E spec covering the core EPIC 5B path.
- Ensure Vitest coverage exists for critical logic (merge + validation + canvas keys config).

E2E happy path (Playwright)
Scenario:

1. Go to /companies
2. Create new company (minimal required fields + paste notes)
3. Run “Analyze Company Info (AI)” and assert company fields populate (at least one list field updates)
4. Run “Generate Canvas (AI)” and assert at least 2 blocks have items
5. Edit one canvas block (add/remove item) and save
6. Go to a job detail page and link that job to the created company
7. Assert the link persists (reload) and job can navigate back to the company

Implementation instructions (Playwright best practices)

- Use role-based locators, stable labels, and avoid strict-mode text collisions.
- Prefer `getByRole` / `getByLabel` with exact accessible names.
- Mock AI calls if the project has a test double approach; otherwise seed deterministic AI responses via test fixtures.

Vitest coverage checklist

- AI schema validation/fallback tests for both company ops :contentReference[oaicite:18]{index=18}
- Merge strategy tests for analyzeCompanyInfo → Company
- Canvas keys config test (ensures exactly 9 blocks, correct order and labels)
- Repository/service tests for save/load of CompanyCanvas :contentReference[oaicite:19]{index=19}

Acceptance criteria

- Playwright spec passes reliably in CI (no flaky selectors, no timing hacks).
- Critical business rules are covered in Vitest (validation, merge, dedupe, canvas keys).
- EPIC 5B workflow is protected against regressions with minimal but meaningful tests.
