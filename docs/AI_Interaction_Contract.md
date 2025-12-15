# AI Interaction Contract (AIC) — MVP Version

## 1. Overview

The product relies on a **deterministic set of AI capabilities**, each encapsulated in an **AI Operation**.

Each operation must conform to:

- **System prompt** (constant)
- **User prompt** (variable, data-injection)
- **Input schema** (validated before calling the AI)
- **Output schema** (validated after AI returns)
- **Fallback strategy** for malformed output

**All operations must return structured, validated data to the application.** Most operations use JSON directly, but some use text formats that are parsed into JSON by the Lambda function for greater AI flexibility.

**No operation may return free-form text to the application. All outputs to the app _must_ be structured JSON.**

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

Extract one or more STAR stories from user experience content. The AI can complete missing information if needed to create coherent stories.

### System Prompt

```
You are a STAR story extraction assistant. Your role is to identify distinct achievements within user experiences and structure them using the STAR framework (Situation, Task, Action, Result).

GUIDELINES:
- Extract ONE or MORE distinct STAR stories from the input text
- Each story should represent a clear, standalone achievement
- If information is missing, you MAY complete it based on context, but stay grounded in the user's actual experience
- Be concise but specific. Use the user's words when available

Format your response as plain text using this structure for EACH story:

## situation:
[Description of the context or challenge]

## task:
[What needed to be done]

## action:
[Steps taken or approach used]

## result:
[Outcome or impact achieved]

If you identify multiple achievements, create separate story blocks with the same format.
```

### User Prompt

```
Extract STAR stories from this experience:

{{sourceText}}

Remember to use the format with ## headers for each section, and create separate stories if there are multiple distinct achievements.
```

### Input Schema

```json
{
  "sourceText": "string"
}
```

### Output Schema

**Note**: The Lambda parses the text-based AI response and returns JSON.

```json
[
  {
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string"
  }
]
```

**Implementation Details**:

- AI returns **text** with markdown-style headers (`## situation:`, `## task:`, etc.)
- Lambda function parses the text and extracts structured JSON
- Returns an **array** of STAR stories (one or more)
- Parser handles missing sections with fallback values
- Allows AI flexibility while maintaining structured output

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

### AI OPERATION 11 — `ai.generateCvBlocks`

#### Purpose

Generate a **job-tailored CV** as a sequence of structured blocks (“sections”), using:

- User profile
- Selected experiences (with stories / achievements / KPIs already available in the data layer)
- Skills, languages, certifications, interests
- An optional job description
- A soft constraint that the CV should be **around 2 pages**

This operation outputs **Notion-style sections** that the CV editor can render, reorder, or partially edit, without any free-form AI text.

---

#### System Prompt

```text
You are an assistant that generates a tailored CV as a sequence of structured sections.

GOAL:
- Produce a coherent CV that fits in approximately 2 pages.
- Use ONLY the information provided in the input profile, experiences, stories, and job description.
- DO NOT invent new experiences, employers, or responsibilities.
- You MAY slightly infer impact phrasing (achievements, outcomes) as long as it clearly follows from the input.

CONTENT & STRUCTURE RULES:
- The CV is made of ordered sections ("blocks").
- Each section has:
  - type
  - optional title
  - content (plain text, no markdown)
  - optional experienceId for experience-related blocks
- Use only these section types:
  - "summary"
  - "experience"
  - "education"
  - "skills"
  - "languages"
  - "certifications"
  - "interests"

- For "summary":
  - 3–5 concise sentences describing the user, aligned with the job if a job description is provided.
- For "experience"/"education":
  - One block per selected experience.
  - Each block should be concise and focused on impact, using achievements/KPIs if available.
- For "skills", "languages", "certifications", "interests":
  - Summarize and group items logically into a short paragraph or bullet-like sentence list inside `content`.

LENGTH HEURISTIC:
- Aim for ~2 pages of CV content in total.
- If there are MANY experiences (for example 7 or more), shorten each experience description.
- If there are FEW experiences (for example 1–3), use richer narrative per experience.
- Prefer clarity and focus over verbosity.

TAILORING:
- If a job description is provided:
  - Emphasize experiences, skills, and achievements that best match the role.
  - Reorder experience blocks to put the most relevant first.
- If no job description is provided:
  - Produce a generic but coherent CV that reflects the user's overall profile.

OUTPUT RULES:
- Return ONLY valid JSON, no markdown or extra text.
- Respect the exact JSON schema provided in the user prompt.
```

---

#### User Prompt

```text
Generate a tailored CV as ordered sections based on the following data.

User profile:
{{userProfileJson}}

Selected experiences:
{{selectedExperiencesJson}}

Stories, achievements, and KPIs (optional, may be empty):
{{storiesAndKpisJson}}

Skills:
{{skillsListJson}}

Languages:
{{languagesListJson}}

Certifications:
{{certificationsListJson}}

Interests:
{{interestsListJson}}

Job description (optional, may be empty):
{{jobDescriptionText}}

Sections to generate (ordered list of section types):
{{sectionsToGenerateJson}}

Remember:
- Use ONLY the information provided above.
- Respect the requested section order.
- Keep the overall length around 2 pages.
- Use shorter descriptions when many experiences are selected; use richer descriptions when there are only a few.

Return ONLY a JSON object with this exact structure:

{
  "sections": [
    {
      "type": "summary" | "experience" | "skills" | "languages" | "certifications" | "interests" | "custom",
      "title": "string (optional, can be empty for sections like 'summary' or when no title is needed)",
      "content": "string (plain text, basic markdown: bullets, bold, emphasis)",
      "experienceId": "string (optional, only for experience-related blocks)"
    }
  ]
}
```

---

#### Input Schema

```json
{
  "userProfile": {
    "id": "string",
    "fullName": "string",
    "headline": "string",
    "location": "string",
    "seniorityLevel": "string",
    "goals": ["string"],
    "aspirations": ["string"],
    "personalValues": ["string"],
    "strengths": ["string"]
  },
  "selectedExperiences": [
    {
      "id": "string",
      "title": "string",
      "company": "string",
      "startDate": "string",
      "endDate": "string",
      "location": "string",
      "responsibilities": ["string"],
      "tasks": ["string"]
    }
  ],
  "stories": [
    {
      "experienceId": "string",
      "situation": "string",
      "task": "string",
      "action": "string",
      "result": "string",
      "achievements": ["string"],
      "kpiSuggestions": ["string"]
    }
  ],
  "skills": ["string"],
  "languages": ["string"],
  "certifications": ["string"],
  "interests": ["string"],
  "sectionsToGenerate": [
    "summary",
    "experience",
    "skills",
    "languages",
    "certifications",
    "interests",
    "custom"
  ],
  "jobDescription": "string | null"
}
```

_(You can relax individual fields to `optional` in your TS/Zod validator if needed for MVP.)_

---

#### Output Schema

```json
{
  "sections": [
    {
      "type": "summary | experience | skills | languages | certifications | interests | custom",
      "title": "string | null",
      "content": "string",
      "experienceId": "string | null"
    }
  ]
}
```

- `type` is required and must be one of the fixed literals.
- `title`:
  - Optional / nullable.
  - May be empty for sections where a title is not needed.

- `content`:
  - Required plain text (no markdown, no HTML).

- `experienceId`:
  - Optional; used only for `"experience"` (or any block directly derived from a specific experience).

---

#### Fallback Strategy

- If the model returns non-JSON text:
  - Try to extract the first JSON object substring.
  - If parsing fails, **reissue** the prompt once with an extra instruction:

    > "Your previous answer was invalid. Return ONLY VALID JSON matching the schema below, with no explanation or extra text."

- If `sections` is missing or not an array:
  - Replace with an empty array `[]`.

- If a section is missing required fields:
  - Drop that section OR
  - Fill missing `title` with `null`, missing `experienceId` with `null`.

- If `type` is invalid:
  - Try to map to the closest valid type based on context (e.g. "profile" → "summary").
  - If no safe mapping: drop the section.

- If the result is clearly too verbose (e.g. a single section containing thousands of characters):
  - Truncate to a reasonable length in the Lambda, and set an internal `lengthWarning` flag (for logging; UI can ignore for MVP).

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
