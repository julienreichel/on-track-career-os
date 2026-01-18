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

## Master Prompt 1 — Progress Engine & “Next Action” Guidance Core

1. **Title**
   **F2-1: User Progress Model + Next Action Engine (Phases, Gates, Suggestions)**

2. **Intro (context + why)**
   EPIC F2 requires the product to always tell users _what to do next_ and _why it matters_, with progressive disclosure. The project is already MVP-ready with Profile, Experiences, Stories, Personal Canvas, Job parsing, Matching, CV/CoverLetter/Speech flows implemented. This prompt creates the **central source of truth** for onboarding state: Phase 1 (Ground me), Phase 2 (two parallel paths), Phase 3 (Position myself), plus bonus/advanced. Everything else in F2 must consume this engine.

3. **Feature scope**
   - **In scope**
     - Define a canonical **UserProgressState** computed from existing data (no new AI).
     - Implement a deterministic **NextActionEngine** that returns:
       - current phase, completion flags, missing prerequisites, and a single primary CTA
       - secondary CTAs (max 2) for “parallel path” suggestions
       - short rationale strings (i18n keys, not hard-coded English)

     - Provide a stable API for pages/components to render guidance consistently.

   - **Out of scope**
     - Analytics/telemetry (belongs to EPIC F1).
     - Any AI-based “guidance generation” (must be deterministic and schema-based).
     - Rewriting existing workflows (CV upload, job upload, etc.) beyond adding guidance hooks.

4. **Composables / services / repositories / domain modules**
   - Create a new **domain module**: `src/domain/onboarding/`
     - Types:
       - `UserProgressState` (phase + flags)
       - `NextAction` (primary + secondary CTAs, rationale, route targets)
       - `ProgressCheckResult` (missing items list, gate reasons)

     - Pure functions:
       - `computeUserProgressState(input: ProgressInputs): UserProgressState`
       - `getNextAction(state: UserProgressState): NextAction`
       - `getUnlockableFeatures(state): FeatureUnlocks`

   - Create composable: `src/composables/useUserProgress.ts`
     - Loads required entities using existing composables (do not duplicate repository logic):
       - `useUserProfile()`, `useExperiences()`, `useStoryList()`, `usePersonalCanvas()`, `useJobAnalysis()`, etc.

     - Builds **ProgressInputs** and exposes:
       - `state`, `nextAction`, `unlockableFeatures`, `loading`, `error`

     - Must be DRY and cached (avoid refetch loops).

   - Update (if needed) existing composables to expose cheap summary counts without additional list queries.

5. **Components**
   - Create `ProgressBannerCard.vue` (Nuxt UI card pattern):
     - Shows phase label, a primary CTA button, and 1–2 secondary CTAs.
     - Shows “why it matters” copy via i18n keys.

   - Create `ProgressChecklistCard.vue`:
     - Shows the gate checklist for the current phase (e.g., Phase 1 requirements).
     - Uses Nuxt UI list/checkbox visuals; no new component library.

   - Components must accept `NextAction` + `UserProgressState` as props and remain presentational.

6. **Pages/routes**
   - Update dashboard `/` to include:
     - `ProgressBannerCard` at top of page body
     - “Continue where you left off” behavior driven by `nextAction`

   - Update key entry pages to render guidance at top (lightweight banner, not intrusive):
     - `/profile`, `/profile/cv-upload`, `/profile/experiences`, `/profile/stories`, `/profile/canvas`
     - `/jobs`, `/jobs/new`, `/jobs/[jobId]`, `/jobs/[jobId]/match`
     - `/applications/cv`, `/applications/cover-letters`, `/applications/speech`

   - Breadcrumb behavior: keep existing breadcrumbs; add no new global nav.

7. **AI operations impact**
   - **None.** This feature must be deterministic and computed from stored data.
   - If any existing page currently depends on AI to infer “what’s next”, remove that dependency.

8. **Testing requirements**
   - Vitest unit tests:
     - `computeUserProgressState.spec.ts` with fixtures for each phase/gate scenario
     - `getNextAction.spec.ts` verifying primary CTA selection and rationale keys

   - Nuxt component tests:
     - `ProgressBannerCard.spec.ts` (renders correct CTA and handles disabled state)
     - `ProgressChecklistCard.spec.ts`

   - Playwright E2E (single happy path, referenced again in last prompt):
     - Ensure dashboard shows correct next action as user progresses.

9. **Acceptance criteria (checklist)**
   - [ ] `useUserProgress()` computes a stable phase + flags using existing data only.
   - [ ] Dashboard always shows **exactly one** primary next action (and max 2 secondary).
   - [ ] Phase 1 hard gate: until satisfied, Phase 2/3 CTAs are not presented as primary.
   - [ ] Copy is i18n-driven (no hard-coded English).
   - [ ] No duplicate data fetching and no new list() queries on hot paths.
   - [ ] Unit tests cover all phase transitions and edge cases (missing profile fields, <3 experiences, etc.).

---

## Master Prompt 2 — First-Time Onboarding Wizard Aligned With Phase 1 “Ground me”

1. **Title**
   **F2-2: First-Time User Wizard (Phase 1 Ground Me) + Safe Skip/Resume**

2. **Intro (context + why)**
   EPIC F2 requires first-time guidance so users don’t bounce. The product has powerful features but needs a fast, structured onboarding to unlock them. Phase 1 is a hard gate: upload CV + ensure 3 experiences + ensure profile basics. This prompt implements a **wizard that gets users to “Activated” quickly** and then hands off to Phase 2 paths.

3. **Feature scope**
   - **In scope**
     - Implement a wizard shown to new users (or users not Phase-1-complete).
     - Steps:
       1. Upload CV & parse
       2. Review/import experiences (ensure at least 3)
       3. Confirm profile basics (name, contact, work authorization, social links, professional attributes)
       4. Completion screen: “You’re ready — choose your next path” (Phase 2A vs 2B)

     - Wizard must be resumable and safe to exit.

   - **Out of scope**
     - Rewriting CV parsing or experience extraction logic.
     - Adding new AI operations.
     - Forcing users to fully fill Phase 2 content here.

4. **Composables / services / repositories / domain modules**
   - Create `src/domain/onboarding/onboardingWizard.ts`
     - Step definitions, guard conditions, and navigation mapping

   - Create composable `useOnboardingWizard()`:
     - Uses `useUserProgress()` for gating and completion detection
     - Integrates existing CV upload workflow composables:
       - `useCvUploadWorkflow()`, `useCvParsing()`, `useExperienceImport()` etc.

     - Exposes:
       - `currentStep`, `steps`, `canProceed`, `next()`, `back()`, `skip()`, `finish()`

     - Persist wizard progress minimally (choose one consistent approach):
       - Option A: lightweight local storage keyed by userId
       - Option B: a small field(s) in UserProfile (if schema already supports this without heavy changes)

     - Must not corrupt domain data if user exits mid-step.

5. **Components**
   - `OnboardingWizard.vue` (Nuxt UI + `<USteps>`):
     - Standard scaffold inside `UContainer → UPage → UPageHeader/UPageBody`

   - Step components (keep minimal, reuse existing):
     - `OnboardingStepCvUpload` → wraps existing CV upload page components
     - `OnboardingStepExperienceReview` → reuse ExperiencesPreview/Import success UI
     - `OnboardingStepProfileBasics` → reuse Profile form sections (only basics)
     - `OnboardingCompletionCard` → “Choose your next path” buttons

   - Add consistent empty-state hints inside steps (copy via i18n).

6. **Pages/routes**
   - Add route `/onboarding` (wizard container)
   - Update `/login` redirect logic:
     - After successful login, if Phase 1 incomplete → redirect to `/onboarding`
     - Otherwise → `/`

   - Breadcrumbs:
     - Wizard has no deep breadcrumbs; show “Onboarding” only.

7. **AI operations impact**
   - None new. Reuse:
     - `ai.parseCvText`, `ai.extractExperienceBlocks` via existing workflows.

   - Maintain strict JSON outputs and existing fallback behavior.

8. **Testing requirements**
   - Vitest unit tests:
     - `onboardingWizard.spec.ts` (step guards, resume behavior)

   - Nuxt page/component tests:
     - `/onboarding` renders correct step based on user progress

   - Playwright E2E:
     - New-user flow begins at onboarding after login and completes Phase 1.

9. **Acceptance criteria**
   - [ ] New users are routed to `/onboarding` until Phase 1 is complete.
   - [ ] Wizard ensures **≥ 3 experiences** (user can add manually if parsing yields less).
   - [ ] Basics checklist is explicit and validated before finishing Phase 1.
   - [ ] Exiting wizard does not lose imported data; resuming continues where left off.
   - [ ] After completion, user lands on dashboard with Phase 2 next actions shown.

---

## Master Prompt 3 — Contextual Hints & Empty-State Guidance (Progressive Disclosure)

1. **Title**
   **F2-3: Contextual Guidance Layer (Empty States, Hints, Progressive Disclosure Rules)**

2. **Intro (context + why)**
   After Phase 1, users can explore multiple flows, but they need clear guidance without overwhelming UI. EPIC F2 explicitly requires contextual hints, empty-state guidance, progressive disclosure, and “no dead ends”. This prompt adds a consistent guidance layer across the app using the computed progress state.

3. **Feature scope**
   - **In scope**
     - Add consistent, low-noise guidance blocks to key pages:
       - Empty states: “You have nothing here yet — do X”
       - Contextual hints: “This matters because…”

     - Implement progressive disclosure rules:
       - Hide/disable advanced actions until prerequisites are met
       - Show “locked” feature cards with explanation and CTA to unlock

     - Keep UI calm: use existing Card patterns and one “primary CTA” rule per page.

   - **Out of scope**
     - Visual redesign of the whole UI (EPIC F3).
     - New navigation restructuring.
     - Any usage tracking.

4. **Composables / services / domain modules**
   - Create `src/domain/onboarding/guidanceCatalog.ts`
     - Declarative mapping:
       - `route → guidance rules (when to show, what CTA, what copy key)`

     - Must be deterministic and based on `UserProgressState` and page-local data.

   - Create `useGuidance(routeKey)` composable:
     - Reads `useUserProgress()` + page context (e.g., jobId present?)
     - Returns `GuidanceModel`:
       - `banner`, `emptyState`, `lockedFeatures[]` (each with CTA target + reason key)

5. **Components**
   - `GuidanceBanner.vue` (compact alert/card)
   - `EmptyStateActionCard.vue` (standard empty with CTA)
   - `LockedFeatureCard.vue` (disabled card with “Unlock by doing…”)
   - Reuse Nuxt UI: `<UCard>`, `<UAlert>`, `<UButton>`, `<UBadge>`

6. **Pages/routes to update**
   - Profile area:
     - `/profile` (if missing basics, show checklist + CTA to onboarding or profile basics)
     - `/profile/stories` (if no stories, CTA to create a story from an experience)
     - `/profile/canvas` (if prerequisites missing, show locked explanation)

   - Jobs area:
     - `/jobs` (if none, CTA to upload job)
     - `/jobs/[jobId]/match` (if match missing, CTA to generate)

   - Applications:
     - `/applications/cv`, `/applications/cover-letters`, `/applications/speech`
       - If none exist, CTA to create one; if Phase 3 prerequisites missing, show locked guidance

   - Expected breadcrumbs:
     - Preserve existing breadcrumbs; ensure guidance CTAs navigate to correct routes.

7. **AI operations impact**
   - None new.
   - Ensure guidance never depends on AI-generated reasoning text.

8. **Testing requirements**
   - Vitest unit tests:
     - `guidanceCatalog.spec.ts` for key routes and states

   - Nuxt tests:
     - One per major area (profile/canvas/jobs/applications) ensuring correct empty state and locked card rendering.

   - Playwright E2E:
     - Verify guidance disappears as user completes prerequisites (e.g., canvas unlocks after stories exist).

9. **Acceptance criteria**
   - [ ] Every key page has a meaningful empty state with a CTA.
   - [ ] Users never hit a dead end; there is always a suggested next step.
   - [ ] Progressive disclosure: Phase 3 actions are clearly locked until Phase 2A + 2B are complete.
   - [ ] Guidance copy uses i18n keys and is consistent in tone.
   - [ ] No new AI dependencies and no new frameworks.

---

## Master Prompt 4 — Badge System (Milestone-Based, Deterministic, Persisted)

1. **Title**
   **F2-4: Badge Engine + Badge UI (Milestones & Feature Activation)**

2. **Intro (context + why)**
   EPIC F2 includes a badge system to reinforce progress and reduce abandonment. Badges must reflect meaningful milestones aligned with phases: Phase 1 activation, Phase 2A identity building, Phase 2B job understanding, Phase 3 positioning, plus bonus. This prompt adds a deterministic badge engine, persists awarded badges, and displays them in a lightweight, non-gamified way.

3. **Feature scope**
   - **In scope**
     - Define a **BadgeCatalog** (IDs, titles, descriptions, icon keys, phase association).
     - Deterministic awarding rules using `UserProgressState` and domain entities:
       - Examples: CV uploaded + basics complete, 3 experiences, first story, personal canvas created, first job parsed, first match generated, first tailored CV/letter/speech for same job, etc.

     - Persist awarded badges and show “new badge earned” toast once.
     - Provide a badge panel on dashboard.

   - **Out of scope**
     - Leaderboards, points, social sharing.
     - AI-generated badges.
     - Complex animation system.

4. **Composables / services / repositories / domain modules**
   - Create domain module `src/domain/badges/`
     - `BadgeId` union
     - `BadgeDefinition`
     - `computeEligibleBadges(progressInputs): BadgeId[]`
     - `diffBadges(existing, eligible): { newlyEarned, allEarned }`

   - Persistence (choose minimal, consistent approach):
     - Preferred: extend **UserProfile** with `earnedBadges: BadgeId[]`
       - Update repository/service/composable accordingly
       - Ensure strict typing and migrations are safe

     - If schema changes are too heavy, create a small `UserBadge` GraphQL model keyed by userId (but keep it minimal).

   - Create composable `useBadges()`:
     - Loads existing earned badges
     - Computes eligibility from `useUserProgress()` inputs
     - Persists new badges (idempotent)
     - Exposes `earnedBadges`, `newlyEarnedBadges`, `markAsSeen(badgeId)`

5. **Components**
   - `BadgeGridCard.vue` (dashboard card showing earned badges)
   - `BadgePill.vue` (small badge UI using `<UBadge>`)
   - `NewBadgeToast.vue` or reuse existing toast system with a consistent message format
   - Optional: `BadgeDetailsModal.vue` for descriptions (keep simple)

6. **Pages/routes**
   - Update `/` dashboard:
     - Add badge card below progress banner.

   - No new routes required unless you add `/badges` (only if it stays tiny and useful).

7. **AI operations impact**
   - None.
   - Badges must be deterministic and computed from stored data.

8. **Testing requirements**
   - Unit tests:
     - `badgeEngine.spec.ts` (eligibility rules for each badge)
     - `useBadges.spec.ts` (idempotent persistence + “new badge earned” behavior)

   - Nuxt component tests:
     - `BadgeGridCard.spec.ts`

   - Playwright E2E:
     - Validate at least 2 badge unlocks in the happy path and that toast appears only once.

9. **Acceptance criteria**
   - [ ] Badges align with Phase 1/2/3 milestones and bonus items.
   - [ ] Awarding is deterministic, idempotent, and persists per user.
   - [ ] UI shows earned badges and highlights newly earned without noise.
   - [ ] No leaderboard/points; minimal, meaning-driven system.
   - [ ] Full test coverage for badge rules and persistence.

---

## Master Prompt — Badge System Audit & Improvement (Motivation-Driven)

### 1. Title

**F2-Badge Audit: Motivation, Meaning & User Value Review**

---

### 2. Intro (context + why this prompt exists)

The current badge system has been implemented following **Master Prompt 4**, and badges are now awarded deterministically and persisted.
Before finalizing EPIC F2, we must **audit and refine the badge system** to ensure it genuinely supports **user motivation, clarity, and confidence**, rather than adding noise or gamification artifacts.

This audit must align with the product’s intent:

- Serious, reflective, career-oriented
- Mentor-like guidance, not dopamine mechanics
- Badges as **signals of readiness and capability**, not rewards for activity

Your goal is to **evaluate, improve, and possibly remove or merge badges** so that the system:

- Reduces uncertainty
- Marks meaningful transitions
- Supports the Phase model (Ground me → Growing up → Position myself)

You must **not redesign the entire system** — only audit and improve what exists.

---

### 3. Feature scope

#### In scope

- Audit the **existing badge list** (below) against motivation best practices
- Identify:
  - Badges that should be **kept**
  - Badges that should be **renamed or reframed**
  - Badges that should be **merged**
  - Badges that should be **removed**

- Improve:
  - Badge naming (tone, clarity, professionalism)
  - Badge descriptions (“what this means for the user”)
  - Badge intent (capability / readiness / confidence signal)

- Propose **minor rule adjustments** if needed (without changing core mechanics)
- Ensure consistency with:
  - Phase model
  - Next Action Engine
  - Progressive disclosure

#### Explicitly out of scope

- Adding leaderboard, points, streaks, or social comparison
- Adding new badge categories unrelated to the current phases
- Adding AI-generated or probabilistic badges
- UI redesign beyond small copy adjustments

---

### 4. Input: current badge set to audit

Use **this exact list** as the starting point:

#### 🟢 Phase 1 — Activation

- **Grounded**
  → CV uploaded + basics filled
  → 3+ experiences structured

---

#### 🔍 Phase 2A — Job

- **Reality Check**
  → First job uploaded
  → Matching summary viewed

---

#### 🧭 Phase 2B — Identity

- **Self-Aware**
  → Career direction + values filled
  → First STAR story created
  → Personal canvas created

---

#### 🎯 Phase 3 — Positioning

- **CV Tailored**
  → Job-specific CV created

- **Letter Crafted**
  → Job-specific cover letter created

- **Pitch Ready**
  → Speech created

- **Application Ready** _(meta-badge)_
  → CV + letter + speech exist for same job

---

#### ⭐ Bonus / Power

- **Story Builder**
  → STAR story manually created from free text
- **Job Master**
  → 10 jobs uploaded
- **Application Master**
  → 10 CV or 10 cover letters created
- **Company Strategist**
  → Company canvas created
- **Customization Pro**
  → Custom template used
- **Profile Architect** _(future)_
  → Advanced profile configuration

---

### 5. Audit criteria (you must apply all of these)

Evaluate each badge against the following **non-negotiable principles**:

1. **Capability over activity**
   - Does the badge represent _what the user can now do_?

2. **Alignment with real user goals**
   - Does it reduce uncertainty, anxiety, or confusion?

3. **Phase coherence**
   - Does it clearly belong to a phase transition?

4. **Signal strength**
   - Would a user feel _reassured_ by earning this badge?

5. **Noise check**
   - Would removing this badge make the system clearer?

6. **Tone & professionalism**
   - Does the name sound credible, calm, and adult?

---

### 6. Expected outputs

Produce the following structured outputs:

#### A. Badge-by-badge audit table

For each badge:

- Keep / Rename / Merge / Remove
- Rationale (1–2 concise paragraphs)
- If renamed:
  - Old name
  - New proposed name
  - Why the new name is better

#### B. Revised badge list (final proposal)

- Clean, minimal list
- Ordered by Phase
- With:
  - Badge name
  - One-line meaning (“what this means for the user”)
  - Optional “what this unlocks / confirms”

#### C. Anti-patterns detected

- Identify where the current system:
  - Slips into volume-based gamification
  - Rewards repetition instead of insight
  - Risks devaluing core badges

#### D. Concrete improvement recommendations

- Max 5 actionable recommendations, such as:
  - “Remove volume-based badges”
  - “Merge X and Y into a single readiness badge”
  - “Move this badge from Bonus to Phase 2”

---

### 7. Technical boundaries

- Do **not** change the badge engine architecture
- Do **not** introduce new persistence models unless strictly required
- Any rule changes must remain deterministic and testable
- Keep compatibility with existing `BadgeId` types where possible (suggest migration only if justified)

---

### 8. Acceptance criteria

Your output is valid if:

- [ ] Every badge has been evaluated against motivation principles
- [ ] At least one badge is **removed, merged, or reframed** (if justified)
- [ ] The final badge list is **smaller or more meaningful** than the original
- [ ] Volume-based or grind-oriented badges are explicitly addressed
- [ ] The system clearly supports confidence, clarity, and readiness — not gamification

---

### 9. Tone & mindset reminder

Think like:

> _A calm, experienced career mentor validating meaningful progress_

Not like:

> _A game designer optimizing engagement metrics_

---

## Master Prompt 5 — End-to-End UX Stitching + Single E2E Happy Path

1. **Title**
   **F2-5: UX Stitching, Navigation CTAs, and the Single Playwright Happy Path**

2. **Intro (context + why)**
   EPIC F2 must be “end-to-end”: onboarding, hints, empty states, progressive disclosure, next actions, badges — all coherent. This prompt focuses on stitching the experience across pages using the progress engine and ensuring we have one strong E2E test representing the intended discovery path.

3. **Feature scope**
   - **In scope**
     - Ensure all core flows have explicit “next step” CTAs that match the phase model:
       - Phase 1 → Phase 2 choice
       - Phase 2A and 2B completion gating
       - Phase 3 material creation CTAs appear only when unlocked

     - Add lightweight “Continue” banners/buttons on:
       - `/profile/canvas` completion (suggest job upload or matching)
       - `/jobs/[jobId]/match` completion (suggest tailored CV/letter/speech)
       - Applications created pages (suggest completing the triad for same job)

     - Ensure empty states route correctly and never strand the user.

   - **Out of scope**
     - Visual refactors (EPIC F3).
     - Observability events (EPIC F1).

4. **Composables / services / domain modules**
   - Update `useUserProgress()` and `useGuidance()` integration points if needed to support:
     - Contextual “jobId-aware” next actions (e.g., on a specific job page).

   - Add a small helper in domain:
     - `getPhase3NextMaterialAction(jobId, existingMaterials)` to suggest the missing asset (CV vs letter vs speech).

5. **Components**
   - Reuse `ProgressBannerCard`, `GuidanceBanner`, `EmptyStateActionCard`, `BadgeGridCard`.
   - Add `NextStepFooter.vue` (optional):
     - A consistent footer CTA bar for wizard-like pages (CV creation, match page).
     - Must remain minimal and not conflict with existing page actions.

6. **Pages/routes to update**
   - Verify and adjust CTAs on:
     - `/` (always correct primary CTA)
     - `/profile/*` (story and canvas CTAs never dead-end)
     - `/jobs/*` including `/jobs/[jobId]/match` (tailored materials CTAs)
     - `/applications/cv/new`, `/applications/cover-letters/new`, `/applications/speech` (job targeting suggestions)

   - Breadcrumb behavior:
     - Keep existing breadcrumbs; ensure CTAs navigate without breaking back button expectations.

7. **AI operations impact**
   - None new.
   - Ensure existing AI ops remain JSON strict; no guidance content is generated by AI.

8. **Testing requirements**
   - Add/adjust Vitest tests to ensure “next step” CTA selection is stable for:
     - Canvas completion state
     - Matching completion state
     - Material triad completion state

   - **Single Playwright E2E happy path** (one file, serial, stable selectors):
     - Scenario: fresh user → onboarding/Phase 1 → Phase 2A minimal completion → Phase 2B job upload + matching → Phase 3 create tailored CV + cover letter + speech → verify badges and that dashboard shows “Application Ready”.
     - Use fixtures where possible to avoid brittle AI variability:
       - Use existing test fixtures for CV/job texts.
       - If AI calls are unavoidable, keep assertions tolerant (check presence of sections/ids, not exact text).

9. **Acceptance criteria**
   - [ ] Users always see a clear next step across core pages.
   - [ ] Phase 3 actions are locked until Phase 2A + 2B are complete.
   - [ ] Completion of match page leads users naturally into tailored materials creation.
   - [ ] E2E covers the intended discovery path and validates at least:
     - onboarding completion
     - next-action correctness
     - 2+ badges earned
     - creation of CV + letter + speech for same job

   - [ ] No new frameworks; Nuxt UI patterns remain consistent.

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

- Display a concise list of **active jobs** the user has interacted with
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

---

## Master Prompt — Dashboard Block 5: Milestones (Confirmation Only)

### 1. Title

**F2-Dashboard-5: Milestones as Confirmation (Non-Actionable)**

---

### 2. Intro (context + why)

Milestones confirm progress; they do not guide work.
This block must remain **calm, readable, and secondary**, reinforcing confidence without distracting from action.

---

### 3. Feature scope

#### In scope

- Display earned milestones only
- Provide hover/tap explanations
- No CTAs inside badges

#### Out of scope

- Locked badges
- Progress indicators
- Badge pages

---

### 4. Composables / services / domain modules

- Reuse existing badge composables
- No new logic

---

### 5. Components

- `MilestonesCard.vue`
- `BadgePill.vue` with tooltip/popover meaning

---

### 6. Pages / routes

- `/` dashboard
- Possibly `/profile` summary

---

### 7. Testing requirements

- Verify badge explanations are accessible
- Ensure badges never become primary CTA

---

### 8. Acceptance criteria

- [ ] Milestones feel reassuring, not distracting
- [ ] Meaning is always accessible
- [ ] Block can be ignored without loss
