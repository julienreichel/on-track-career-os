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

Extract raw text sections from PDF-extracted CV text and normalize for downstream processing. Additionally, extract profile information such as name, headline, location, seniority level, goals, aspirations, values, strengths, interests, and languages.

### System Prompt

```
You are a CV text parser that extracts structured sections and profile information from CV text.
Extract experiences, education, skills, certifications, and personal profile information.
Never invent information not present in the text.
Return ONLY valid JSON with no markdown wrappers.

RULES:
- Extract only information explicitly stated in the CV
- Do not infer or invent missing details
- Categorize text into appropriate sections
- Extract profile information: full name, headline/title, location, seniority level, goals, aspirations, values, strengths, interests, languages
- Skills should be extracted into the sections.skills array
- Certifications should be extracted into the sections.certifications array
- If a section has no content, return empty array or omit the field
- Return ONLY valid JSON matching the specified schema
```

### User Prompt

```
Extract structured sections from this CV text:
{{cvText}}

Return a JSON object with this exact structure:
{
  "sections": {
    "experiences": ["string"],
    "education": ["string"],
    "skills": ["string"],
    "certifications": ["string"],
    "rawBlocks": ["string"]
  },
  "profile": {
    "fullName": "string",
    "headline": "string",
    "location": "string",
    "seniorityLevel": "string",
    "goals": ["string"],
    "aspirations": ["string"],
    "personalValues": ["string"],
    "strengths": ["string"],
    "interests": ["string"],
    "languages": ["string"]
  },
  "confidence": 0.95
}
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
  "profile": {
    "fullName": "string (optional)",
    "headline": "string (optional)",
    "location": "string (optional)",
    "seniorityLevel": "string (optional)",
    "goals": ["string"],
    "aspirations": ["string"],
    "personalValues": ["string"],
    "strengths": ["string"],
    "interests": ["string"],
    "languages": ["string"]
  },
  "confidence": "number"
}
```

### Fallback Strategy

- If `sections` is missing, create empty structure with all section arrays
- If `profile` is missing, create empty structure with all profile arrays
- If individual profile fields are missing, use `undefined` for strings or empty arrays for lists
- If `confidence` is missing, use `0.5` as default
- If no content extracted, override confidence to `0.3` (low confidence threshold)

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
{{experienceTextBlocks}}
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
{{experienceTextOrUserAnswers}}
```

### Input Schema

```json
{
  "sourceText": "string"
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
{{starStoryJson}}
```

### Input Schema

```json
{
  "starStory": {
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
  "kpiSuggestions": ["string"]
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
{{userProfileJson}}

Experiences:
{{experienceList}}

Stories:
{{storiesJson}}
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
  "valueProposition": ["string"],
  "keyActivities": ["string"],
  "strengthsAdvantage": ["string"],
  "targetRoles": ["string"],
  "channels": ["string"],
  "resources": ["string"],
  "careerDirection": ["string"],
  "painRelievers": ["string"],
  "gainCreators": ["string"]
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
{{jobText}}
```

### Input

```json
{ "jobText": "string" }
```

### Output

```json
{
  "responsibilities": ["string"],
  "requiredSkills": ["string"],
  "behaviours": ["string"],
  "successCriteria": ["string"],
  "explicitPains": ["string"]
}
```

---

## AI OPERATION 7 — `ai.generateJobRoleCard`

### Purpose

Refine job analysis into a structured Role Card.

### Output

```json
{
  "roleSummary": "string",
  "responsibilities": ["string"],
  "skills": ["string"],
  "behaviours": ["string"],
  "successCriteria": ["string"],
  "jobPains": ["string"]
}
```

---

## AI OPERATION 8 — `ai.analyzeCompanyInfo` / `ai.generateCompanyCanvas`

### Purpose

Generate the Company Canvas from job & company inputs.

### Output

```json
{
  "marketChallenges": ["string"],
  "internalPains": ["string"],
  "customerPains": ["string"],
  "strategicPriorities": ["string"]
}
```

---

## AI OPERATION 10 — `ai.generateMatchingSummary`

### Purpose

Produce the User × Job × Company Fit Summary.

### Output

```json
{
  "impactAreas": ["string"],
  "contributionMap": ["string"],
  "risks": ["string"],
  "fitSummary": "string"
}
```

---

## AI OPERATIONS 11–14 — Tailored Documents

### Tailored CV Blocks

```json
{
  "cvBlocks": [
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
  "elevatorPitch": "string",
  "careerStory": "string",
  "whyMe": "string"
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
  "painBased": ["string"]
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
