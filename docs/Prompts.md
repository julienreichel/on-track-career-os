# ✅ UPDATED MASTER PROMPT 1 — STARStory Domain Layer (Many Stories per Experience)

### 1. CONTEXT

Backend & AI are ready:

- `Experience` and `STARStory` entities defined, with 1→\* relation.
- AI ops `ai.generateStarStory` and `ai.generateAchievementsAndKpis` defined in the AI Contract.

You need a domain layer that **explicitly supports multiple stories per experience**.

### 2. COMPONENTS / COMPOSABLES

Create or update:

- `StarStoryRepository`
- `StarStoryService`
- `useStoryEngine()` (as already planned in the Component/Page mapping)

### 3. PAGES INVOLVED

- `/profile/experiences/:experienceId/stories` (per-experience story list)
- `/profile/experiences/:experienceId/stories/new` (create)
- `/profile/experiences/:experienceId/stories/:storyId/edit` (edit)

### 4. IMPLEMENTATION INSTRUCTIONS

**Repository methods (GraphQL-based):**

- `getStoriesByExperience(experienceId: string): Promise<StarStory[]>`
- `getStoryById(storyId: string): Promise<StarStory | null>`
- `createStoryForExperience(experienceId: string, input: StarStoryInput): Promise<StarStory>`
- `updateStory(storyId: string, input: StarStoryInput): Promise<StarStory>`
- `deleteStory(storyId: string): Promise<void>`

**Service methods:**

- `generateStarFromFreeText(experienceId, sourceText)` → uses `ai.generateStarStory`
- `generateAchievementsForStory(storyId)` → loads story → calls `ai.generateAchievementsAndKpis`
- `attachAchievementsToStory(storyId, achievements, kpiSuggestions)`
- `linkStoryToExperience` is implied by `createStoryForExperience`

**Composable `useStoryEngine()` should expose:**

- State:
  - `storiesByExperience: Record<experienceId, StarStory[]>`
  - `currentStory: StarStory | null`
  - `loading`, `error`

- Actions:
  - `loadStories(experienceId)`
  - `selectStory(storyId)`
  - `createStoryDraft(experienceId)`
  - `saveStory(experienceId, storyDraft)`
  - `deleteStory(storyId)`
  - `generateStar(experienceId, sourceText | formFields)`
  - `generateAchievementsForCurrent()`

Keep domain functions pure and tested; follow existing Experience/CV patterns.

### 5. TESTING INSTRUCTIONS

- Repository tests:
  - Multiple stories per experience are returned.
  - Deletion removes only targeted story.

- Service tests:
  - `generateStarFromFreeText` calls AI with expected payload.
  - Achievements are attached to the correct story.

- Composable tests:
  - `loadStories` populates `storiesByExperience[experienceId]`.
  - Selecting a story updates `currentStory`.
  - Error and loading flags work.

### 6. ACCEPTANCE CRITERIA

- Domain layer supports **N stories per Experience**.
- No function assumes “there is at most one story”.
- All tests green and consistent with other domains.

---

# ✅ UPDATED MASTER PROMPT 2 — Experience List Page (`/profile/experiences`)

### 1. CONTEXT

Experience list should show **how many stories each experience has**, and provide entry points to the per-experience story library (not a single story).
See Component/Page mapping for Experience List & Story Builder.

### 2. COMPONENTS

- `<UTable>` (rows = experiences)
- `<UBadge>` or `<UChip>` for story count
- `<UButton>` for navigation

### 3. COMPOSABLES

- `useExperienceStore()`
- `useStoryEngine()`

### 4. IMPLEMENTATION INSTRUCTIONS

For each experience row:

- Show:
  - Title, company, dates
  - “Stories: N” badge
    - `N = storiesByExperience[experience.id]?.length ?? 0`

- Actions:
  - `View stories` → navigate to `/profile/experiences/:experienceId/stories`
  - `+ New story` → navigate to `/profile/experiences/:experienceId/stories/new`

Load story counts lazily via `useStoryEngine().loadStories(experienceId)` when the page is mounted or when the row is expanded (MVP can just load for all experiences if count is small).

### 5. TESTING

- When `storiesByExperience` has entries, counts match.
- Clicking “View stories” navigates to correct route.
- Clicking “+ New story” leads to the story builder page.

### 6. ACCEPTANCE CRITERIA

- UI communicates **counts**, not just “has / has not”.
- No assumption of single story per experience.
- MVP remains simple and clean.

---

# ✅ UPDATED MASTER PROMPT 4 — Per-Experience Story Library + STAR Builder

### 1. CONTEXT

We need:

1. **Per-experience story library**: `/profile/experiences/:experienceId/stories`
2. **New story flow**: `/profile/experiences/:experienceId/stories/new`
3. **Edit story flow**: `/profile/experiences/:experienceId/stories/:storyId/edit`

See EPIC 2 and the mapping for STAR Story Builder.

### 2. COMPONENTS

- Story List Page:
  - `<UTable>` or `<UList>` for stories
  - Actions: “Edit”, “Delete”, “Generate Achievements”

- Story Builder Page:
  - Guided STAR form (no real-time chat needed for MVP, just step-by-step fields)
  - Fields:
    - Situation, Task, Action, Result

  - Buttons:
    - “Generate STAR from free text” (optional)
    - “Generate Achievements & KPIs”
    - “Save story”

### 3. COMPOSABLES

- `useStoryEngine()`
- `useExperienceStore()`

### 4. IMPLEMENTATION INSTRUCTIONS

**A. Story List Page `/profile/experiences/:experienceId/stories`**

- Fetch and display all stories with:
  - Short preview (first 1–2 sentences of Situation/Result)
  - Columns: `#`, `Summary`, `Has achievements?`

- Buttons:
  - `+ New story` → `/profile/experiences/:experienceId/stories/new`
  - `Edit` → `/profile/experiences/:experienceId/stories/:storyId/edit`
  - `Delete` → calls `deleteStory(storyId)`

- Show counts and statuses (e.g. `Draft` vs `With achievements`).

**B. STAR Story Builder (New/Edit)**

For **new**:

- Start with empty fields or optional “Paste free-text description” area.
- Optionally: button “Generate STAR from this free text” → `ai.generateStarStory`.

For **edit**:

- Load story by id, populate fields.

In both cases:

- Allow generating achievements & KPIs for the **current story**:
  - Button “Generate Achievements & KPIs”
  - Call `ai.generateAchievementsAndKpis` via `useStoryEngine`.

- Allow saving at any time.

### 5. TESTING

- List page:
  - Displays all stories; actions work (navigation, delete).

- Builder pages:
  - Correctly load story for edit mode.
  - Save updates existing story; new creates and links to experience.
  - AI calls are made with correct inputs.

### 6. ACCEPTANCE CRITERIA

- A user can create **multiple** stories for one experience.
- All stories are visible and manageable from the per-experience story library page.
- Builder supports both create and edit with the same component.

---

# ✅ UPDATED MASTER PROMPT 5 — `<StarStoryComponent/>` (Unchanged Logic, Multi-Use)

### 1. CONTEXT

Component still represents a **single story**, but it will be **used multiple times** across the story list and builder pages.

### 2. COMPONENT REQUIREMENTS

- Accept `modelValue: StarStory` and `readonly` props.
- Emit `update:modelValue` for field changes.
- Display achievements/KPIs if present.

### 3. IMPLEMENTATION INSTRUCTIONS

- Use `<UCard>` for layout, splitting S/T/A/R sections.
- Achievements & KPIs in `<UAccordion>` or `<UCallout>`.
- Do **not** store or assume anything about other stories; it only knows about one.

### 4. TESTING & ACCEPTANCE CRITERIA

Same as before; just ensure it’s cleanly reusable wherever a single story is displayed or edited.

---

# ✅ UPDATED MASTER PROMPT 6 — Achievements & KPI Panel (Multi-Story-aware)

### 1. CONTEXT

Achievements and KPIs are attached **per story**, but the same component can be used:

- In the Star Story Builder
- In the Experience Editor (once a story is selected)

### 2. COMPONENT

`<AchievementsPanel/>`:

- Props:
  - `achievements: string[]`
  - `kpiSuggestions: string[]`
  - `readonly: boolean`

- Emits:
  - `update:achievements`
  - `update:kpiSuggestions`

### 3. IMPLEMENTATION

- Render checkable list or simple `<ULi>` items.
- Optional “Add item” in edit mode.
- No assumption about experiences; it lives purely at story level.

### 4. TESTING / ACCEPTANCE CRITERIA

- Correctly reflects and updates arrays.
- Works identically regardless of which story or page uses it.

---

# ✅ UPDATED MASTER PROMPT 7 — E2E Flow with Multiple Stories per Experience

### 1. CONTEXT

We need at least one E2E scenario validating “multiple stories per experience” behavior.

### 2. SCENARIO (Playwright or similar)

1. Login as test user.
2. Create or open an existing Experience.
3. From Experience List:
   - Go to `/profile/experiences/:experienceId/stories`.

4. Create **Story A** via `/.../stories/new`. Save.
5. Create **Story B** for the same experience. Save.
6. Confirm in the story list that:
   - 2 stories are visible.

7. Go to Experience Editor:
   - Use story selector to choose Story A → generate achievements/KPIs.
   - Then choose Story B → generate different achievements/KPIs (based on mock response).

8. Ensure experience list shows “Stories: 2”.

### 3. ACCEPTANCE CRITERIA

- One experience can have 2+ stories without conflict.
- Story list, builder, and experience editor all work with multiple stories.
- No part of the UI or domain layer breaks when multiple stories exist.

---

# ✅ MASTER PROMPT 1 — Implement PersonalCanvas Domain Layer

(Repository + Service + Composable)

### 1. CONTEXT

The backend for EPIC 1B is fully implemented: GraphQL model, AI operation (`ai.generatePersonalCanvas`), repository/service/composable tests already exist (as per the project status).
BUT the **frontend domain layer is missing**: we need to expose the data to UI pages through clean composables, following your architecture.
See: high-level architecture and data model.

### 2. COMPONENTS / COMPOSABLES

Create or use:

- `PersonalCanvasRepository` (wraps GraphQL queries/mutations)
- `PersonalCanvasService` (business logic)
- `useCanvasEngine()` (exposes load/save/regenerate for UI)
  — already mentioned in Component/Page Mapping:

### 3. PAGES INVOLVED

None yet — this is backend/frontend domain foundation.

### 4. IMPLEMENTATION INSTRUCTIONS

- Follow existing patterns from Experience, STARStory, CVDocument.
- Implement in `/domain/personal-canvas/` folder.
- Methods:
  - `loadCanvas(userId)`
  - `saveCanvas(canvasInput)`
  - `regenerateCanvas(profile, experiences, stories)`

- `regenerateCanvas()` must call `ai.generatePersonalCanvas` using AIC contract.
- Ensure all types are imported from the Lambda re-export (single source of truth).
- Keep functions pure, TDD-first, max line thresholds respected.

### 5. TESTING INSTRUCTIONS

Create unit tests mirroring other domains:

- Repository: GraphQL calls, optimistic update.
- Service: correct merge/update logic; regeneration calls AIC with valid schema.
- Composable: state management + error states + loading states.

### 6. ACCEPTANCE CRITERIA

- All repository, service, composable functions implemented + tested.
- `useCanvasEngine()` exposes `canvas`, `loadCanvas()`, `saveCanvas()`, `regenerateCanvas()`.
- Calling `regenerateCanvas()` returns a validated PersonalCanvas JSON.
- No UI work yet.
- All tests pass.

---

# ✅ MASTER PROMPT 2 — Implement `/canvas` Page (View + Edit)

### 1. CONTEXT

EPIC 1B requires **a visual, editable canvas**. According to navigation + component mapping, this is page **1.5**.
See: Navigation and Component Mapping.

### 2. COMPONENTS TO USE

- **UI:** `<UContainer>`, `<UCard>`, `<UFormGroup>`, `<UTextarea>`, `<UButton>`
- **Custom components:**
  - `PersonalCanvasComponent.vue` (displays 9 sections)

- **Composables:**
  - `useCanvasEngine()`
  - `useUserProfile()`
  - `useExperienceStore()`
  - `useStoryEngine()` (for regeneration source data)

### 3. PAGE TO IMPLEMENT

- `/canvas` displaying:
  - All 9 fields:
    valueProposition, keyActivities, strengthsAdvantage, targetRoles, channels, resources, careerDirection, painRelievers, gainCreators
  - “Regenerate Canvas” button
  - “Save” button
  - Simple column layout (no drag & drop for MVP)

### 4. IMPLEMENTATION INSTRUCTIONS

- Load existing canvas via `useCanvasEngine().loadCanvas()`.
- If no canvas exists → display “Generate canvas” button.
- Editing uses `<UForm>` or inline `<UTextarea>` depending on simplicity.
- On save, call `saveCanvas()`.
- On regenerate, call `regenerateCanvas(profile, experiences, stories)` using data from composables.

### 5. TESTING INSTRUCTIONS

- Component tests:
  - Page renders 9 editable sections.
  - Buttons trigger composable functions.
  - Loading state displayed.

- Integration tests:
  - Mock composable return values.
  - Canvas persists after edit.
  - Regenerate replaces existing canvas content.

### 6. ACCEPTANCE CRITERIA

- Page loads existing canvas when user returns.
- Editing works for all fields.
- Regeneration uses latest profile/experience/story data.
- Responsive and minimal.
- No drag & drop (YAGNI).
- Adheres to Nuxt UI conventions.

---

# ✅ MASTER PROMPT 3 — Implement `<PersonalCanvasComponent/>`

### 1. CONTEXT

This reusable component is required for multiple views (future: versioning, matching explanations).
See architecture component list.

### 2. COMPONENTS TO CREATE

`components/personal-canvas/PersonalCanvasComponent.vue`

### 3. REQUIRED FEATURES (MVP ONLY)

- Display all 9 sections
- Editable mode using slots or props
- Optional read-only mode

### 4. IMPLEMENTATION INSTRUCTIONS

- Props:
  - `modelValue` (the full PersonalCanvas object)
  - `readonly`

- Emit:
  - `update:modelValue` for each field

- UI:
  - Wrap each section in `<UCard>` with `<UTextarea>` when editable.

- No drag & drop yet — too costly for MVP (YAGNI).

### 5. TESTING INSTRUCTIONS

- Test that each field renders.
- Editing updates modelValue via emitted event.
- Readonly mode disables inputs.

### 6. ACCEPTANCE CRITERIA

- The component is fully controlled via v-model.
- No business logic inside, only UI and events.
- Re-usable in future canvases.

---

# ✅ MASTER PROMPT 4 — Implement AI Regeneration Flow (Frontend)

### 1. CONTEXT

`ai.generatePersonalCanvas` is fully available and validated.
We implement its **frontend orchestration**.
See AI Interaction Contract.

### 2. COMPOSABLES

Modify `useCanvasEngine()` to:

- `async regenerateCanvas()`:
  - fetch profile (`useUserProfile`)
  - fetch experiences (`useExperienceStore`)
  - fetch stories (`useStoryEngine`)
  - call AI op with validated schema
  - save result to backend

### 3. IMPLEMENTATION INSTRUCTIONS

- Validate inputs before calling AI.
- Use existing Amplify GraphQL client with owner-based auth.
- Ensure loading/error states in composable state.
- Cache updated canvas in in-memory state to avoid re-fetch.

### 4. TESTING INSTRUCTIONS

- Mock AI operation (AIC schema).
- Tests for:
  - correct payload
  - missing data fallback
  - canvas gets updated
  - errors surface correctly

### 5. ACCEPTANCE CRITERIA

- Regeneration always produces a valid PersonalCanvas object.
- Works even with partial user data (AIC fallback rules).
- UI instantly displays the regenerated content.

---

# ✅ MASTER PROMPT 5 — Glue Navigation: Add Canvas Entry Point

### 1. CONTEXT

Navigation tree already defines the page.
See High-Level Navigation.

### 2. IMPLEMENTATION INSTRUCTIONS

- Add link to `/canvas` in:
  - Sidebar (“My Profile”)
  - Dashboard card (“Personal Canvas Status”)

- Indicate:
  - “Generated”
  - “Needs update” (use canvas.needsUpdate flag)

### 3. TESTING

- Click navigation → open canvas page.
- Status reflects `needsUpdate`.

### 4. ACCEPTANCE CRITERIA

- User can reach canvas page from ≥2 places.
- Status displayed correctly.

---

# ✅ MASTER PROMPT 6 — Implement E2E Canvas Flow (Minimal)

### 1. CONTEXT

EPIC 1B must be validated end-to-end.
See Project Status and roadmap dependency for EPIC 1B.

### 2. END-TO-END FLOW

1. User logs in
2. Profile filled
3. Experiences exist
4. User visits `/canvas`
5. User clicks “Generate Canvas”
6. Canvas is displayed
7. User edits → Save
8. Reload page → changes persist

### 3. TESTING INSTRUCTIONS

- Use Playwright minimal tests.
- Mock AI only if required by testing environment.
- Validate canvas is persisted in GraphQL.

### 4. ACCEPTANCE CRITERIA

- Canvas can be generated, edited, saved, reloaded.
- Zero console errors.

---

# ✅ MASTER PROMPT 7 — Implement “Canvas Weak Sections” Indicators (MVP-Lite)

### 1. CONTEXT

The EPIC mentions “AI suggestions for weak sections,” but fully implementing suggestions is NOT MVP.
We do a minimal display: weak sections = empty or too short.
(YAGNI: no AI improvement flow.)

### 2. COMPONENTS

Add small badges or warnings in `PersonalCanvasComponent.vue`.

### 3. IMPLEMENTATION

- Compute weak sections in `useCanvasEngine()` (pure function).
- Expose `weakSections: string[]`.
- Component shows small `<UBadge color="yellow">Needs attention</UBadge>`.

### 4. TESTS

- Test detection logic: empty, whitespace-only, or < 5 chars.

### 5. ACCEPTANCE CRITERIA

- MVP visual cue works.
- No AI calls triggered for this feature.
