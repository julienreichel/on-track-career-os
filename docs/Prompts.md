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
