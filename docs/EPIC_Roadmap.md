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
