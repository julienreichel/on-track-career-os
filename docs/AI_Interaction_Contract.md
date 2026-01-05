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
7. `ai.analyzeCompanyInfo`
8. `ai.generateCompanyCanvas`

### Matching Engine (EPIC 5C)

10. `ai.generateMatchingSummary`

### Application Materials (EPIC 6)

12. `ai.generateCoverLetter`

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

### Output JSON

```json
{
  "title": "string",
  "seniorityLevel": "string",
  "roleSummary": "string",
  "responsibilities": ["string"],
  "requiredSkills": ["string"],
  "behaviours": ["string"],
  "successCriteria": ["string"],
  "explicitPains": ["string"]
}
```

### Additional rules

```
- Title = exact role mentioned in the job.
- Seniority must use explicit wording (entry / mid / senior / lead / director / VP).
- roleSummary = short synthesized description of the role scope using only explicit info.
- Each collection must only include items explicitly present.
- Missing information must result in "" or [] (never hallucinated content).
```

---

## AI OPERATION 7 — `ai.analyzeCompanyInfo`

### Purpose

Normalize raw company notes (press releases, job briefs, investor decks) into a structured profile that seeds the `Company` entity and downstream canvases.

### System Prompt

```
You are a market intelligence analyst.
Extract only explicitly stated facts about the company and return JSON.
Capture:
- Company identity (name, industry, size range, website)
- Products/services and target markets
- Explicit customer segments

Rules:
- Never invent data. Leave fields empty or [] when missing.
- Bullet points must be < 20 words and fact-based.
- Do not duplicate sentences across arrays.
- Output valid JSON only.
```

### User Prompt

```
Analyze the following company information and optional job context.

Company Name: {{companyName}}
Industry: {{industry}}
Size: {{size}}
Job Context (optional): {{jobContext}}

Source Text:
"""
{{rawText}}
"""

Return JSON with companyProfile per the schema.
```

### Input Schema

```json
{
  "companyName": "string",
  "industry": "string",
  "size": "string",
  "rawText": "string",
  "jobContext": {
    "title": "string",
    "summary": "string"
  }
}
```

### Output Schema

```json
{
  "companyProfile": {
    "companyName": "string",
    "industry": "string",
    "sizeRange": "string",
    "website": "string",
    "productsServices": ["string"],
    "targetMarkets": ["string"],
    "customerSegments": ["string"],
    "description": "string"
  }
}
```

### Fallback Strategy

- Strings default to `""`, arrays default to `[]`.
- If `confidence` missing, set to `0.55`.
- Truncate bullet entries to < 160 characters.

---

## AI OPERATION 8 — `ai.generateCompanyCanvas`

### Purpose

Produce the 9 canonical Business Model Canvas blocks for a company using structured inputs from `ai.analyzeCompanyInfo` plus curator notes. Feeds the `CompanyCanvas` entity for EPIC 5B.

### System Prompt

```
You are a strategy consultant building a Business Model Canvas.
Use ONLY the provided company profile + notes.
Return concise bullets for each block:
1. customerSegments
2. valuePropositions
3. channels
4. customerRelationships
5. revenueStreams
6. keyResources
7. keyActivities
8. keyPartners
9. costStructure

Rules:
- Never invent monetization models or partnerships not present in the inputs.
- Each bullet must reflect an explicit fact; if missing, leave the block empty.
- Output valid JSON only.
```

### User Prompt

```
Build the Business Model Canvas for this company.

Company Profile:
{{companyProfileJson}}

Additional Notes:
{{additionalNotes}}
```

### Input Schema

```json
{
  "companyProfile": {
    "companyName": "string",
    "industry": "string",
    "sizeRange": "string",
    "productsServices": ["string"],
    "targetMarkets": ["string"],
    "customerSegments": ["string"]
  },
  "additionalNotes": ["string"]
}
```

### Output Schema

```json
{
  "companyName": "string",
  "customerSegments": ["string"],
  "valuePropositions": ["string"],
  "channels": ["string"],
  "customerRelationships": ["string"],
  "revenueStreams": ["string"],
  "keyResources": ["string"],
  "keyActivities": ["string"],
  "keyPartners": ["string"],
  "costStructure": ["string"]
}
```

### Fallback Strategy

- Deduplicate entries across blocks before returning.
- Cap each list at 8 bullets to keep UI readable.

---

### `ai.generateMatchingSummary`

#### Purpose

Generate a **structured, deterministic matching analysis** between:

- a **User** (UserProfile + PersonalCanvas + selected Experience signals),
- a **JobDescription** (analyzed job),
- an **optional Company** (lightweight Company “basic info” only).

The output is **strict JSON only**, validated against a schema, and is persisted into `MatchingSummary`.

- produce a clear “fit narrative” + actionable matching artifacts
- remain **grounded in provided inputs**
- avoid overwhelming the model with excessive company context

---

## Input Schema (JSON)

> Guiding principle: **maximize user signal**, keep company signal **minimal**.

```ts
{
  user: {
    profile: {
      fullName: string
      headline?: string
      location?: string
      seniorityLevel?: string
      workPermitInfo?: string

      goals?: string[]
      aspirations?: string[]
      personalValues?: string[]
      strengths?: string[]
      interests?: string[]
      skills?: string[]
      certifications?: string[]
      languages?: string[]
    }

    personalCanvas?: {
      // PersonalCanvas (Business Model Canvas style)
      customerSegments?: string[]
      valueProposition?: string[]
      channels?: string[]
      customerRelationships?: string[]
      keyActivities?: string[]
      keyResources?: string[]
      keyPartners?: string[]
      costStructure?: string[]
      revenueStreams?: string[]
    }

    experienceSignals?: {
      // Lightweight, high-signal subset of Experience + STARStory,
      // meant to improve matching without sending full stories.
      experiences: Array<{
        title: string
        companyName?: string
        startDate?: string // ISO date
        endDate?: string   // ISO date or undefined
        responsibilities?: string[]
        tasks?: string[]
        achievements?: string[]        // from STARStory.achievements (if available)
        kpiSuggestions?: string[]      // from STARStory.kpiSuggestions (if available)
      }>
    }
  }

  job: {
    // JobDescription (analyzed)
    title: string
    seniorityLevel?: string
    roleSummary?: string
    responsibilities?: string[]
    requiredSkills?: string[]
    behaviours?: string[]
    successCriteria?: string[]
    explicitPains?: string[]
  }

  company?: {
    // MINIMAL company context (avoid overwhelming the AI)
    // Flat structure - no nested objects
    companyName: string
    industry?: string
    sizeRange?: string
    website?: string
    description?: string
  }
}
```

### Input Rules

- Inputs must be **structured JSON only**.
- No raw CV text, no raw job posting text, no free-form notes blobs.
- `company` is optional (because `MatchingSummary.companyId` is optional in DB).
- `company` is a **flat object** - GraphQL schema uses `a.ref('CompanyType')` which maps directly to the structure above.
- Lambda handler receives this structure **as-is** - no transformation layer needed.
- `experienceSignals.experiences` should include the **most relevant experiences** for the job (selection happens outside this operation).
- If `experienceSignals` is missing, the operation must still return valid output, but quality may degrade (still deterministic + safe).

---

## Output Schema (JSON) — Matches `MatchingSummary`

```ts
{
  // Optional in V1, maps to MatchingSummary.userFitScore
  userFitScore?: number

  // Core structured outputs
  impactAreas: string[]
  contributionMap: string[]
  riskMitigationPoints: string[]
  summaryParagraph: string

  // Metadata
  generatedAt: string // ISO datetime
  needsUpdate: boolean
}
```

### Output Semantics

- `summaryParagraph`: concise narrative of fit (neutral tone, grounded in inputs)
- `impactAreas`: where the user can create value quickly (3–7 items recommended)
- `contributionMap`: explicit mappings from user signals → job needs (3–8 items recommended)
- `riskMitigationPoints`: risks/gaps + mitigation actions (3–8 items recommended)
- `userFitScore` (optional): only if the operation can compute it deterministically from inputs; must be `0..100`
- `generatedAt`: timestamp set at generation time (UTC ISO string)
- `needsUpdate`: set to `false` on successful generation (true only for fallback/partial cases)

---

## Validation Rules

- Response must be valid JSON and match schema exactly (no extra keys).
- Arrays are arrays of strings only (no objects).
- If `userFitScore` exists: finite number, `0 <= score <= 100`.
- `generatedAt` must be ISO datetime string.
- Content must be input-grounded (no invented employers, achievements, company facts).

---

## Determinism & Grounding Requirements

- Use only provided input fields.
- Prefer explicit references to:
  - user skills/strengths/values
  - experience responsibilities/tasks/achievements/KPIs
  - job requiredSkills/responsibilities/behaviours/explicitPains
- Company input is intentionally minimal; do not infer culture, values, or strategy beyond `description/industry/sizeRange`.

---

## Fallback Strategy (Contract-Compatible)

If validation fails:

1. Retry once with a stricter instruction:
   - “Return ONLY valid JSON matching schema. No extra keys. Strings/arrays only.”

2. If still invalid, return fallback JSON:

   ```ts
   {
     impactAreas: [],
     contributionMap: [],
     riskMitigationPoints: [],
     summaryParagraph: "",
     generatedAt: "<now-iso>",
     needsUpdate: true
   }
   ```

   (omit `userFitScore`)

Additionally:

- Log input snapshot + raw output snippet + fallback reason.
- Persist fallback output (so UI remains stable and user can retry).

---

## Invocation Constraints

- Called only from workflow/orchestration layer (e.g. `useMatchingEngine`).
- Must be idempotent for unchanged inputs (workflow may enforce this via input hash; operation must remain stable for same input).
- UI components must never call the AI op directly.

---

## AI OPERATIONS 11–14 — Tailored Documents

### AI OPERATION 11 — `ai.generateCv`

#### Purpose

Generate a **job-tailored CV in Markdown format**, using:

- User profile
- Selected experiences (with stories / achievements / KPIs already available in the data layer)
- Skills, languages, certifications, interests
- An optional job description
- A soft constraint that the CV should be **around 2 pages**

This operation outputs **complete CV as Markdown text** that follows CV best practices and is ATS-optimized.

---

#### System Prompt

```text
You are an expert CV writer and career coach. Your task is to generate a professional, ATS-optimized CV in Markdown format.

CRITICAL REQUIREMENTS:
1. Output ONLY valid Markdown - no additional commentary
2. Use proper Markdown syntax (# for headers, ** for bold, - for lists, etc.)
3. Follow CV best practices:
   - Start with contact info and professional summary
   - Use action verbs and quantifiable achievements
   - Keep bullet points concise (1-2 lines max)
   - Prioritize relevant experience for the role
   - Use reverse chronological order
4. When a job description is provided, tailor the CV to highlight relevant skills and experiences
5. Structure sections logically: Summary → Experience → Education → Skills → Additional sections
6. Ensure proper spacing between sections for readability

FORMATTING GUIDELINES:
- Use # for name/header
- Use ## for section headers
- Use ### for job titles/institutions
- Use **bold** for emphasis on key achievements
- Use - for bullet points
- Include dates in format: Month Year - Month Year (or Present)
- Keep total length appropriate (1-2 pages worth of content)

GOAL:
- Produce a coherent CV that fits in approximately 2 pages
- Use ONLY the information provided in the input profile, experiences, stories, and job description
- DO NOT invent new experiences, employers, or responsibilities

OUTPUT FORMAT:
Output ONLY pure Markdown text - no JSON, no code blocks, no wrapping.
Start directly with the CV content.
```

---

#### User Prompt

```text
Generate a professional CV in Markdown format. YOU MUST USE THE EXACT DATA PROVIDED BELOW - do not invent or substitute information.

## USER PROFILE
Name: {{fullName}}
Professional Title: {{headline}}
Location: {{location}}
Seniority: {{seniorityLevel}}

Career Goals:
{{goals}}

Key Strengths:
{{strengths}}

## WORK EXPERIENCE ({{experienceCount}} positions)
{{experiences}}

## ACHIEVEMENT STORIES ({{storyCount}} stories)
{{stories}}

## SKILLS
{{skills}}

## LANGUAGES
{{languages}}

## CERTIFICATIONS
{{certifications}}

## INTERESTS
{{interests}}

## TARGET JOB DESCRIPTION (if provided)
{{jobDescription}}

IMPORTANT: Tailor the CV to highlight experiences, skills, and achievements most relevant to this job description. Emphasize matching keywords and requirements.

CRITICAL REMINDER: Use ONLY the information provided above. Do not use placeholder names like "John Doe" or invent any data. The CV MUST contain the exact names, titles, companies, and dates from the input data.
```

---

#### Input Schema

```typescript
{
  userProfile: {
    fullName: string;
    headline?: string;
    location?: string;
    goals?: string[];
    strengths?: string[];
  };
  selectedExperiences: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    responsibilities?: string[];
    tasks?: string[];
  }>;
  stories?: Array<{
    situation: string;
    task: string;
    action: string;
    result: string;
  }>;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  interests?: string[];
  jobDescription?: string;
}
```

---

#### Output Schema

```typescript
string; // Complete CV as Markdown text
```

The output is plain Markdown text that includes:

- Name and professional summary
- Work experience with bullet points
- Skills, languages, certifications
- Education (if applicable)
- Additional sections as needed

The Markdown follows standard formatting conventions and is ready to be rendered or exported.

---

#### Fallback Strategy

- If the model returns invalid or empty content:
  - Retry once with simplified prompt
  - Log error for monitoring

- If the result is clearly too verbose (>10,000 characters):
  - Log warning for monitoring
  - Return as-is (application can handle display)

- Markdown validation:
  - Ensure output contains at least one header (#)
  - Verify minimum length (>100 characters)
  - Log warning if format seems incorrect but don't fail

### `ai.generateCoverLetter`

**Purpose**  
Generate a generic-first cover letter that can optionally be tailored when job context is provided.

**System Prompt**

```
You generate a professional cover letter based on user identity data.

If jobDescription is provided, tailor phrasing to the role and job needs without inventing facts.
If jobDescription is absent, keep the letter generic (no job targeting).

Output must be:
- concise
- professional
- first-person voice
- aligned to the user's experience
- no invented work history or skills
- JSON only
```

**User Prompt**

```
Use the following data to create a cover letter:

PROFILE:
{{profile}}

EXPERIENCES:
{{experiences}}

STORIES:
{{stories}}

PERSONAL CANVAS:
{{personalCanvas}}

TARGET JOB DESCRIPTION (optional):
{{jobDescription}}

Return JSON with:
- tone
- content
```

**Input schema**

```json
{
  "profile": {},
  "experiences": [],
  "stories": [],
  "personalCanvas": {},
  "jobDescription?": {}
}
```

**Output schema**

```json
{
  "tone": "string",
  "content": "string"
}
```

### `ai.generateSpeech`

**Purpose**
Generate 3 high-level personal speech elements from user identity data:

- Elevator Pitch
- Career Story
- “Why Me?” statement

**System Prompt**

```
You generate personal narrative speech based on user identity data.

If jobDescription is provided, tailor phrasing to the role and job needs without inventing facts.
If jobDescription is absent, keep the speech generic (no job targeting).

Output must be:
- concise
- professional
- first-person voice
- motivational but realistic
- grounded in data provided
- no invented work history or skills

Return ONLY valid JSON.
```

**User Prompt**

```
Use the following data to create personal speech material:

PROFILE:
{{profile}}

STAR STORIES:
{{stories}}

PERSONAL CANVAS:
{{personalCanvas}}

EXPERIENCE SUMMARY:
{{experiences}}

## TARGET JOB DESCRIPTION (optional)
{{jobDescription}}

Return JSON with:
- elevatorPitch (80 words max)
- careerStory (160 words max)
- whyMe (120 words max)
```

**Input schema**

```json
{
  "profile": {},
  "experiences": [],
  "stories": [],
  "personalCanvas": {},
  "jobDescription?": {}
}
```

**Output schema**

```json
{
  "elevatorPitch": "string",
  "careerStory": "string",
  "whyMe": "string"
}
```

**Fallback**

- remove unsupported claims
- shorten if over length
- if jobDescription is missing, remove job/company targeting
- no opinionated emotional tone

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
