## 1. Canonical User Progression Model (with hard gates)

The product now has **clear phase transitions**, with **Phase 1 as a hard prerequisite**.

---

## 🟢 Phase 1 — _Ground me_ (FOUNDATION / HARD GATE)

> **Objective:** Make the user operational as fast as possible
> **Mindset:** “Get me into the system, ready to work”

### Required actions (must all be true)

- ✅ Upload a CV
- ✅ At least **3 experiences** exist
- ✅ CV basics are filled:
  - Full name
  - Contact information
  - Work authorization
  - Social links
  - Professional attributes (skills, languages, etc.)

### Resulting state

➡️ **User is now “Activated”**
➡️ **All other features become accessible**

> This is a very strong and good design choice:
> _no partial, confusing access — once Phase 1 is done, the system fully opens._

---

## 2. Phase 2 — _Growing up_ (PARALLEL PATHS)

After Phase 1, the user enters **Phase 2**, which is **non-linear** and **choice-driven**.

This is important psychologically:

> _“I can work on myself OR on the job, depending on my urgency.”_

---

## 🔍 Phase 2A — _Understand the job_ (Context Path)

> **Objective:** Decode what the job _really_ expects

### Actions

- Upload a job description
- Generate & review **matching summary** for that job

### What this path produces

- Clear expectations
- ATS-aware keywords
- Explicit fit / gap understanding

---

## 🧭 Phase 2B — _Make sense of myself_ (Identity Path)

> **Objective:** Turn raw data into a coherent professional identity

### Actions

- Add profile depth:
  - Career direction
  - Identity & values

- Add or refine experiences
- Create STAR stories
- Create personal canvas

### What this path produces

- Strong **personal narrative**
- Reusable building blocks
- Higher-quality AI outputs later

---

### 🔑 Key design insight (important for EPIC F2)

Phase 2 has **two independent completion flags**:

- ✔️ Identity Path completed
- ✔️ Job Path completed

The system should **track them separately**.

---

## 🔵 Phase 3 — _Position myself_ (CONVERGENCE / SOFT GATE)

> **Objective:** Convert insight into application-ready assets
> **Gate:** Requires **both Phase 2 paths** to be completed

### Required state

- Phase 2A ✔️ _and_ Phase 2B ✔️

### Actions

- Create **job-specific CV**
- Create **job-specific cover letter**
- Create **speech** (pitch, career story, why me)

### Result

➡️ User is **application-ready**
➡️ Materials are coherent, aligned, and contextual

---

## ⭐ Bonus Layer — _Advanced & Optional_

These are **not blocking**, but signal maturity and power usage.

### Bonus actions

- Create additional STAR Stories from free text
- Update personal canevas
- Create a company manually
- Create company canvas
- Create **custom** CV / cover letter / speech
- Configure profile (future dev)

### Design intent

These should:

- Never block core flow
- Appear as _“advanced options”_
- Be framed as **power-user moves**

---

## 2. Feature Availability Matrix (important for guidance logic)

| Phase    | Feature Availability                         |
| -------- | -------------------------------------------- |
| Phase 1  | CV upload, profile basics, experience import |
| Phase 2A | Profile enrichment, stories, personal canvas |
| Phase 2B | Job upload, matching summary                 |
| Phase 3  | Job-tailored CV, cover letter, speech        |
| Bonus    | Company canvas, custom templates, settings   |

This gives you a **very clean progressive disclosure rule** for EPIC F2.

---

## 3. Recommended “What should I do next?” logic

This is almost ready to be implemented as a simple rules engine:

### Priority order

1. **If Phase 1 not complete**
   → “Upload your CV to get started”

2. **Else if Phase 2A not complete**
   → “Analyze your target job”

3. **Else if Phase 2B not complete**
   → “Clarify your professional story”

4. **Else if Phase 3 not started**
   → “Create your tailored application”

5. **Else**
   → “Improve, customize, or prepare interviews”

This gives:

- Zero ambiguity
- Zero dead ends
- Always one dominant CTA

---

## 4. Badge System (aligned with your phases)

Badges should **mark transitions**, not micro-actions.

---

### 🟢 Phase 1 — Activation Badges

- **Grounded**
  → CV uploaded + basics filled
  → 3+ experiences structured

---

### 🔍 Phase 2A — Job Badges

- **Reality Check**
  → First job uploaded
  → Matching summary viewed

---

### 🧭 Phase 2B — Identity Badges

- **Self-Aware**
  → Career direction + values filled
  → First STAR story created
  → Personal canvas created

---

### 🎯 Phase 3 — Positioning Badges

- **Application Complete**
  → CV + cover letter + speech exist for same job
  → _What this means_: "You have everything needed to apply with confidence"
  → _Replaces_: CV Tailored, Letter Crafted, Pitch Ready, Application Ready

---

### ⭐ Bonus / Power Badges

- **Beyond the CV**
  → First STAR story manually created (not from CV import)
  → _What this means_: "You've expanded your narrative beyond your CV"
  → _Growth signal_: Moving from reactive (CV-based) to proactive storytelling

- **Company Strategist**
  → Company canvas created
  → _What this means_: "You understand company context strategically"

- **Custom Approach**
  → Custom template used (not auto-generated)
  → _What this means_: "You've moved beyond templates to personalized materials"

---

## Key takeaway for EPIC F2

You now have:

- ✅ Clear **phase gates**
- ✅ Explicit **parallel paths**
- ✅ A natural **convergence point**
- ✅ A badge system that reflects **user growth**, not clicks

This is an **excellent foundation** for:

- Onboarding wizard
- Contextual empty states
- “Next step” banners
- Progressive feature unlocking
- Clean analytics & observability (EPIC F1)
