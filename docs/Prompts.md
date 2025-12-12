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
