# EPIC ROADMAP (MVP → V1 → V2 → V3)

_Non-technical — Strategic — Complete_
_Source: EPIC Roadmap document_

---

## 🎯 MVP — Build the Core Job Search Engine

**Goal:** Deliver the minimum complete workflow:
**→ understand the user → understand the job → generate coherent materials**

---

## EPIC 1A — User Data Intake & Identity Collection

**Goal:** Capture the user’s professional identity through guided data input.

### Description

Collect all raw information about the user without interpreting it yet. All future features depend on this structured foundation.

### Includes

- Upload CV → extract text → segment experiences
- Manual editing of extracted experiences
- Create new experience blocks
- Capture aspirations (future direction)
- Capture professional goals
- Capture personal values
- Capture key strengths

### User Value

- Gives users a simple, structured way to express who they are
- Helps users feel “seen” and guided
- Builds the foundational dataset for CVs, letters, tailoring, analysis

### Reason in MVP

It is impossible to generate insights or documents without structured, accurate user data.

---

## EPIC 1B — Generate the Personal Business Model Canvas

**Goal:** Transform user data into a structured personal career model.

### Description

Convert user experiences, aspirations, values, and strengths into a structured, visual canvas. Editable and AI-assisted.

### Includes

- Auto-generate all Canvas sections from user data:
  - Value Proposition
  - Key Activities
  - Strengths & Competitive Advantages
  - Target Roles / Customers
  - Channels
  - Personal Resources (skills, assets)
  - Career Direction
  - Pain Relievers & Gain Creators

- User editing & drag-and-drop
- AI suggestions for weak sections
- Save to backend
- Regenerate anytime

### User Value

- Clear professional identity overview
- Reveals insights users often miss
- Central hub for consistency across CVs, letters, and stories

### Reason in MVP

It is the conceptual backbone of the entire system.

---

## EPIC 2 — Experience Builder (STAR Model Guided Stories)

**Goal:** Help users create clear, compelling situation-based examples.

### Includes

- Guided STAR interviews
- AI-generated achievements
- AI-generated KPI suggestions
- Editable story library

### User Value

- Provides strong material for CVs, letters, and interviews
- Helps users communicate achievements with clarity

### Reason in MVP

Generation features are useless without strong content.

---

## EPIC 3 — Generic CV Generator

**Goal:** Provide users with a clean, coherent, ready-to-export CV.

### Includes

- Basic 2-page layout
- Markdown editing of CV
- Print export

### User Value

Users instantly obtain a professional CV.

### Reason in MVP

A CV is an essential deliverable in any job search.

---

## **EPIC 3B — CV Header & Contact Information**

**Goal:**
Enhance the UserProfile and generic CV system with photo, socials, contact and work-permit data, enabling cleaner and more professional CV headers.

**Why:**
The CV currently lacks essential header information required for employability (photo, email, social links, phone, work permit). Today, these must be manually added into text blocks, which is inefficient and inconsistent.

**Scope:**
Extend the UserProfile model to store:

- Profile photo (stored in S3)
- Social links list
- Contact information (email/phone)
- Work eligibility info

Add visibility toggles so users control what appears on their CV.
Update CV generation, preview and print pages to render the new header elements.

**Success Criteria:**
User can upload a photo through their profile, add socials and contact fields, and decide if they show on CVs. CV preview/print layout displays the information top-right of the header.

**Risks / Constraints:**
Cross-template formatting, user-controlled toggles, and print layout visual design alignment.

---

## EPIC 4 — User Speech Builder (Elevator Pitch & Career Story)

**Goal:** Help users articulate their narrative verbally and in writing.

### Includes

- Generate personal pitch
- Generate career story
- Generate “Why me?” statements
- Editable speech blocks

### User Value

Users feel more confident when explaining their professional story.

### Reason in MVP

Used for cover letters, interviews, and self-positioning.

---

## EPIC 5A — Job Description Intake & Role Analysis

**Goal:** Understand the job clearly and extract what success looks like.

### Description

Focuses exclusively on the job itself: its role, expectations, and pains.

### Includes

- Paste JD text
- AI extracts:
  - Responsibilities
  - Required skills
  - Required behaviours
  - Seniority level
  - Success criteria
  - Explicit pains

- Create a Job Role Card
- Editing extracted fields

### User Value

- Clear understanding of what matters for each role
- Reduces misinterpretation
- Foundation for tailoring

### Reason in MVP

Cannot tailor without understanding the role.

---

## EPIC 5B — Company Analysis & Company Business Model Canvas

**Goal:** Understand the company’s context, strategy, challenges.

### Description

Focuses on modeling the business context behind each job.

### Includes

- Input company information:
  - industry
  - size
  - products/services
  - market position

- Optional company description paste
- AI generates:
  - Company BMC
  - Market challenges
  - Internal pains
  - Customer pains
  - Strategic priorities

- Editable canvas

### User Value

- Understands the environment and strategic challenges
- Helps user speak with confidence during interviews

### Reason in MVP

Critical for strategic tailoring.

---

## EPIC 5C — User ↔ Job ↔ Company Matching

**Goal:** Connect the three sources of truth into a coherent fit model.

### Description

Synthesis step to reveal where the user creates impact.

### Includes

- Analyze overlaps between:
  - User strengths
  - Achievements
  - KPIs
  - Job pains
  - Company pains

- Identify:
  - Competitive advantages
  - Contributions
  - Risks & mitigation

- Produce Fit Summary (impact & narrative)
- Editable

### User Value

- Clarity and confidence: “Now I understand how I fit.”
- Drives tailored CV, letter, pitch, KPIs, and interview prep

### Reason in MVP

Tailoring requires this synthesis.

---

## EPIC 6 — Tailored Application Materials

**Goal:** Create job-specific CVs, letters, KPIs, and speech.

### Includes

- Tailored CV
- Tailored cover letter
- Tailored elevator pitch
- Tailored KPI proposition

### User Value

Strategic materials aligned with real company pains.

### Reason in MVP

Completes the full application workflow.

---

# ✔ MVP Completion

At this point the user can:
**→ understand themselves → analyze a job → generate application materials**

---

# V1 — Enhance Quality & Personalization

## EPIC 7 — Generic Interview Question Generator

**Goal:** Prepare users for interviews immediately.

### Includes

- Behavioral questions
- Technical questions
- Cultural questions
- Pain-based questions
- Suggested answers from user stories

### User Value

Plug-and-play interview preparation.

### Reason in V1

Completes the “prepare → apply → interview” cycle.

---

## EPIC 8 — Expanded Personal Profile (Communication & Psychological)

**Goal:** Add deeper behavioral insights.

### Includes

- Communication style
- Work style
- Strengths & blind spots
- Integration into tailoring

### User Value

More authentic and personalized applications.

---

## EPIC 9 — Virtual Interview Simulator (Text)

**Goal:** Provide interactive interview practice with feedback.

### Includes

- Simulated recruiter
- Answer scoring
- Coaching feedback
- Summary report

### User Value

Improves confidence and interview mastery.

---

## EPIC 10 — Job Fit Score & Recommendation Engine

**Goal:** Recommend roles based on user profile.

### Includes

- Compare user canvas with JD
- Score match
- Suggest roles or industries

### User Value

Career orientation, not only job application help.

---

## EPIC 11 — Advanced Pain Mapping Engine

**Goal:** Understand deeper contextual job pains.

### Includes

- Industry patterns
- Market maturity inference
- Unstated needs
- Stronger match scoring

### User Value

More accurate and unique insights.

---

## EPIC 12 — Advanced CV & Portfolio Builder

**Goal:** Improve formatting and visual quality.

### Includes

- More templates
- Drag & drop layout
- Design presets
- ATS-friendly export

### User Value

Professional-grade materials.

---

# V2 — Intelligence, Automation & Growth

## EPIC 13 — Multi-Version Tracking & Revision History

**Goal:** Support professional iterative workflows.

### Includes

- Version snapshots
- Compare versions
- Restore versions

### User Value

Power-user functionality for serious job hunters.

---

## EPIC 14 — Voice-based Interview Simulator

**Goal:** Simulate real interviews with voice.

### Includes

- Voice recognition
- Pacing feedback
- Filler-word detection

### User Value

Adds realism and real-world practice.
