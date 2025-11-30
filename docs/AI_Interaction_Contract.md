# AI Interaction Contract (AIC) — MVP Version

## 1. Overview

The product relies on a **deterministic set of AI capabilities**, each encapsulated in an **AI Operation**.

Each operation must conform to:

- **System prompt** (constant)
- **User prompt** (variable, data-injection)
- **Input schema** (validated before calling the AI)
- **Output schema** (validated after AI returns)
- **Fallback strategy** for malformed output

**No operation may return free-form text. All outputs _must_ be structured JSON.**

---

## 2. Naming Conventions

- Operations: `ai.operationName` (camelCase)
- JSON output: `camelCase` (JavaScript/TypeScript standard)
- Content blocks: arrays only (no raw paragraphs)

**Note**: Lambda validation functions support both `snake_case` (from AI responses) and `camelCase` as input, but always normalize output to `camelCase` for consistency.

**Examples:**

- `ai.parseJobDescription`
- `ai.generatePersonalCanvas`
- `ai.generateAchievements`

---

# 3. AI OPERATIONS (Top-Level List)

### Identity & Experience (EPIC 1A, 2)

1. `ai.parseCvText`
2. `ai.extractExperienceBlocks`
3. `ai.generateStarStory`
4. `ai.generateAchievementsAndKpis`

### User Model / Canvas (EPIC 1B)

5. `ai.generatePersonalCanvas`

### Job & Company (EPIC 5A / 5B)

6. `ai.parseJobDescription`
7. `ai.generateJobRoleCard`
8. `ai.analyzeCompanyInfo`
9. `ai.generateCompanyCanvas`

### Matching Engine (EPIC 5C)

10. `ai.generateMatchingSummary`

### Application Materials (EPIC 6)

11. `ai.generateTailoredCvBlocks`
12. `ai.generateCoverLetter`
13. `ai.generateTailoredSpeech`
14. `ai.generateTailoredKpis`

### Interview Prep (EPIC 7 / 9)

15. `ai.generateInterviewQuestions`
16. `ai.simulateInterviewTurn`
17. `ai.evaluateInterviewAnswer`

---

# 4. PROMPT TEMPLATES (System + User)

Below is the **minimum viable version** of each operation, including purpose, prompts, and schemas.

---

## AI OPERATION 1 — `ai.parseCvText`

### Purpose

Extract raw text sections from PDF-extracted CV text and normalize for downstream processing.

### System Prompt

```
You are a CV text parser.
You MUST return structured JSON only.
Extract distinct sections and normalize them.
Never invent information.
```

### User Prompt

```
Extract structured sections from this CV text:
{{cv_text}}
```

### Input Schema

```json
{
  "cvText": "string"
}
```

### Output Schema

```json
{
  "sections": {
    "experiences": ["string"],
    "education": ["string"],
    "skills": ["string"],
    "certifications": ["string"],
    "rawBlocks": ["string"]
  },
  "confidence": "number"
}
```

---

## AI OPERATION 2 — `ai.extractExperienceBlocks`

### Purpose

Transform raw CV experience text into structured Experience entities.

### System Prompt

```
You transform experience text into structured experience blocks.
Extract: title, company, dates, responsibilities, tasks.
Never infer seniority or technologies not present.
Return JSON only.
```

### User Prompt

```
Convert the following CV experience sections into experience blocks:
{{raw_experience_sections}}
```

### Input Schema

```json
{
  "experienceTextBlocks": ["string"]
}
```

### Output Schema

```json
{
  "experiences": [
    {
      "title": "string",
      "company": "string",
      "startDate": "string",
      "endDate": "string",
      "responsibilities": ["string"],
      "tasks": ["string"]
    }
  ]
}
```

---

## AI OPERATION 3 — `ai.generateStarStory`

### Purpose

Convert user content into a structured STAR story.

### System Prompt

```
You create STAR stories (Situation, Task, Action, Result).
Follow the user's words closely. Do not invent missing details.
Return JSON only.
```

### User Prompt

```
Generate a STAR story based on this input:
{{experience_text_or_user_answers}}
```

### Input Schema

```json
{
  "source_text": "string"
}
```

### Output Schema

```json
{
  "situation": "string",
  "task": "string",
  "action": "string",
  "result": "string"
}
```

---

## AI OPERATION 4 — `ai.generateAchievementsAndKpis`

### Purpose

Generate achievements + KPI suggestions grounded in user stories.

### System Prompt

```
You generate achievements and KPIs strictly from the user's story.
Do not invent numbers. Use qualitative KPIs if necessary.
Return JSON only.
```

### User Prompt

```
Generate achievements and KPIs based on this STAR story:
{{star_story_json}}
```

### Input Schema

```json
{
  "star_story": {
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string"
  }
}
```

### Output Schema

```json
{
  "achievements": ["string"],
  "kpi_suggestions": ["string"]
}
```

---

## AI OPERATION 5 — `ai.generatePersonalCanvas`

### Purpose

Generate all sections of the Personal Business Model Canvas.

### System Prompt

```
Produce the personal business model canvas strictly from user data.
No invented skills. No fictional strengths.
Return JSON only.
```

### User Prompt

```
Generate the Personal Business Model Canvas from:
Profile:
{{user_profile_json}}

Experiences:
{{experience_list}}

Stories:
{{stories_json}}
```

### Input Schema

```json
{
  "profile": { ... },
  "experiences": [ ... ],
  "stories": [ ... ]
}
```

### Output Schema

```json
{
  "value_proposition": ["string"],
  "key_activities": ["string"],
  "strengths_advantage": ["string"],
  "target_roles": ["string"],
  "channels": ["string"],
  "resources": ["string"],
  "career_direction": ["string"],
  "pain_relievers": ["string"],
  "gain_creators": ["string"]
}
```

---

## AI OPERATION 6 — `ai.parseJobDescription`

### Purpose

Extract structured fields from a job description.

### System Prompt

```
Analyze the job description and extract responsibilities, skills,
behaviours, success criteria, and explicit pains.
No hallucinations. Return JSON only.
```

### User Prompt

```
Parse this job description:
{{job_text}}
```

### Input

```json
{ "job_text": "string" }
```

### Output

```json
{
  "responsibilities": ["string"],
  "required_skills": ["string"],
  "behaviours": ["string"],
  "success_criteria": ["string"],
  "explicit_pains": ["string"]
}
```

---

## AI OPERATION 7 — `ai.generateJobRoleCard`

### Purpose

Refine job analysis into a structured Role Card.

### Output

```json
{
  "role_summary": "string",
  "responsibilities": ["string"],
  "skills": ["string"],
  "behaviours": ["string"],
  "success_criteria": ["string"],
  "job_pains": ["string"]
}
```

---

## AI OPERATION 8 — `ai.analyzeCompanyInfo` / `ai.generateCompanyCanvas`

### Purpose

Generate the Company Canvas from job & company inputs.

### Output

```json
{
  "market_challenges": ["string"],
  "internal_pains": ["string"],
  "customer_pains": ["string"],
  "strategic_priorities": ["string"]
}
```

---

## AI OPERATION 10 — `ai.generateMatchingSummary`

### Purpose

Produce the User × Job × Company Fit Summary.

### Output

```json
{
  "impact_areas": ["string"],
  "contribution_map": ["string"],
  "risks": ["string"],
  "fit_summary": "string"
}
```

---

## AI OPERATIONS 11–14 — Tailored Documents

### Tailored CV Blocks

```json
{
  "cv_blocks": [
    { "type": "experience", "content": "string" },
    { "type": "skills", "content": ["string"] },
    { "type": "achievements", "content": ["string"] }
  ]
}
```

### Cover Letter

```json
{
  "paragraphs": ["string"],
  "closing": "string"
}
```

### Speech

```json
{
  "elevator_pitch": "string",
  "career_story": "string",
  "why_me": "string"
}
```

### Tailored KPIs

```json
{
  "kpis": ["string"],
  "justifications": ["string"]
}
```

---

## AI OPERATION 15 — `ai.generateInterviewQuestions`

### Output

```json
{
  "behavioral": ["string"],
  "technical": ["string"],
  "cultural": ["string"],
  "pain_based": ["string"]
}
```

---

## AI OPERATIONS 16–17 — Interview Simulation

### `ai.simulateInterviewTurn`

```json
{
  "question": "string"
}
```

### `ai.evaluateInterviewAnswer`

```json
{
  "score": {
    "clarity": "number",
    "structure": "number",
    "relevance": "number"
  },
  "feedback": ["string"]
}
```

---

# 6. ERROR FALLBACK RULES

If AI output is **not valid JSON**:

- Attempt to parse a JSON substring
- If still invalid → retry with:

```
Return ONLY VALID JSON matching the schema:
{{schema}}
```

If fields are **missing**:

- Missing strings → empty string
- Missing arrays → empty array
- Missing objects → empty object

If **hallucinated** content:

- Remove hallucinations
- Keep only input-supported elements
- If >80% invalid → ask user for clarification

If repeated failure:

- Show UI error:
  **“AI cannot produce a stable answer. Please refine your input.”**

---

# 7. LOGGING & EXPLAINABILITY

Each AI operation must store:

- timestamp
- input JSON
- output JSON
- fallback steps used
- confidence (if provided)

This enables **debuggability, traceability, reproducibility**.
