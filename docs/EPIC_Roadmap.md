# 🧭 EPIC ROADMAP — AI CAREER COACH EDITION

# 🚀 EPIC 1 — Clear Transformation & Outcome Framing

### **Problem**

Users go through many reflective steps but don’t clearly see the **before → after transformation**. It feels like filling in tools, not progressing toward interviews.

### **Goal**

Make the product visibly move users from:

> _“Unclear and generic” → “Positioned and interview-ready.”_

### **Key Features**

- New **“Career Readiness” header** on dashboard
- Readiness stages:
  - Profile Clarity
  - Positioning Strength
  - Job Alignment
  - Interview Readiness

- Short transformation summary:

  > “You now have a quantified, job-aligned profile ready for applications.”

### **Integration with Existing App**

Builds on your current milestone system (Grounded, Identity Defined, etc.) but reframes them as **progress toward employability**, not just completion.

### **Acceptance Criteria**

- Users can see a single “Career Readiness” status at all times
- Each existing milestone maps to a readiness dimension
- At least one screen summarizes “Here’s how far you’ve come”

---

# 🎯 EPIC 2 — Job Fit & Application Strength Analyzer

### **Problem**

Users generate CVs and letters but don’t know:

> “How strong is this application for THIS job?”

### **Goal**

Turn the system into a **strategic evaluator**, not just a generator.

### **Key Features**

- “Application Strength” score per job
- Breakdown:
  - Skill Match
  - Experience Relevance
  - Impact Evidence
  - Story Coverage

- “Top 3 improvements before applying”
- Highlight missing signals (e.g., leadership, ownership, metrics)

### **Integration with Existing App**

Extends your current job match scoring by connecting it directly to:

- CV content
- Story database
- Achievements

### **Acceptance Criteria**

- After CV generation, users see a job-specific strength score
- System suggests at least 2 concrete improvements
- Users can click suggestions and jump directly to edit relevant content

---

# 🧠 EPIC 3 — Interview Preparation Engine

### **Problem**

You stop at application. The user’s biggest anxiety is the **interview**.

### **Goal**

Make the platform useful _after_ they get invited.

### **Key Features**

- AI-generated likely interview questions based on:
  - Job description
  - Company canvas
  - User experience

- Suggested stories to answer each question
- “Coverage indicator”:

  > “You have strong examples for teamwork, weaker for conflict.”

- Interview story bank view

### **Integration with Existing App**

Directly uses:

- Story Builder outputs
- Experience Builder achievements
- Company & Job model

### **Acceptance Criteria**

- For any job, system generates at least 8 likely questions
- Each question links to at least one suggested user story (or flags a gap)
- Users can mark questions as “Prepared”

---

# 📈 EPIC 4 — Achievement & CV Strength Feedback

### **Problem**

Users often describe responsibilities, not impact.

### **Goal**

Continuously upgrade user content quality.

### **Key Features**

- Achievement strength indicator (Weak / Solid / Strong)
- Prompts:
  - “What changed because of your work?”
  - “Can you quantify this?”

- CV bullet quality feedback

### **Integration with Existing App**

Enhances:

- Experience Builder
- CV Builder

Uses existing structured achievement data.

### **Acceptance Criteria**

- Each achievement receives a quality rating
- Users get at least one improvement suggestion per weak item
- CV preview visually distinguishes strong vs weak bullets

---

# 🧩 EPIC 5 — Progress, Confidence & Readiness Signals

### **Problem**

Users don’t _feel_ progress, only activity.

### **Goal**

Turn effort into visible confidence.

### **Key Features**

- “You are ready for…” indicators:
  - “Ready to apply to Product roles”
  - “Interview-ready for leadership discussions”

- Profile strength stats:
  - # quantified achievements
  - # stories covering key competencies

- Growth notifications:

  > “Your leadership signal increased”

### **Integration with Existing App**

Pulls data from:

- Stories
- Achievements
- Job matches
- Milestones

Sits above current milestone system as a **confidence layer**.

### **Acceptance Criteria**

- Users see at least 3 dynamic readiness indicators
- Changes in profile data update indicators
- At least one “confidence message” appears after major actions

---

# ⏳ EPIC 6 — Urgency & Job Search Mode

### **Problem**

The product feels reflective, not time-sensitive.

### **Goal**

Make it feel like a **co-pilot during an active job search**.

### **Key Features**

- “Current Focus” selector:
  - Exploring
  - Applying
  - Interviewing soon

- Contextual priorities:
  - “You have an interview soon → prepare stories”

- Optional deadlines per job

### **Integration with Existing App**

Adds a behavioral layer that reorders existing tools:

- Interview prep surfaces earlier when relevant
- CV tuning prioritized when applying

### **Acceptance Criteria**

- Users can set a job search mode
- Dashboard adapts recommended next steps
- At least one feature changes behavior based on mode

---

# 🧭 EPIC 7 — Application Strategy Guidance

### **Problem**

Users don’t know which jobs are worth pursuing.

### **Goal**

Support **decision-making**, not just content creation.

### **Key Features**

- “Should I apply?” analysis
  - Fit vs stretch
  - Growth potential

- Job comparison view
- Flag over- or under-qualified roles

### **Integration with Existing App**

Builds on existing job fit scoring but reframes it as **strategy**, not just compatibility.

### **Acceptance Criteria**

- Users see a recommendation (Strong Fit / Stretch / Risky)
- Explanation provided in plain language
- Users can compare at least two jobs side-by-side

---

## 🤖 EPIC C0 — In-App AI Career Companion

**Problem**
Users struggle to know what to write, how to reflect, and how to use structured tools like strengths, stories, and the Personal Canvas.

**Goal**
Provide a **context-aware AI coach inside the product** that guides reflection and helps users complete each section with clarity.

**Key Features**

- Contextual guidance per screen (Profile, Strengths, Stories, Canvas, Jobs)
- Guided reflection questions
- Field-level assistance (strengths, achievements, value proposition, direction)
- Canvas translator (explains each block in practical career terms)
- Action mode: AI proposes structured updates → user confirms → data saved

**Success Criteria**

- Users engage with the companion in ≥40% of profile-building sessions
- Increase completion rate of Strengths, Stories, and Canvas sections
- Users report reduced confusion in usability feedback

---

## 🧠 EPIC C1 — Positioning & Career Target Coaching

**Goal:** Help users move from reflection to **clear professional direction**

### Includes

- Career Target Definition (1–3 roles, industries, company types)
- “Non-negotiables vs nice-to-have”
- Positioning Clarity Feedback
  → AI evaluates if user identity is clear and consistent

### Why V1

Uses existing Personal Canvas + Profile data
Adds a coaching layer, not heavy infra

---

## 🧩 EPIC C2 — Competency Evidence Map

**Goal:** Show users whether they have **enough proof** for key competencies

### Includes

- Map stories & achievements to competency categories (leadership, teamwork, problem solving…)
- Highlight weakly supported competencies
- Suggest which type of example to add

### Why V1

Reuses stories, KPIs, strengths — just adds analysis

---

## 📄 EPIC C3 — AI Feedback on Materials

**Goal:** Turn CV & letter generation into **interactive improvement**

### Includes

- AI Feedback Panel (“more formal”, “stronger impact”, etc.)
- CV / Cover Letter Strength Analyzer
  → Clarity, impact, alignment with role

### Why V1

No new data models required — just post-generation evaluation

---

## 🎯 EPIC C4 — Opportunity Strategy Coach

**Goal:** Help users decide **where to invest effort**

### Includes

- “Should I apply / network first / skip?”
- Fit vs growth opportunity explanation
- Skill gap summary per job

### Why V1

Builds on MatchingSummary already implemented

---

## ⚙️ EPIC C5 — Momentum & Activity Coaching

**Goal:** Keep users moving

### Includes

- Simple job search activity tracker (applications, networking, interviews)
- “Next best action” nudges
- Inactivity reminders

### Why V1

Simple CRUD + logic = high behavioral impact

---

# 🧠 V2 — Performance Coaching & Interview Readiness

Now we help users **perform**, not just prepare.

---

## 🎤 EPIC C6 — Interview Intelligence

**Goal:** Help users answer better, not just prepare questions

### Includes

- Story Recommender per job
- AI Answer Feedback Coach (user writes answer → AI evaluates structure, impact)
- Suggested improvement tips

---

## 🤝 EPIC C7 — Networking Preparation Assistant

**Goal:** Support strategic networking

### Includes

- Intro message generator
- Conversation starters based on target role/company
- Follow-up message suggestions

---

## 🌍 EPIC C8 — Skill Gap → Growth Guidance

**Goal:** Turn job gaps into development paths

### Includes

- Detect repeated skill gaps across jobs
- Suggest reframing existing experience
- Suggest learning or exposure paths

---

# 🧩 V3 — Deeper Personalization & Behavioral Coaching

---

## 🧠 EPIC C9 — Work Style & Behavioral Insights

Extension of profile psychology.

### Includes

- Communication style
- Work style preferences
- Strengths vs blind spots
- Integrated into materials & interview advice

---

## 📊 EPIC C10 — Progress Intelligence Dashboard

**Goal:** Visual coaching

### Includes

- Positioning strength score
- Competency coverage score
- Activity consistency score
- Application vs interview conversion view

---

# 🚀 V4 — Advanced Strategy & Ecosystem

---

## 🧑‍🏫 EPIC C11 — Coach / Mentor Mode

### Includes

- Shared profile access for coaches
- Feedback from human mentors
- Collaborative review on stories and materials

---

## 🤖 EPIC C13 — In-App AI Career Companion

**Goal:** Provide users with a **context-aware AI coach inside the product** that helps them think, reflect, and complete each step of their career positioning journey.

---

### Includes

#### 🧭 Contextual Guidance

- Companion is aware of the current section (Profile, Strengths, Stories, Personal Canvas, Job Analysis, etc.)
- Explains _what this section is for_ in plain language
- Provides examples when users feel stuck (“What counts as a strength?”, “What should go in this canvas box?”)

#### 🧠 Reflection & Clarity Coaching

- Helps users reflect through guided questions
  → “Tell me about a time you solved a difficult problem”
- Extracts potential strengths, achievements, and themes from user answers
- Suggests wording that fits structured fields

#### ✍️ Field-Level Assistance

- Users can ask for help filling specific parts:
  - Strengths
  - Achievements
  - Value proposition
  - Career direction

- Companion proposes structured drafts aligned with the system’s models
- User can accept, edit, or reject suggestions

#### 🧩 Canvas & Framework Translator

- Makes abstract tools (like the Personal Business Model Canvas) easier to understand
- Explains each block in practical career terms
- Suggests initial content based on existing profile and stories

#### 🔄 Action Mode (AI → Data Integration)

- Companion can propose direct updates to structured data
- With user confirmation, it can:
  - Add/edit strengths
  - Draft achievements
  - Update canvas sections
  - Refine positioning statements

---

### Why V1–V2 Priority

- Reduces cognitive load and blank-page anxiety
- Increases completion rates for reflective sections
- Makes advanced tools usable for non-expert users
- Multiplies the value of existing EPICs (C1–C6) without requiring major new data models

This turns the product from a **set of intelligent tools** into a **guided coaching experience**.

---

### How It Integrates With Existing EPICs

| EPIC                                        | Companion Contribution                                            |
| ------------------------------------------- | ----------------------------------------------------------------- |
| **C1 Positioning & Career Target Coaching** | Helps articulate goals and positioning statements                 |
| **C2 Competency Evidence Map**              | Suggests missing examples and prompts users for stronger evidence |
| **C3 AI Feedback on Materials**             | Explains feedback and helps rewrite weak parts                    |
| **C5 Momentum & Activity Coaching**         | Suggests next steps conversationally                              |
| **C6 Interview Intelligence**               | Enables conversational interview rehearsal                        |
| **Personal Canvas**                         | Translates abstract blocks into concrete career language          |

The companion acts as a **coaching interface layer** across the entire platform.

---

### Acceptance Criteria

- Companion is accessible from all major profile-building and job-preparation sections
- It adapts its guidance based on the current context (which screen + what data is missing or weak)
- It can suggest structured content, not just free-form text
- Users can insert suggestions directly into fields with one action
- It can guide users step-by-step through complex sections like the Personal Canvas

---

### Strategic Impact

Without this EPIC, the product is:
🛠 A powerful but demanding career toolkit

With this EPIC, the product becomes:
🧭 **An AI career coach that guides users through every step**

This significantly increases:

- User confidence
- Depth of reflection
- Feature adoption
- Perceived personal support
