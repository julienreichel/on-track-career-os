# AI Interaction Contract (AIC) — MVP Version

## 1. Overview

The product relies on a **deterministic set of AI capabilities**, each encapsulated in an **AI Operation**.

Each operation must conform to:

- **System prompt** (constant)
- **User prompt** (variable, data-injection)
- **Input schema** (validated before calling the AI)
- **Output schema** (validated after AI returns)
- **Fallback strategy** for malformed output

**All operations must return structured, validated data to the application.** Most operations use JSON directly. Document-generation operations return Markdown strings, validated as strings, for user-facing documents.

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

9. `ai.generateMatchingSummary`

### Application Materials (EPIC 6)

10. `ai.generateCv`
11. `ai.generateCoverLetter`
12. `ai.generateSpeech`

---

# 4. PROMPT TEMPLATES (System + User)

Below is the **minimum viable version** of each operation, including purpose, prompts, and schemas.

---

## AI OPERATION 1 — `ai.parseCvText`

### Purpose

Extract **profile fields** and a **unified list of experience items** (work, education, volunteer, project) from PDF-extracted CV text, normalized for downstream processing. Produce clean raw blocks that can be parsed later into structured `Experience` records.

### System Prompt

```
You are a CV text parser that extracts structured profile information and splits a CV into experience items.

Return ONLY valid JSON with no markdown wrappers.

HARD RULES:
- Never invent information not explicitly present in the text.
- Do not infer missing details (no guessing location from address unless explicitly written as location).
- Output MUST match the schema exactly: all keys must exist, correct types only.
- Strings must be "" when unknown (never undefined, never null, never "null").
- Arrays must be [] when empty (never a string).
- Each experience item must be a single, non-merged item (one role / one education entry / one volunteer entry / one project).

EXTRACTION RULES:
- Extract profile fields if explicitly present: full name, headline, location, seniority level, email, phone, work permit info, social links.
- Extract lists: aspirations, personal values, strengths, interests, skills, certifications, languages.
- Create experienceItems[] by identifying distinct items and assigning experienceType:
  - "work": employment roles
  - "education": degrees/diplomas/schools/universities/training programs
  - "volunteer": volunteer roles, associations, non-paid civic engagement
  - "project": personal/side projects, freelance missions without clear employer structure, portfolio work
- When unsure between "work" and "project": choose "project".
- If a block cannot be classified confidently: put it into rawBlocks instead of creating an experience item.

CONTENT RULES FOR experienceItems:
- Each rawBlock should include the header + dates + location (if present) + responsibilities/achievements.
- Do not split one role into multiple items unless the CV clearly contains multiple distinct roles with different titles/dates.
- Do not merge multiple roles into one item even if they are at the same company.

NORMALIZATION:
- Preserve original language; do not translate.
- Keep line breaks inside rawBlock if they improve readability.
```

---

### User Prompt

```
Extract structured profile information and experience items from this CV text:
{{cvText}}

Return a JSON object with this exact structure:
{
  "profile": {
    "fullName": "string",
    "headline": "string",
    "location": "string",
    "seniorityLevel": "string",
    "primaryEmail": "string",
    "primaryPhone": "string",
    "workPermitInfo": "string",
    "socialLinks": ["string"],
    "aspirations": ["string"],
    "personalValues": ["string"],
    "strengths": ["string"],
    "interests": ["string"],
    "skills": ["string"],
    "certifications": ["string"],
    "languages": ["string"]
  },
  "experienceItems": [
    {
      "experienceType": "work|education|volunteer|project",
      "rawBlock": "string"
    }
  ],
  "rawBlocks": ["string"],
  "confidence": 0.95
}

Important:
- experienceItems: one entry per distinct item (one role / one education / one volunteer / one project). Never merge items.
- rawBlock must contain the full text for that item (header + body).
- If a profile field is not found: use "" for strings and [] for arrays.
- Never output null (not as JSON null and not as the string "null").
- confidence is a number between 0 and 1.
```

---

### Input Schema

```json
{
  "cvText": "string"
}
```

---

### Output Schema

```json
{
  "profile": {
    "fullName": "string",
    "headline": "string",
    "location": "string",
    "seniorityLevel": "string",
    "primaryEmail": "string",
    "primaryPhone": "string",
    "workPermitInfo": "string",
    "socialLinks": ["string"],
    "aspirations": ["string"],
    "personalValues": ["string"],
    "strengths": ["string"],
    "interests": ["string"],
    "skills": ["string"],
    "certifications": ["string"],
    "languages": ["string"]
  },
  "experienceItems": [
    {
      "experienceType": "work|education|volunteer|project",
      "rawBlock": "string"
    }
  ],
  "rawBlocks": ["string"]
}
```

---

### Fallback Strategy

- If `profile` is missing: create it with all fields present, using `""` for strings and `[]` for arrays.
- If `experienceItems` is missing: use `[]`.
- If `rawBlocks` is missing: use `[]`.
- If any profile key is missing: add it with the appropriate empty default (`""` or `[]`).
- If an experience item is missing `experienceType` or `rawBlock`, discard that item and append its text to `rawBlocks`.
- If `confidence` is missing: default to `0.5`.
- If fewer than 2 meaningful fields are extracted overall (e.g., almost everything is empty): clamp `confidence` to `0.3`.

---

## AI OPERATION 2 — `ai.extractExperienceBlocks`

### Purpose

Transform **typed raw experience items** (from `ai.parseCvText` v2) into structured `Experience` entities ready to be stored in the DB.

Outputs **only fields needed by the `Experience` DB model**.

The caller provides a `language` parameter, and the model must output **responsibilities** and **tasks** in that language (and keep `title/companyName` as found in the CV unless they are already in the target language).

---

### System Prompt

```
You transform raw CV experience items into structured Experience records.

Return ONLY valid JSON with no markdown wrappers.

HARD RULES:
- Never invent information not explicitly present in the text.
- Do not guess missing dates, company names, titles, or locations.
- If information is missing or unclear, return "" for strings and [] for arrays.
- Never output null (not as JSON null and not as the string "null").
- Output MUST match the schema exactly: all keys must exist, correct types only.

LANGUAGE RULES:
- The input provides a target language.
- Output responsibilities[] and tasks[] MUST be written in the target language.
- Do not add new information during translation; translate only what is present.
- Keep proper nouns (company names, product names, locations) unchanged.
- Keep title as written in the CV unless a direct, obvious translation exists without changing meaning. If unsure, keep it unchanged.

EXTRACTION RULES:
- For each input item, output exactly one Experience record.
- experienceType must be exactly the provided type: one of "work", "education", "volunteer", "project".
- status indicates completeness:
  - "complete" if title is present AND at least one of (companyName OR startDate) is present.
  - otherwise "draft".

DATE RULES:
- Extract dates only if explicitly present.
- If only a year is present, use that year as a string (do not invent month/day).
- If "present/current/aujourd’hui" is explicitly stated, set endDate to "".
- If startDate is not present, set startDate to "".
```

---

### User Prompt

```
Convert the following typed CV experience items into Experience records.

Target output language:
{{language}}

Input items:
{{experienceItems}}

Return a JSON object with this exact structure:
{
  "experiences": [
    {
      "title": "string",
      "companyName": "string",
      "startDate": "string",
      "endDate": "string",
      "responsibilities": ["string"],
      "tasks": ["string"],
      "status": "draft|complete",
      "experienceType": "work|education|volunteer|project"
    }
  ]
}

Important:
- Return one experience per input item, in the same order.
- Never invent missing details.
- If a field is not found: use "" for strings and [] for arrays.
- responsibilities and tasks must be in the target output language.
- experienceType must equal the input experienceType for that item (do not change it).
- Never output null.
```

---

### Input Schema

```json
{
  "language": "string",
  "experienceItems": [
    {
      "experienceType": "work|education|volunteer|project",
      "rawBlock": "string"
    }
  ]
}
```

---

### Output Schema

```json
{
  "experiences": [
    {
      "title": "string",
      "companyName": "string",
      "startDate": "string",
      "endDate": "string",
      "responsibilities": ["string"],
      "tasks": ["string"],
      "status": "string",
      "experienceType": "string"
    }
  ]
}
```

---

### Fallback Strategy

- If an input item cannot be parsed reliably:
  - Return `title: ""`, `companyName: ""`, `startDate: ""`, `endDate: ""`,
  - `responsibilities: []`, `tasks: []`,
  - `status: "draft"`,
  - `experienceType: <input experienceType>`.

- If `experiences` is missing, return `{ "experiences": [] }`.

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

> GraphQL schema uses strongly-typed custom types from `amplify/data/schema/types.ts`.

```ts
{
  profile: ProfileType         // Required: Full user profile
  experiences: ExperienceType[] // Required: Array of experiences
  stories?: SpeechStoryType[]   // Optional: STAR stories for context
  personalCanvas?: PersonalCanvasType // Optional: Business Model Canvas
  jobDescription?: JobType      // Optional: Analyzed job description
  company?: CompanyType         // Optional: Company profile
}
```

**Type Definitions** (from GraphQL schema):

```ts
ProfileType: {
  fullName: string (required)
  headline?: string
  location?: string
  seniorityLevel?: string
  primaryEmail?: string
  primaryPhone?: string
  workPermitInfo?: string
  socialLinks?: string[]
  goals?: string[]
  aspirations?: string[]
  personalValues?: string[]
  strengths?: string[]
  interests?: string[]
  skills?: string[]
  certifications?: string[]
  languages?: string[]
}

ExperienceType: {
  id?: string
  title: string (required)
  companyName: string (required)
  startDate?: string
  endDate?: string
  experienceType: string (required) // "work" | "education" | "volunteer" | "project"
  responsibilities: string[] (required)
  tasks: string[] (required)
  achievements?: string[]
  kpiSuggestions?: string[]
}

SpeechStoryType: {
  experienceId?: string
  title?: string
  situation?: string
  task?: string
  action?: string
  result?: string
  achievements?: string[]
}

PersonalCanvasType: {
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

JobType: {
  title: string (required)
  seniorityLevel: string (required)
  roleSummary: string (required)
  responsibilities: string[] (required)
  requiredSkills: string[] (required)
  behaviours: string[] (required)
  successCriteria: string[] (required)
  explicitPains: string[] (required)
}

CompanyType: {
  companyName: string (required)
  industry: string (required)
  sizeRange: string (required)
  website: string (required)
  description: string (required)
  productsServices: string[] (required)
  targetMarkets: string[] (required)
  customerSegments: string[] (required)
  rawNotes: string (required)
}
```

### Input Rules

- Inputs must be **structured JSON only** matching GraphQL schema types
- No raw CV text, no raw job posting text, no free-form notes blobs
- `profile` and `experiences` are required; all others optional
- `company`, `jobDescription`, `personalCanvas`, and `stories` are optional for tailoring context
- Lambda handler receives these types **as-is** from GraphQL - no transformation layer
- If optional tailoring fields are missing, operation generates generic (non-tailored) output

---

## Output Schema (JSON) — Matches `MatchingSummary`

```ts
{
  // Core scoring
  overallScore: number // Required: 0-100 integer score
  scoreBreakdown: {
    skillFit: number      // 0-100 integer
    experienceFit: number // 0-100 integer
    interestFit: number   // 0-100 integer
    edge: number          // 0-100 integer
  }
  recommendation: string // Required: "apply" | "maybe" | "skip"

  // Core structured outputs
  reasoningHighlights: string[]    // Why this recommendation
  strengthsForThisRole: string[]   // Key strengths that match
  skillMatch: string[]             // Skills tagged as [MATCH], [PARTIAL], [MISSING], [OVER]
  riskyPoints: string[]            // Risks + mitigation strategies
  impactOpportunities: string[]    // Where user can create value
  tailoringTips: string[]          // Specific tips for tailoring materials

  // Metadata
  generatedAt: string // ISO datetime
  needsUpdate: boolean // Set to false on successful generation
}
```

### Output Semantics

- `overallScore`: Aggregate match score 0-100 (weighted from breakdown)
- `scoreBreakdown`: Detailed scoring across 4 dimensions (each 0-100)
- `recommendation`: Clear action recommendation ("apply", "maybe", "skip")
- `reasoningHighlights`: Key reasoning points for the recommendation (3-7 items)
- `strengthsForThisRole`: User's strengths relevant to this specific role (3-8 items)
- `skillMatch`: Skills tagged with match status: [MATCH], [PARTIAL], [MISSING], [OVER] (3-12 items)
- `riskyPoints`: Gaps/risks with mitigation strategies (2-6 items)
- `impactOpportunities`: Where user can create immediate value (3-7 items)
- `tailoringTips`: Specific guidance for CV/cover letter/speech tailoring (3-8 items)
- `generatedAt`: Timestamp set at generation time (UTC ISO string)
- `needsUpdate`: Set to `false` on successful generation (true only for fallback/partial cases)

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

Generate a **CV in Markdown format**, using:

- User profile
- Selected experiences (with stories / achievements / KPIs already available in the data layer)
- Skills, languages, certifications, interests
- Optional tailoring context (job description + matching summary)
- Optional company summary (summary-level only)
- A soft constraint that the CV should be **around 2 pages**

This operation outputs **complete CV as Markdown text** that follows CV best practices and is ATS-optimized.

**Modes:**

- **Generic mode (no job provided):** Generate a generic CV and support instantiating a user-specific template from a system exemplar. Output remains Markdown.
- **Tailored mode (job provided):** Generate a job-tailored CV.

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

LANGUAGE:
{{language}}

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

## MATCHING SUMMARY (if provided)
{{matchingSummary}}

## COMPANY SUMMARY (if provided)
{{company}}

IMPORTANT: Tailor the CV to highlight experiences, skills, and achievements most relevant to this job description. Emphasize matching keywords and requirements.

CRITICAL REMINDER: Use ONLY the information provided above. Do not use placeholder names like "John Doe" or invent any data. The CV MUST contain the exact names, titles, companies, and dates from the input data.
```

---

#### Input Schema

```typescript
{
  language: string; // e.g., "en", "fr", "de"
  profile: {
    // ProfileType from schema
    fullName?: string;
    headline?: string;
    location?: string;
    seniorityLevel?: string;
    primaryEmail?: string;
    primaryPhone?: string;
    workPermitInfo?: string;
    goals?: string[];
    aspirations?: string[];
    personalValues?: string[];
    strengths?: string[];
    interests?: string[];
    skills?: string[];
    certifications?: string[];
    languages?: string[];
    socialLinks?: string[];
  };
  experiences: Array<{
    // ExperienceType from schema
    id?: string;
    title?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
    experienceType?: "work" | "education" | "volunteer" | "project";
    responsibilities?: string[];
    tasks?: string[];
    achievements?: string[];
    kpiSuggestions?: string[];
  }>;
  templateMarkdown?: string; // Markdown exemplar to loosely match (structure/style)
  stories?: Array<{
    // SpeechStoryType from schema (simplified STARStory)
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    achievements?: string[];
  }>;
  personalCanvas?: {
    // PersonalCanvasType from schema
    customerSegments?: string[];
    valueProposition?: string[];
    channels?: string[];
    customerRelationships?: string[];
    keyActivities?: string[];
    keyResources?: string[];
    keyPartners?: string[];
    costStructure?: string[];
    revenueStreams?: string[];
  };
  jobDescription?: {
    // JobType from schema
    title?: string;
    seniorityLevel?: string;
    roleSummary?: string;
    responsibilities?: string[];
    requiredSkills?: string[];
    behaviours?: string[];
    successCriteria?: string[];
    explicitPains?: string[];
  };
  matchingSummary?: {
    // MatchingSummaryContextType from schema
    overallScore?: number;
    scoreBreakdown?: {
      skillFit?: number;
      experienceFit?: number;
      interestFit?: number;
      edge?: number;
    };
    recommendation?: string;
    reasoningHighlights?: string[];
    strengthsForThisRole?: string[];
    skillMatch?: string[];
    riskyPoints?: string[];
    impactOpportunities?: string[];
    tailoringTips?: string[];
  };
  company?: {
    // CompanyType from schema
    companyName?: string;
    industry?: string;
    sizeRange?: string;
    website?: string;
    description?: string;
    productsServices?: string[];
    targetMarkets?: string[];
    customerSegments?: string[];
  };
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

- If tailoring context is invalid (missing jobDescription or matchingSummary):
  - Drop tailoring inputs and generate generic output
  - Log warning for monitoring

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
Generate a professional cover letter in Markdown format that can be tailored when job context is provided.

**System Prompt**

```
You are a professional cover letter writer. Generate a compelling cover letter in Markdown format.

If tailoring context is provided (jobDescription + matchingSummary), tailor the letter to the role and company without inventing facts.
If tailoring context is absent, create a strong generic letter showcasing the user's value.
Use company context only when provided for relevant framing.

Output must be:
- Professional Markdown format
- First-person voice
- Concise (3-4 paragraphs)
- Grounded in user's actual experience
- No invented work history or skills
- No markdown code blocks or JSON wrappers
```

**User Prompt**

```
Generate a professional cover letter in Markdown format.

LANGUAGE:
{{language}}

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

MATCHING SUMMARY (optional):
{{matchingSummary}}

COMPANY SUMMARY (optional):
{{company}}

Return ONLY Markdown text - no code blocks, no JSON.
```

**Input schema**

```typescript
{
  language: string;
  profile: ProfileType;          // Full profile from schema
  experiences: ExperienceType[]; // Array of experiences
  stories?: SpeechStoryType[];   // Optional STAR stories
  personalCanvas?: PersonalCanvasType; // Optional canvas
  jobDescription?: JobType;      // Optional job context
  matchingSummary?: MatchingSummaryContextType; // Optional matching
  company?: CompanyType;         // Optional company context
}
```

**Output schema**

```typescript
string; // Complete cover letter as Markdown text
```

**Fallback**

- If tailoring context is incomplete:
  - Generate generic cover letter without job targeting
  - Log info for monitoring

- If output is empty or malformed:
  - Retry once with simplified prompt
  - Log error for monitoring

- Markdown validation:
  - Ensure minimum length (>200 characters)
  - Verify professional tone markers present

### `ai.generateSpeech`

**Purpose**
Generate 3 high-level personal speech elements from user identity data:

- Elevator Pitch
- Career Story
- “Why Me?” statement

**System Prompt**

```
You generate personal narrative speech based on user identity data.

If tailoring context is provided (jobDescription + matchingSummary), tailor phrasing to the role and job needs without inventing facts.
If tailoring context is absent, keep the speech generic (no job targeting).
Use company context only when provided and only as summary-level framing.

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

LANGUAGE:
{{language}}

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

## MATCHING SUMMARY (optional)
{{matchingSummary}}

## COMPANY SUMMARY (optional)
{{company}}

Return JSON with:
- elevatorPitch (80 words max)
- careerStory (160 words max)
- whyMe (120 words max)
```

**Input schema**

```json
{
  "language": "en",
  "profile": {},
  "experiences": [],
  "stories": [],
  "personalCanvas": {},
  "jobDescription?": {},
  "matchingSummary?": {},
  "company?": {}
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

- If tailoring context is invalid (missing jobDescription or matchingSummary):
  - Drop tailoring inputs and generate generic output
  - Log warning for monitoring

- If JSON validation fails:
  - Retry once with stricter JSON-only instruction
  - Return safe empty fields on failure to keep UI stable

---

## AI OPERATION 13 — `ai.evaluateApplicationStrength` (EPIC A2)

### Purpose

Evaluate the **strength of an actual application** (CV and optional cover letter) for a **specific job description**, with focus on:

- **ATS readiness** (structure, keyword coverage signals, scan-friendly formatting cues)
- **Material quality** (clarity, targeting, evidence)
- **Decision gate** (“Ready to apply?”)
- **Actionable improvements** that the UI can link to editing surfaces

This operation evaluates **only the provided materials** (generated in-app or user-provided).
It does **not** re-run job alignment / matching (EPIC 5C already covers that).

---

### System Prompt

```
You are an application evaluator. You assess how strong a candidate's application is for a specific job, using ONLY:
- the structured job description fields provided
- the CV text provided
- the optional cover letter text provided

Return ONLY valid JSON with no markdown wrappers.

HARD RULES:
- Never invent facts about the candidate, company, or role.
- Do not claim the candidate has skills/experience unless the provided CV/letter text explicitly contains them.
- Do not add new achievements, numbers, employers, titles, or dates.
- Output MUST match the schema exactly: all keys must exist, correct types only.
- Use "" for unknown strings, [] for empty arrays. Never output null.
- Use concise, actionable bullets (each <= 160 characters).

SCORING RULES (0..100):
Provide dimension scores and an overallScore.
Scores must be justified by the provided texts:
- If evidence is missing, score lower and add missingSignals + improvements.
- If coverLetterText is missing, do not penalize letter-specific dimensions; adapt rationale accordingly.

EVALUATION DIMENSIONS:
1) atsReadiness: likelihood the document passes automated screening based on structure + keyword signals.
2) clarityFocus: clarity, specificity, and low fluff; easy to scan; role-focused.
3) targetedFitSignals: tailoring to this role (title alignment, relevant highlights, role vocabulary, job pains addressed).
4) evidenceStrength: measurable outcomes, concrete impact, credible proof (metrics when present, otherwise specific outcomes).

DECISION GATE:
Return a decision label:
- "strong" (readyToApply = true)
- "borderline" (readyToApply = false)
- "risky" (readyToApply = false)
The decision must be consistent with overallScore and the weakest dimensions.

IMPROVEMENT ACTIONS:
Return at least 2 improvements. Prefer 3.
Each improvement must include:
- a short title
- an action instruction
- a target telling the UI where the user should edit (cv or cover letter) and an anchor section name when possible.
If you cannot infer a section, use target.anchor = "general".

MISSING SIGNALS:
List missing signals relevant to selection for interview (e.g., metrics, ownership, leadership, stakeholder mgmt, domain keywords),
but only if they are truly absent from the provided texts.
```

---

### User Prompt

```
Evaluate the strength of this application for the given job.

Job (structured):
{{jobJson}}

{{conditionalMaterialSections}}

Return a JSON object with this exact structure:
{{Schema}}

Important:
- Use only explicit evidence from the provided application material text.
- Only mention document-specific critiques for materials that were provided.
- rationaleBullets: 2 to 5 bullets, concise.
- topImprovements: at least 2 items, preferably 3.
- anchor should be a common section label when possible (e.g., "summary", "skills", "experience", "education", "projects", "coverLetterBody", "general").
- Never output null.
```

---

### Input Schema

```json
{
  "job": "JobType",
  "cvText": "string",
  "coverLetterText": "string",
  "language": "string"
}
```

---

### Output Schema

```json
{
  "overallScore": 0,
  "dimensionScores": {
    "atsReadiness": 0,
    "clarityFocus": 0,
    "targetedFitSignals": 0,
    "evidenceStrength": 0
  },
  "decision": {
    "label": "string",
    "readyToApply": true,
    "rationaleBullets": ["string"]
  },
  "missingSignals": ["string"],
  "topImprovements": [
    {
      "title": "string",
      "action": "string",
      "impact": "string",
      "target": {
        "document": "string",
        "anchor": "string"
      }
    }
  ],
  "notes": {
    "atsNotes": ["string"],
    "humanReaderNotes": ["string"]
  }
}
```

---

### Fallback Strategy

- If any top-level key is missing, create it with defaults:
  - `overallScore`: 0
  - each dimension: 0
  - arrays: []
  - strings: ""
- Clamp all scores to integer range `0..100`.

---

## AI OPERATION — `ai.evaluateCompetencyCoverage`

### Purpose

Given a list of **competencies** (skills/strengths/job-competencies) and the user’s **STAR stories + experiences**, return a **coverage signal** per competency:

- **high** = at least one story directly evidences it
- **medium** = at least one story indirectly relates to it
- **low** = no story evidence found

Also return **recommended next actions** and **suggested experience candidates** to create a new story from (when coverage is low/medium).

This operation is used in:

- Profile “Check skills” / “Check strengths”
- Job match evidence section on `/jobs/[jobId]/match` (job competencies = requiredSkills + behaviours + responsibilities, already normalized/deduped by the caller)

---

### System Prompt

```txt
You evaluate whether a user's stories provide evidence for a list of competencies (skills/strengths/job competencies).

Return ONLY valid JSON with no markdown wrappers.

HARD RULES:
- Never invent evidence. Only cite storyIds or experienceIds that are present in the input.
- Never invent competencies not present in the input list.
- Do not rewrite or paraphrase the user's story content; only reference IDs and provide short suggestion prompts.
- Output MUST match the schema exactly: all keys must exist, correct types only.
- Strings must be "" when unknown (never undefined, never null).
- Arrays must be [] when empty.
- Never output null (not as JSON null and not as the string "null").

COVERAGE RULES:
- "high" coverage: at least one story is a direct match (the competency is explicitly evidenced by the story's content or story tags).
- "medium" coverage: no direct match, but at least one story is an indirect match (related theme, adjacent capability).
- "low" coverage: no matching story.
- Direct vs indirect should be decided conservatively. Prefer "medium" over "high" if uncertain.

EVIDENCE RULES:
- Use story.tags when available:
  - If competencyType is "skill", storySkills[] is a strong signal.
  - If competencyType is "strength", storyStrengths[] is a strong signal.
- If story tags are absent or empty, infer cautiously from story text (situation/task/action/result).
- When providing evidence IDs, only reference IDs that exist in the input.

EXPERIENCE CANDIDATE RULES:
- If coverage is low or medium, try to propose experienceIds that could likely support a story for this competency.
- Only propose experienceIds that exist in the input experiences list.
- If no suitable experience can be identified confidently, set requiresUserExperiencePick=true and suggestedExperienceIds=[].

SUGGESTION PROMPTS:
- Provide 1–3 short actionable prompts for what to demonstrate in a story (<= 90 chars each).
- Prompts must be generic and not invent company/project specifics.

NORMALIZATION:
- Assume competencies have already been normalized/deduplicated by the caller, but be tolerant of casing and minor punctuation differences when matching.
```

---

### User Prompt Template

```txt
Evaluate competency evidence coverage for the user.

Competency type:
{{competencyType}}  // "skill" | "strength" | "jobCompetency"

Competencies to evaluate (already normalized + deduplicated by the app):
{{competenciesJson}}

User experiences:
{{experiencesJson}}

User stories:
{{storiesJson}}

Return JSON with the exact schema.
```

---

### Input Schema

```json
{
  "competencyType": "skill|strength|jobCompetency",
  "competencies": ["string"],
  "experiences": [
    {
      "id": "string",
      "title": "string",
      "companyName": "string",
      "startDate": "string",
      "endDate": "string",
      "experienceType": "work|education|volunteer|project",
      "responsibilities": ["string"],
      "tasks": ["string"]
    }
  ],
  "stories": [
    {
      "id": "string",
      "experienceId": "string",
      "title": "string",
      "situation": "string",
      "task": "string",
      "action": "string",
      "result": "string",
      "skills": ["string"],
      "strengths": ["string"]
    }
  ]
}
```

> Notes:
>
> - `experiences[].id` and `stories[].id` / `experienceId` must be included by the caller.
> - `stories[].skills` and `stories[].strengths` are required arrays (empty allowed).

---

### Output Schema

```json
{
  "results": [
    {
      "competency": "string",
      "coverage": "low|medium|high",
      "directStoryIds": ["string"],
      "indirectStoryIds": ["string"],
      "suggestedExperienceIds": ["string"],
      "requiresUserExperiencePick": true,
      "suggestedPrompts": ["string"],
      "recommendedActions": [
        "none|createStoryFromExperience|improveExistingStory|askUserPickExperience"
      ]
    }
  ],
  "summary": {
    "highCount": 0,
    "mediumCount": 0,
    "lowCount": 0
  }
}
```

---

### Fallback Strategy

- If output JSON is malformed: return:
  - `results` = one entry per input competency with:
    - `coverage: "low"`
    - empty arrays
    - `requiresUserExperiencePick: true`
    - `recommendedActions: ["askUserPickExperience"]`
    - `suggestedPrompts: []`

  - `summary` counts computed accordingly.

- If any `results[]` item is missing a required key: fill with safe defaults:
  - strings: `""`
  - arrays: `[]`
  - `coverage: "low"`
  - `requiresUserExperiencePick: true`
  - `recommendedActions: ["askUserPickExperience"]`

- Clamp prompt lengths to <= 90 characters; truncate if necessary.
- Deduplicate storyIds and experienceIds within each result.

---

## AI OPERATION — `ai.extractSkillsAndStrengthsFromEvidence`

### Purpose

Propose **skills and strengths** that can be extracted from the user’s existing **stories and experiences**, so the user can add them to `UserProfile.skills[]` and `UserProfile.strengths[]` with one click.

Must be grounded in provided content. No invented abilities.

---

### System Prompt

```txt
You extract proposed skills and strengths from a user's existing evidence (stories and experiences).

Return ONLY valid JSON with no markdown wrappers.

HARD RULES:
- Never invent skills/strengths that are not supported by the input.
- Propose only items that are reasonably evidenced by story content (preferred) or experience responsibilities/tasks (secondary).
- Output MUST match the schema exactly: all keys must exist, correct types only.
- Strings must be "" when unknown (never undefined, never null).
- Arrays must be [] when empty.
- Never output null (not as JSON null and not as the string "null").

QUALITY RULES:
- Prefer concise skill/strength labels (1–4 words).
- Avoid duplicates and near-duplicates (case/punctuation variants).
- Avoid overly generic items (e.g., "work", "job", "experience").
- Do not add seniority adjectives unless explicitly supported (avoid "expert", "world-class", etc.).

EVIDENCE RULES:
- For each proposed item, provide evidence IDs:
  - storyIds when derived from stories
  - experienceIds when derived from experiences
- Only reference IDs present in the input.

DEDUP RULES:
- Compare case-insensitively and ignore minor punctuation.
- Also deduplicate against existingSkills and existingStrengths provided by the caller.
```

---

## User Prompt Template

```txt
Extract proposed skills and strengths from the user's evidence.

Existing profile skills:
{{existingSkillsJson}}

Existing profile strengths:
{{existingStrengthsJson}}

User experiences:
{{experiencesJson}}

User stories:
{{storiesJson}}

Return JSON with the exact schema.
```

---

### Input Schema

```json
{
  "existingSkills": ["string"],
  "existingStrengths": ["string"],
  "experiences": [
    {
      "id": "string",
      "title": "string",
      "companyName": "string",
      "experienceType": "work|education|volunteer|project",
      "responsibilities": ["string"],
      "tasks": ["string"]
    }
  ],
  "stories": [
    {
      "id": "string",
      "experienceId": "string",
      "title": "string",
      "situation": "string",
      "task": "string",
      "action": "string",
      "result": "string",
      "skills": ["string"],
      "strengths": ["string"]
    }
  ]
}
```

---

### Output Schema

```json
{
  "proposedSkills": [
    {
      "label": "string",
      "confidence": 0.75,
      "storyIds": ["string"],
      "experienceIds": ["string"],
      "alreadyInProfile": false
    }
  ],
  "proposedStrengths": [
    {
      "label": "string",
      "confidence": 0.75,
      "storyIds": ["string"],
      "experienceIds": ["string"],
      "alreadyInProfile": false
    }
  ],
  "dedupeNotes": {
    "skillsDroppedAsDuplicate": ["string"],
    "strengthsDroppedAsDuplicate": ["string"]
  }
}
```

> Confidence is 0..1 and should be conservative:
>
> - Story-based evidence → higher
> - Experience-only evidence → lower

---

### Fallback Strategy

- If output JSON is malformed: return:
  - `proposedSkills: []`
  - `proposedStrengths: []`
  - `dedupeNotes` with empty arrays

- If any proposed item is missing keys: drop it.
- Clamp `confidence` to [0, 1].
- Remove any item that matches (case-insensitive) an entry in:
  - existingSkills / existingStrengths

- Deduplicate labels within the proposed lists.

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

If repeated failure:

- Show UI error:
  **“AI cannot produce a stable answer. Please refine your input.”**

---

# AI OPERATION 15 — `ai.improveMaterial` (EPIC C3)

## Purpose

Improve an **existing tailored CV or cover letter** through a full-document rewrite.

This operation:

- Strengthens clarity, impact, and role alignment
- Applies user-selected editorial presets (multi-select)
- Uses internal evaluation feedback (provided structurally in input)
- Rewrites the entire document for consistency
- Returns **Markdown only**

This is an **editorial improvement pass**, not a new generation from scratch.

---

## Output Format

**Markdown only.**

- No JSON
- No explanations
- No wrappers
- No backticks
- No commentary

The output must be the complete improved document.

---

## System Prompt

```text
You are an expert editorial career coach improving an existing professional document.

Return ONLY the final improved document in valid Markdown.
Do not return JSON.
Do not include explanations or commentary.

HARD RULES:
- Never invent facts.
- Do not create new roles, employers, dates, tools, skills, achievements, metrics, or education.
- Only use information present in:
  (a) the current document
  (b) structured profile, experiences, stories
  (c) job and company context
- If no measurable metrics are available, do NOT fabricate numbers.
- Maintain the original document language.
- Ensure full consistency of tone and structure across the entire document.
- Perform a complete rewrite to maintain coherence.

EDITORIAL GOALS:
- Apply selected user instruction presets precisely.
- Strengthen clarity, specificity, and impact.
- Improve alignment with the target role when job context is provided.
- Improve weak evidence where possible using available data.
- Remove redundancy.
- Prefer strong action verbs.
- Keep concise and readable.

FORMAT RULES:

If materialType = "cv":
- Keep clear sections.
- Use concise bullet points.
- Keep scan-friendly formatting.
- Avoid long paragraphs.

If materialType = "coverLetter":
- 3–4 well-structured paragraphs.
- First-person voice.
- Clear motivation and alignment.
- Professional but natural tone.

Do not add new sections requiring invented content.
Do not remove critical evidence.
Output ONLY the improved Markdown document.
```

---

## User Prompt Template

```text
LANGUAGE:
{{language}}

MATERIAL TYPE:
{{materialType}}  // "cv" | "coverLetter"

USER INSTRUCTIONS (multi-select presets):
{{instructionPresetsJson}}

OPTIONAL USER NOTE:
{{instructionNote}}

INTERNAL IMPROVEMENT PRIORITIES:
{{internalImprovementSummary}}
(Structured evaluation feedback. Use this to guide improvements but do not mention it.)

CURRENT DOCUMENT:
"""
{{currentMarkdown}}
"""

GROUNDING CONTEXT:

PROFILE:
{{profileJson}}

EXPERIENCES:
{{experiencesJson}}

STORIES:
{{storiesJson}}

JOB DESCRIPTION:
{{jobDescriptionJson}}

MATCHING SUMMARY:
{{matchingSummaryJson}}

COMPANY:
{{companyJson}}

Rewrite the document accordingly.
Return only the improved Markdown.
```

---

## Input Schema

```ts
{
  language: string;

  materialType: "cv" | "coverLetter";

  currentMarkdown: string;

  instructions: {
    presets: string[];   // shared multi-select list
    note?: string;
  };

  // Reuse direct output from ai.evaluateApplicationStrength
  improvementContext: EvaluateApplicationStrengthType;

  profile: ProfileType;
  experiences: ExperienceType[];
  stories?: SpeechStoryType[];

  jobDescription?: JobType;
  matchingSummary?: MatchingSummaryContextType;
  company?: CompanyType;
}
```

---

## Validation Rules

Backend must validate:

- Strict required fields and types (reject missing/invalid payload deterministically)
- Output is string
- Output length > 200 characters
- No JSON detected
- No Markdown code fences (especially ```json)
- Not empty
- Must not start with `{` or `[` after trimming

---

## Fallback Strategy

If output invalid:

1. Retry with stricter instruction:

```
Return ONLY valid Markdown.
No JSON.
No commentary.
No backticks.
Full document rewrite.
```

2. If still invalid → return original document unchanged.

## Deterministic Backend Error Codes

For predictable frontend i18n mapping:

- `ERR_IMPROVE_MATERIAL_INVALID_INPUT` → input payload contract error
- `ERR_IMPROVE_MATERIAL_INVALID_OUTPUT` → unrecoverable non-markdown output handling error
- `ERR_IMPROVE_MATERIAL_RETRY_FAILED_FALLBACK` → both attempts invalid, original markdown returned

---

# 7. LOGGING & EXPLAINABILITY

Each AI operation must store:

- timestamp
- input JSON
- output JSON
- fallback steps used
- confidence (if provided)

This enables **debuggability, traceability, reproducibility**.
