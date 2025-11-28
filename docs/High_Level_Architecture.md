# High-Level Architecture Overview

Your system is composed of **four major layers**, each offering functional modules:

---

## 1. User Experience Layer (Frontend)

Nuxt UI components defining how the user interacts with the system.

---

## 2. Core Application Layer (Business Logic)

Internal services that transform, interpret, and manage data.
(Non-technical, conceptual layer.)

---

## 3. AI Interpretation & Generation Layer

Orchestrated LLM logic used for extraction, modeling, generation, and synthesis.

---

## 4. Data Layer

Stores all structured information:
User profile, experiences, canvases, jobs, companies, documents, interview sessions.

---

# Component Model (Design Phase)

Below is the list of core components, mapped to EPICs, with their purpose and interactions.

---

# 1. User Identity Components

_(Support EPIC 1A and EPIC 8)_

## 1.1 User Profile Manager

- Stores raw personal data: identity, values, goals, aspirations
- Manages updates from every other component
- Acts as the **source of truth** for all personalization

**Nuxt UI:**
`<UForm>`, `<UCard>`, `<UAccordion>`

---

## 1.2 Experience Intake Component

- Handles CV upload → text extraction → segmentation
- Allows manual entry of experiences
- Manages structured fields (role, years, tasks, responsibilities)

**Nuxt UI:**
`<UDropzone>`, `<UFormGroup>`, `<UTable>` or `<UList>`

---

## 1.3 Story Builder (STAR Model)

_(Supports EPIC 2)_

- Collects STAR stories through guided Q&A
- Allows editing & polishing with AI
- Links stories to experiences
- Generates reusable “story blocks” for CVs, letters, interviews

**Nuxt UI:**
Custom `<UChat>` pane, `<UTextarea>`, `<UModal>`

---

## 1.4 Personal Strengths & Psychology Module

_(Supports EPIC 8)_

- Captures communication style & work style
- Stores long-term behavioural insights
- Influences story writing & letter tone

---

# 2. Canvas Components

_(Support EPIC 1B, EPIC 5B, EPIC 5C)_

## 2.1 Personal Business Model Canvas Component

- Auto-generated from user data
- Editable, structured by draggable zones
- Core element of the user's professional identity

**Nuxt UI:**
`<UContainer>`, `<UCard>`, `<UDraggable>`

---

## 2.2 Company Business Model Canvas Component

- Editable canvas for company modeling
- Can be AI-pre-filled from user inputs
- Forms the basis for strategic matching and tailoring

**Flow:**
_Job → Company Context → Company Canvas → Tailoring Engine_

---

## 2.3 Job Role Card Component

_(Supports EPIC 5A)_

- Summarizes extracted job role details
- Includes responsibilities, skills, behaviours, success criteria, pains

**Nuxt UI:**
`<UCard>` with `<UTabs>`

---

## 2.4 Matching Engine Component

_(Supports EPIC 5C)_

- Compares user data, job card, and company canvas
- Produces:
  - Fit Summary
  - Impact Areas
  - Contribution Map
  - Risk mitigation suggestions

**Nuxt UI:**
Match Summary page with `<UAlert>` and `<UBadge>` highlights

---

# 3. Content Generation Components

_(Support EPIC 3, EPIC 4, EPIC 6, EPIC 7)_

## 3.1 CV Builder Component

- Notion-style block editor
- Experience, story, skill, and metrics blocks
- Job-specific tailoring mode
- Template selector and PDF export

**Nuxt UI:**
`<UEditor>`, `<USelect>`, `<UGrid>`, `<UButton>`

---

## 3.2 Cover Letter Generator Component

- Choose tone (corporate, bold, storytelling, etc.)
- Generate from user + job + company + matching
- Fully editable

**Nuxt UI:**
`<URadioGroup>`, `<UEditor>`

---

## 3.3 User Speech Builder

_(Supports EPIC 4)_

- Builds elevator pitch
- Builds career story
- Builds “Why Me?” narrative

**Nuxt UI:**
`<UTextarea>` + “AI Improve” button, `<USteps>`

---

## 3.4 KPI Proposition Generator

- Suggests 2–3 KPIs grounded in company pains & user strengths
- Adds justification/explanation

**Nuxt UI:**
`<UBadge>`, `<UCallout>`

---

## 3.5 Interview Question Generator

_(Supports EPIC 7)_

- Generates questions per category
- Suggests answers based on user stories
- Exportable preparation sheet

**Nuxt UI:**
`<UAccordion>`, `<UCard>`

---

# 4. Interview Simulation Components

_(Support EPIC 9 and EPIC 14)_

## 4.1 Text Interview Simulator

- Role-play with AI
- Real-time or post-session feedback
- Summary reporting

**Nuxt UI:**
Custom `ChatPane`, `<UProgress>`, `<UAlert>`

---

## 4.2 Voice Interview Simulator (Future — V2)

- Voice recognition
- Natural pacing & filler-word analysis
- Realistic live simulation

**Flow:**
Speech → Analysis Engine → Feedback Report

---

# 5. Supporting Components

## 5.1 Dashboard

- Overview of user progress
- Quick access to experiences, canvases, jobs
- Entry point for EPIC workflows

**Nuxt UI:**
`<UCard>`, `<UTabs>`, `<UVerticalNavigation>`

---

## 5.3 Template Library

- Stores visual templates for CVs
- Presets for letters and stories

---

# Interaction Flow Between Components

```
USER INPUTS DATA
     ↓
User Profile Manager
     ↓
Experience Intake  ←→  Story Builder
     ↓
Personal Strengths & Values
     ↓
Personal Canvas Component
     ↓  (foundation created)

== JOB WORKFLOW BEGINS ==

Job Description → Job Role Card
             ↓
Company Info → Company Canvas
             ↓
Matching Component (User ↔ Job ↔ Company)
             ↓
Tailoring Engine
             ↓
CV Builder | Cover Letter | Speech Builder | KPI Generator
             ↓
Interview Question Generator
             ↓
Interview Simulator
```

---

# System-Wide Composables (Nuxt)

| Composable               | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| **useUserProfile()**     | Manage user identity data & backend sync           |
| **useExperienceStore()** | Store, add, edit experience blocks                 |
| **useStoryEngine()**     | Handle STAR stories & narrative building           |
| **useCanvasEngine()**    | Generate and update personal & company canvases    |
| **useJobAnalysis()**     | Transform JD into structured role data             |
| **useMatchingEngine()**  | Perform fit analysis & produce insight maps        |
| **useTailoringEngine()** | Assemble CV, letter, pitch, KPIs                   |
| **useInterviewEngine()** | Manage interview question generation & simulations |
