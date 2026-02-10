# 🧭 EPIC ROADMAP — AI CAREER COACH EDITION

Perfect — beta feedback is gold for shaping the landing. I went through it and several comments directly justify a **strong pre-login explanation layer**. Here’s how it informs the landing EPIC.

---

## 🧱 Landing EPIC Scope

### 🔹 Hero Section

**Headline:**

> _Your AI Career Coach — from self-discovery to job offers._

**Subtext:**

> Stop guessing what employers want. Understand your value and present it with impact.

CTA:
**Start my career journey**

---

# 🌅 EPIC L1 — Public Landing & Pre-Auth Experience

**Goal:**
Give first-time visitors a clear, motivating understanding of the product _before_ asking them to sign in.

This EPIC transforms the app from a “tool behind a login” into a **coaching platform people feel invited into**.

---

## 🎯 User Problem

When redirected directly to login:

- ❓ “What is this app?”
- ❓ “Is this just another CV builder?”
- ❓ “Why should I trust it with my data?”
- ❓ “What will I gain if I create an account?”

We need to answer those in **30 seconds or less**.

---

## 🧱 Scope

### 1️⃣ Public Landing Page (`/` before login)

A clean, modern, **coach-oriented** landing page.

#### Hero Section

**Headline (example):**

> _Your AI Career Coach — from self-discovery to job offers._

**Subtext:**

> Understand your value. Position yourself strategically. Communicate with impact.

CTA:

- **Start my career journey**
- Secondary: “See how it works”

---

### 2️⃣ “How It Works” Section (3–5 steps)

Visual journey:

1. **Understand Yourself**
   Extract strengths, achievements, and career direction
2. **Understand Employers**
   Decode job offers and company needs
3. **Align & Position**
   See where you bring the most value
4. **Communicate Clearly**
   Build CVs, letters, and pitches with feedback
5. **Progress with Confidence**
   Track actions and improve over time

This reflects your core flow from the product description

---

### 3️⃣ “What Makes This Different”

Not a CV builder. A **Career Coach**.

| Others              | You                                 |
| ------------------- | ----------------------------------- |
| Help write CV       | Help understand your value          |
| One-shot generation | Continuous feedback & improvement   |
| Focus on documents  | Focus on positioning & strategy     |
| Generic templates   | Personalized stories & achievements |

---

### 4️⃣ Trust & Safety Section

Because this is career + personal data:

- Your data belongs to you
- Fully editable AI suggestions
- Nothing sent without your validation
- Secure authentication

This aligns with your Observability Philosophy

---

### 5️⃣ Soft Feature Preview (No Demo Account Yet)

Show **screenshots / mock blocks** of:

- Personal Canvas
- Story Builder
- Job Matching
- CV Builder

With captions like:

> “See how your experience connects to employer needs.”

---

### 6️⃣ CTA Section

Strong emotional call:

> _Stop guessing what employers want. Start understanding your value._

Buttons:

- **Create my account**
- Already have account → Sign in

---

## 🧩 Optional (If Time Allows in Same EPIC)

### 🔹 Welcome Screen After Signup (First Login)

Instead of dropping users into dashboard:

“Welcome to your Career Coach. Here’s what we’ll do together.”

With 3 steps:

- Upload your CV
- Build your stories
- Analyze a job you want

---

## 🛠 Technical Scope

- Public route not requiring auth
- Responsive layout
- Reuse design system (Nuxt UI)
- Lightweight images / illustrations
- SEO-friendly structure (later bonus)

---

## ✅ Success Criteria

- User can explain the product after 20 seconds
- Reduced bounce on login page
- Increased account creation rate
- New users reach onboarding with **clear expectations**

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

## 🔁 EPIC C12 — Career Evolution Tracking

### Includes

- Multi-version career positioning over time
- Track growth of strengths, competencies, and direction

---

# 🧭 PRIORITY LOGIC

| Version | Focus                                     | Why                                         |
| ------- | ----------------------------------------- | ------------------------------------------- |
| **V1**  | Positioning + feedback + decision support | Biggest coaching impact, low technical cost |
| **V2**  | Interview & networking performance        | Converts opportunities into success         |
| **V3**  | Personalization & progress analytics      | Deepens long-term engagement                |
| **V4**  | Ecosystem & long-term career tracking     | Strategic expansion                         |

---

# 🧠 BIG PICTURE SHIFT

**MVP = Output Generator**
**V1–V4 = Coaching Intelligence Layers**

You’re layering:

1. **Clarity coaching**
2. **Proof coaching**
3. **Decision coaching**
4. **Performance coaching**
5. **Behavior coaching**

This is how the product evolves from:

📄 “Write better CVs”
→ 🧠 “Become better at managing your career”
