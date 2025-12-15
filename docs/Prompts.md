# ✅ EPIC 3 — MASTER PROMPT PACK

**Generic CV Generator (Notion-style Editor)**
Covers:

- Block editor
- Layout engine
- Regenerate-one-block
- Add/remove/reorder blocks
- Include/skip experiences & sections
- 2-page length heuristics
- PDF export
- DRY composables and components

---

# 🔷 **MASTER PROMPT 3.3 — Build the Notion-Style Block Editor (UI Components)**

### **Reason**

Users must reorder, edit, add, remove blocks, and regenerate individual blocks in a minimal, clean interface.

### **Components Needed**

- `<CvEditor />` — master component
- `<CvBlock />` — displays blocks (summary, experience, skills…)
- `<CvBlockEditor />` — inline edit modal
- `<CvBlockActions />` — remove / regenerate / move
- `<CvSectionAdd />` — add custom section
- `<CvExperiencePicker />` — select experiences to include

### **Composables Needed**

- `useCvEditor()` — manages local block state
- `useCvGenerator()` — wraps AI call to regenerate block(s)

### **Pages to Create/Update**

- `/cv` — list all CV documents
- `/cv/new` — create new CV (wizard: pick experiences + generate)
- `/cv/[id]` — full editor

### **Acceptance Criteria**

- Editor supports:
  - Add/remove/reorder blocks
  - Inline editing
  - Regenerate one block
  - Add custom empty section

- Uses `<UCard>`, `<UDraggable>`, `<UButton>` (Nuxt UI only)
- Auto-save every change
- Clean, minimal UI (not rich-text, only bold/italic + block structure)
- Fully tested:
  - Rendering
  - Drag/reorder
  - Edit/save
  - Remove block

---

# 🔷 **MASTER PROMPT 3.4 — CV Generation Flow (Wizard: Select Experiences → Generate CV)**

### **Reason**

Users choose which experiences appear in the CV. This determines content length.

### **Components Needed**

- `<CvExperiencePicker />`
- `<CvGenerationWizard />` (simple 2-step flow)

### **Pages to Create/Update**

- `/cv/new`

### **Acceptance Criteria**

- Step 1: Select experiences (multi-select)
- Step 2: Generate with `ai.generateGenericCv`
- Persist result to CVDocumentRepository
- Navigate to `/cv/[id]`
- If user has **no experiences**, show clear empty state
- If user has **1–2 experiences**, Lambda returns expanded text
- If **8+ experiences**, Lambda compresses content

---

# 🔷 **MASTER PROMPT 3.5 — Add Block-Level AI Regeneration**

### **Reason**

Users must regenerate _one_ block without touching the rest.

### **Components Needed**

- `<CvBlockActions />` update (Regenerate)
- Reuse composable: `useCvGenerator()`

### **Pages to Update**

- `/cv/[id]`

### **Acceptance Criteria**

- Click “Regenerate block” → calls `ai.generateGenericCv` with:

  ```
  regenerateBlockId
  existingCvDocument
  ```

- Only that block is replaced
- All IDs except regenerated one remain stable
- Undo capability: single-level undo stored in composable
- Toasts for success/error

---

# 🔷 **MASTER PROMPT 3.6 — Add Support for Optional Sections (Skills, Languages, Certifications, Interests + Custom)**

### **Reason**

EPIC requires flexible sections that users can add/remove anywhere in the CV.

### **Components Needed**

- `<CvSectionAdd />` — button to add section
- `<CvSectionChooser />` — modal listing available section types

### **Pages to Update**

- `/cv/[id]`

### **Acceptance Criteria**

- User can add:
  - Summary (top)
  - Skills
  - Languages
  - Certifications
  - Interests
  - Custom section (title optional)

- Section can be removed
- Section can be reordered
- If removed, no side-effects

---

# 🔷 **MASTER PROMPT 3.7 — Implement 2-Page Length Estimation + Warnings**

### **Reason**

CV must stay ~2 pages. No complex pagination now (YAGNI), but we need heuristics.

### **Components Needed**

- `<CvLengthIndicator />`

### **Composables Needed**

- `useCvLengthEstimator()`

### **Pages to Update**

- `/cv/[id]`

### **Acceptance Criteria**

- Compute approximate length = total chars / 1800
- Display:
  - Green (<2 pages)
  - Yellow (2–3 pages)
  - Red (>3 pages)

- Auto-refresh on each block change
- No blocking behaviour

---

# 🔷 **MASTER PROMPT 3.8 — PDF Export (MVP)**

### **Reason**

Exporting is part of EPIC 3 MVP.

### **Components Needed**

- None (simple button + backend print route OR client-side print)

### **Pages to Update**

- `/cv/[id]`

### **Acceptance Criteria**

MVP solution (YAGNI):

- Implement **browser print to PDF**:
  - `<CvPrintableView />` with minimal styling
  - Print button → `window.print()`
  - Layout optimized for A4

- No server-side PDF generation

---

# 🔷 **MASTER PROMPT 3.9 — Full Test Suite for CV Editor**

### **Reason**

Your architecture requires 80%+ test coverage
(see **Tech Foundation Spec** — criteria from file: ).

### **Tests to Include**

- Block rendering
- Reordering
- Adding/removing blocks
- Editing
- Regenerate one block (mock AI)
- Saving (auto-save)
- PDF print view snapshot tests

### **Acceptance Criteria**

- All tests pass
- Coverage ≥ 80%
- No flaky tests

---

# 🔷 **MASTER PROMPT 3.10 — Final Integration: Add CV Entry Points Across UI**

### **Reason**

Users must be able to create or edit CVs from dashboard and profile.

### **Components Needed**

None new.

### **Pages to Update**

- `/profile`
- `/dashboard`
- `/applications/cv` if exists

### **Acceptance Criteria**

- Dashboard includes “Generate CV” shortcut
- Profile includes “Create CV from profile”
- CV list accessible from navigation sidebar
