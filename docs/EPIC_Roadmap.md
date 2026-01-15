# EPIC ROADMAP (MVP → V1 → V2 → V3)

### EPIC F1 — Product Observability & Feedback Loops

**Goal:**
Understand how users actually use the product and where they struggle.

**Includes:**

- Usage tracking at feature / page level (privacy-first)
- Drop-off and friction detection
- AI output feedback (👍 / 👎 / optional comment)
- Confidence & usefulness signals on AI-generated data
- Error & anomaly detection

**Success Criteria:**

- Clear visibility on user paths
- Ability to identify unused or confusing features
- Actionable feedback on AI usefulness

---

### EPIC F2 — Onboarding, Guidance & User Flow Clarity

**Goal:**
Ensure users always know **what to do next** and **why it matters**.

**Includes:**

- First-time user guidance
- Contextual hints and explanations
- Empty-state guidance
- Progressive disclosure (reduce cognitive load)
- Clear “next action” suggestions

**Success Criteria:**

- Users complete core flows without external explanation
- Reduced abandonment during early usage
- Increased completion of profile, canvas, and first CV

---

### EPIC F3 — UI Simplification & UX Consistency

**Goal:**
Make the interface minimal, predictable, and calm.

**Includes:**

- Remove visual noise and redundant UI
- Enforce Nuxt UI usage everywhere
- Eliminate custom CSS
- Consistent layouts, spacing, and interaction patterns
- Review navigation to remove dead or secondary paths

**Success Criteria:**

- Fewer UI components with clearer roles
- Consistent look & feel across all pages
- Faster user comprehension

---

### EPIC F4 — Code Quality, Performance & Security Hardening

**Goal:**
Ensure the codebase is efficient, secure, and easy to evolve.

**Includes:**

- Enforce GraphQL best practices
  - ❌ No `list()` in production paths
  - ✅ Use relationships & filtered queries

- Remove dead code (components, composables, models)
- Ensure correct foldering & composable structure
- Review data access for performance
- Strengthen security & authorization patterns

**Success Criteria:**

- Leaner codebase
- Predictable data access costs
- Clear architectural rules respected everywhere

---

# V1 — Enhance Quality & Personalization

---

## EPIC 3C — CV Customization (Sections/Experience Selection + Templates)

**Goal:**
Let users control **what goes into a CV** and **how it looks**, so every new CV generation can reliably match a chosen layout and content scope—without relying on the current “new CV” wizard UI.

---

### Includes

#### 1) CV Generation Settings (content scope)

- **Per-user settings** to decide:
  - Which **experiences** are eligible/included by default
  - Which **sections** are included (e.g., Summary, Skills, Experience, Education, Projects, Certifications, Languages, Interests, etc.)

- A setting: **“Ask me each time before generating a CV”**
  - If enabled: generation flow shows a lightweight prompt/modal to confirm selection at generation time
  - If disabled: generation uses saved defaults silently

- This **replaces the current UI** on `/applications/cv/new` (the page becomes a thin “Generate” entry point using saved settings, optionally prompting when “ask each time” is enabled).

#### 2) CV Template Library (Markdown-based)

- Users can **select a template** used as the “style/layout target” for generation.
- Templates are stored as **Markdown** (with conventions/placeholders you already use for print/export parity).
- The user can:
  - Start from predefined templates
  - **Edit** an existing template
  - **Create** a new template

- Selected template is passed into `generateCv` and the AI is instructed to **match the provided example** as closely as possible (structure + headings + ordering + formatting conventions).

#### 3) System Templates (seeded)

Generate and ship **3 templates** in the system:

- **Template A:** Conventional CV (classic, 2-page friendly)
- **Template B:** Conventional CV (modern, slightly different hierarchy/visual rhythm but still ATS-safe)
- **Template C:** **Competency-based CV** (skills/competencies first; experience mapped as evidence)

---

### User Value

- Users can produce multiple CV variants quickly (short/long, targeted vs generic) **without redoing the selection work** each time.
- CV output becomes more predictable because generation is “anchored” to a concrete template example.
- Supports different strategies (standard chronological vs competency-driven) depending on the job.

---

### Reason in V1

EPIC 3 is already functional end-to-end (generate → edit → print). This EPIC upgrades it from “works” to “repeatable and customizable,” which aligns with the project’s post-MVP hardening/personalization direction and the planned need for a Settings area.

---

### Success Criteria

- Users can create a new CV in **≤ 30 seconds** using saved settings (no wizard friction).
- Regenerations **preserve structure** consistently according to the selected template.
- Users can maintain **multiple templates** and switch between them without breaking print/export.
- “Ask each time” flow is fast and unobtrusive, and becomes the only time users see selection UI.
- Test coverage added for:
  - Template CRUD
  - Settings CRUD + effective generation inputs
  - `/applications/cv/new` (now thin) happy path
  - At least one E2E flow for “ask each time” selection → generate → edit → print.

---

## EPIC 7 — Expanded Personal Profile (Communication & Psychological)

**Goal:** Add deeper behavioral insights.

### Includes

- Communication style
- Work style
- Strengths & blind spots
- Integration into tailoring

### User Value

More authentic and personalized applications.

---

# V2 — Intelligence, Automation & Growth

## EPIC 8 — Multi-Version Tracking & Revision History

**Goal:** Support professional iterative workflows.

### Includes

- Version snapshots
- Compare versions
- Restore versions

### User Value

Power-user functionality for serious job hunters.
