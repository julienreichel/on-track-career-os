# HIGH-LEVEL NAVIGATION STRUCTURE

_(MVP → V1)_

The application is organized around **five main navigation zones**:

1. **My Profile**
   Identity, experiences, stories, strengths, personal canvas.

2. **Jobs & Companies**
   Job intake, job role card, company canvas, matching.

3. **Applications**
   CV builder, cover letters, speech builder, KPI generator.

4. **Interview Prep**
   Interview questions generator, interview simulator.

5. **Dashboard**
   Home entry point linking to all workflows.

This structure forms the **backbone of the product**.

---

# PAGE 0 — AUTH / ENTRY

## 0.1 Login / Signup Page

- Clean login box (`<UCard>`)
- Future: Google login
- Logo + app description

## 0.2 First-Time Onboarding Wizard

Guides the user through:

- Upload CV or start manually
- Enter values & goals
- Quick tour of features

Uses: `<USteps>` and `<UCard>`

---

# PAGE 1 — DASHBOARD (Home)

_(EPIC: 1A → 6)_

The central hub of the app. Always accessible.

### Sections:

- **Profile Completion Widget** (values, experiences, stories)
- **Personal Canvas Status** (Generated / Needs update)
- **Jobs in Progress**
- **Quick Actions:**
  - Add experience
  - Add job description
  - Generate CV
  - Practice interview

Nuxt UI: `<UGrid>` + `<UCard>` widgets

---

# SECTION 1 — MY PROFILE

## PAGE 1.1 — Profile Overview

_(EPIC 1A)_

Shows:

- Identity (name, headline)
- Goals & aspirations
- Core values
- Strengths & weaknesses

Actions:

- Edit profile
- Generate / Regenerate Personas

Navigation:
→ Personal Canvas
→ Experiences
→ Stories

---

## PAGE 1.2 — Experience List

_(EPIC 1A → EPIC 2)_

Displays all experience blocks using `<UTable>`.

Actions:

- Add new experience
- Edit experience
- Open STAR story page
- Delete

---

## PAGE 1.3 — Experience Editor

_(EPIC 1A)_

Form fields:

- Title
- Company
- Period
- Responsibilities
- Tasks

Nuxt UI: `<UForm>`, `<UFormGroup>`, `<UTextarea>`

Actions:

- Generate Impact / KPI suggestions
- Link stories

---

## PAGE 1.4 — STAR Story Builder

_(EPIC 2)_

Chat-like interface (`<UChat>`) guiding the user through:

- S → Situation
- T → Task
- A → Action
- R → Result

Then:

- AI generates achievements
- User edits and saves as story blocks

Actions:

- Attach to experience
- Export to CV / Letter

---

## PAGE 1.5 — Personal Business Model Canvas

_(EPIC 1B)_

Editable drag-and-drop canvas using `<UDraggable>`.

Includes blocks:

- Value Proposition
- Key Activities
- Strengths
- Target roles
- Channels
- Resources
- Career direction
- Pain relievers / Gain creators

Actions:

- Regenerate from profile
- Edit blocks
- Save versions _(V2)_

---

## PAGE 1.6 — Strengths & Communication Profile

_(EPIC 8 — V1)_

Displays:

- Communication style
- Work style
- Blind spots
- Suggested narrative adjustments

---

# SECTION 2 — JOBS & COMPANIES

## PAGE 2.1 — Job List

_(EPIC 5A)_

Actions:

- Add job
- View job analysis
- Connect job to company
- Delete job

---

## PAGE 2.2 — Add Job Description

_(EPIC 5A)_

User pastes job description text.

Actions:

- Extract role card
- Extract pains
- Extract required skills
- Edit extracted fields

---

## PAGE 2.3 — Job Role Card

_(EPIC 5A)_

Tabbed view (`<UTabs>`) showing:

- Responsibilities
- Required skills
- Behaviours
- Success criteria
- Explicit pains

Actions:

- Edit
- Regenerate
- Link to company

---

## PAGE 2.4 — Company List

_(EPIC 5B)_

Actions:

- Add company
- Open company canvas
- Edit details

---

## PAGE 2.5 — Add Company Description

_(EPIC 5B)_

Fields:

- Industry
- Size
- Product/services
- Market position

Optional paste → AI extends information.

---

## PAGE 2.6 — Company Business Model Canvas

_(EPIC 5B)_

Draggable/editable canvas similar to personal one.

AI-generated items:

- Market pains
- Internal challenges
- Customer pains
- Strategic priorities

---

## PAGE 2.7 — Matching Summary (User ↔ Job ↔ Company)

_(EPIC 5C — MVP)_

A key synthesis page.

Shows:

- Fit score _(V2)_
- Strengths ↔ Job pains map
- Achievements relevant to the job
- Potential contributions
- Risks & mitigation
- Summary paragraph

UI:
`<UBadge>`, `<UAlert>`, `<UCard>`

Actions:

- Regenerate
- Refine with prompts
- Send to Tailoring Engine

---

# SECTION 3 — APPLICATION MATERIALS

## PAGE 3.1 — CV Builder

_(EPIC 3 & EPIC 6)_

Tabs:

- Generic CV
- Job-tailored CV

Features:

- Template selector (`<USelect>`)
- Block editor (`<UEditor>`)
- Experience/story insertion modal
- Live preview

Actions:

- Export PDF
- Duplicate version _(V2)_

---

## PAGE 3.2 — Cover Letter Builder

_(EPIC 6)_

Workflow:

1. Select tone
2. Auto-generate using:
   - Personal canvas
   - Job role card
   - Company canvas
   - Matching summary

3. Edit letter

---

## PAGE 3.3 — Speech Builder

_(EPIC 4 & EPIC 6)_

Create or refine:

- Elevator pitch
- Career story
- “Why me?” tailored variant

---

## PAGE 3.4 — KPI Generator

_(EPIC 6)_

Displays:

- 2–3 recommended KPIs
- Explanation for each

Actions:

- Add to CV
- Add to letter
- Add to interview prep

---

# SECTION 4 — INTERVIEW PREP

## PAGE 4.1 — Interview Questions Generator

_(EPIC 7)_

Categories (accordion):

- Behavioral
- Technical
- Cultural
- Job-pain-based

Each card:

- Question
- Suggested answer
- Related user story

Actions:

- Add to practice set

---

## PAGE 4.2 — Interview Simulator (Chat)

_(EPIC 9 — V1)_

- AI asks questions
- User answers
- AI scores each answer
- Summary page

---

## PAGE 4.3 — Voice Interview Simulator

_(EPIC 14 — V2)_
Real-time voice interface (future).

---

# SECTION 5 — SYSTEM UTILITY PAGES

## PAGE 5.1 — Template Library

_(EPIC 12)_

Contains:

- CV templates
- Letter tone presets
- Story formats

## PAGE 5.2 — Settings

- Account settings
- Data export
- Delete account

---

# USER NAVIGATION FLOW (MVP)

### STEP 1 — Start

Dashboard → Start Profile Setup

### STEP 2 — Build Identity

1. Profile Overview
2. Add/Edit Experiences
3. STAR Stories
4. Generate Personal Canvas

### STEP 3 — Add Job

1. Add Job Description
2. Job Role Card
3. Add Company Info
4. Company Canvas

### STEP 4 — Matching

- Matching Summary
- Review suggestions

### STEP 5 — Generate Materials

- Tailored CV
- Tailored Letter
- Tailored Speech
- KPI Generator

### STEP 6 — Prepare Interview

- Interview Questions
- Interview Simulator

### STEP 7 — Export & Apply

- Export CV
- Export Letter
- Export Interview Notes

---

# FULL NAVIGATION TREE

```
🏠 Dashboard
├── Quick Actions
├── Profile Progress
├── Recent Jobs
├── Draft Applications
└── Suggested Next Steps

👤 My Profile
├── Profile Overview
│   ├── Identity & Headline
│   ├── Goals & Aspirations
│   ├── Personal Values
│   └── Strengths & Weaknesses
├── Experiences
│   ├── Experience List
│   ├── Experience Editor
│   └── STAR Story Builder
├── Personal Business Model Canvas
└── Communication & Psychology Profile (V1)

🏢 Jobs & Companies
├── Jobs
│   ├── Job List
│   ├── Add Job Description
│   └── Job Role Card
└── Companies
    ├── Company List
    ├── Add Company Information
    └── Company Business Model Canvas

🔗 Matching
└── Matching Summary

📝 Applications
├── CV Builder
│   ├── Generic CV
│   └── Tailored CV
├── Cover Letter Builder
├── Speech Builder
└── KPI Generator

🎤 Interview Prep
├── Interview Questions Generator
├── Interview Simulator (Text) (V1)
└── Voice Interview Simulator (V2)

🧱 System Utilities
├── Template Library (V1)
├── Settings
└── Data Export / Delete Account
```
