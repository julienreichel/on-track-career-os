# 🤖 EPIC C0/C13 — AI Career Companion

## Agent Core V1 Specification

---

# 1. Strategic Definition

## What This Is

The AI Career Companion is:

> A goal-oriented coaching agent that understands user intent,
> retrieves relevant structured data from the platform,
> provides anchored guidance,
> and proposes one concrete improvement action at a time.

It is:

- An intelligence amplification layer
- A meta-orchestrator over existing AI operations
- A coaching interface across the entire product

It is NOT:

- A generic chat interface
- A free-form AI writing playground
- An autonomous decision-maker
- A task manager
- A visible goal-tracking system

---

# 2. Core Principles

### 2.1 Data-Anchored Responses (Mandatory)

Every meaningful response must reference user data when available.

Examples:

- “You currently have 6 STAR stories, but only 1 mentions measurable impact.”
- “Your last 3 evaluated applications averaged 62% strength.”
- “Your canvas positioning does not clearly state target industry.”

The agent must feel informed.

Never abstract.

---

### 2.2 Single-Step Interaction Model

The agent:

- Understands the question
- Requests required data
- Answers
- Proposes at most ONE structured action

No multi-step plans.
No overwhelming suggestion lists.
No long improvement roadmaps.

One improvement at a time.

---

### 2.3 Clarification Allowed

If the question is vague:

User: “How can I improve?”

Agent:

> “Improve for which role or job? Are you focusing on Product, Engineering, or leadership roles?”

Clarity first.

---

### 2.4 Polite Strategic Mentor Tone

Personality:

- Calm
- Analytical
- Supportive
- Direct but not harsh
- Strategic consultant energy

No hype.
No fluff.
No over-enthusiasm.

---

### 2.5 Not Autonomous

The agent NEVER writes to user data without explicit confirmation.

Flow:

1. Propose structured update
2. User confirms
3. Platform executes
4. Agent acknowledges result

---

# 3. Agent Architecture

## 3.1 Layered Model

```
UI (Bubble / Sidebar)
↓
Agent Core
↓
MCP (Model Context Protocol)
↓
AI Operations + Domain Models
```

Strict separation.

The agent does not access database directly.

---

# 4. Agent Core — Functional Responsibilities

The Agent Core performs 5 functions.

---

## 4.1 Intent Understanding

Each message is classified as:

- Clarification request
- Improvement request
- Strategic analysis
- Content rewrite
- Performance diagnosis
- Guidance confusion
- Action execution

This determines next step.

---

## 4.2 Data Requirement Planning

The agent must determine:

“What structured data do I need to answer this properly?”

It requests only required data through MCP.

---

## 4.3 MCP Data Retrieval

The MCP layer exposes controlled capabilities.

Example interface:

```
getProfileSummary()
getExperiences()
getStories()
getPersonalCanvas()
getJob(jobId)
getMatchingSummary(jobId)
getApplicationStrength(jobId)
getRecentUserEvents(limit)
getWeakCompetencyAreas()
getLastEvaluatedApplications(limit)
```

The agent cannot invent data access.

All capabilities must be registered.

---

## 4.4 Response Generation

The response must:

1. Anchor in real data
2. Explain insight clearly
3. Suggest one improvement

Structure example:

- Observation (data-based)
- Interpretation
- Single improvement suggestion
- Optional action proposal

---

## 4.5 Structured Action Proposal

If applicable, the agent returns:

```
proposedAction: {
  type: "improveStory" | "evaluateApplication" | "updateCanvasBlock" | ...
  description: string
  payload: structured
}
```

Only one action per turn.

User must confirm.

---

# 5. Memory Model

## 5.1 Short-Term Memory

- Current conversation thread
- Ephemeral
- Stored per session

---

## 5.2 Long-Term Coaching Memory

Do NOT store raw chat transcripts.

Store distilled insights:

```
AgentInsight {
  userId
  category: "pattern" | "weakness" | "goal" | "behavior"
  key
  value
  confidence
  createdAt
}
```

Examples:

- weak_quantification
- unclear_target_role
- avoids_leadership_language
- strong_technical_depth

This enables:

- Pattern recognition
- Coaching continuity
- Future intelligence evolution

---

# 6. User Action History

A structured event stream:

```
UserEvent {
  userId
  type
  entityId
  metadata
  createdAt
}
```

Examples:

- created_story
- edited_canvas_block
- generated_cv
- evaluated_application
- ignored_agent_suggestion

The agent can request recent events to detect:

- Repeated rejections
- Lack of quantified stories
- Over-reliance on generation without refinement

---

# 7. Screen Awareness (Context Injection)

Each screen provides:

```
ScreenContext {
  name
  entityId
  availableActions[]
}
```

Examples:

On `/jobs/:id/application-strength`:

- evaluate_application
- generate_tailored_cv
- improve_material

On `/profile/canvas`:

- edit_block
- regenerate_canvas

The agent must not suggest actions unavailable on that screen.

---

# 8. Interaction Model

## 8.1 UI

- Floating assistant bubble
- Opens into sidebar
- User can chat freely

If unopened:

- Show static contextual prompts per page

---

## 8.2 Prompt Suggestion Behavior

When responding, agent may suggest:

- 2–3 follow-up prompt buttons
- Based on context
- Short and actionable

Example:

- “Help me strengthen this achievement”
- “Analyze why this application is weak”
- “Find gaps in my leadership profile”

---

# 9. Integration With Existing AI Ops

The agent is a meta-layer.

Rule:

If an existing AI operation matches the need → use it.

Examples:

- Application strength → `evaluateApplicationStrength`
- Material improvement → `improveMaterial`
- Matching analysis → `generateMatchingSummary`

Only perform direct generation if no existing op applies.

This preserves deterministic architecture.

---

# 10. Guardrails (Non-Negotiable)

- Max 1 proposed action per turn
- No multi-step roadmaps
- No auto-execution
- No hallucinated data
- No abstract motivational talk
- Must anchor in structured data
- Must request clarification if needed

---

# 11. V1 Scope Boundary

Included:

- Intent understanding
- MCP data retrieval
- Structured action proposal
- Memory (short + insight-based long-term)
- Screen awareness
- Single-step execution
- Unified personality

Not Included:

- Multi-step planning engine
- Visible coaching goals
- Persistent task lists
- Autonomous proactive nudging
- Multi-agent architecture
- Cross-session strategic agenda

---

# 12. Strategic Impact

Without this agent:

🛠 The platform is a powerful structured toolkit.

With this agent:

🧭 The platform becomes a guided strategic career coach.

It connects:

- C2 Competency Map
- A2 Application Strength
- C3 Material Improvement
- C1 Positioning
- C5 Momentum (future)
- C10 Dashboard (future)

The agent becomes the unifying intelligence layer.

---

# 13. Success Criteria (V1)

### Behavioral

- ≥30% of active users open the companion during profile or application work
- Users accept at least one proposed action per session
- Increase in quantified achievements after companion suggestions

### Product

- Reduced blank-field abandonment
- Increased usage of evaluation and improvement features
- Increased cross-feature adoption (e.g., Canvas → Matching → Improvement)

---

# 14. Final Strategic Position

This EPIC establishes:

> The Agent Core framework
> upon which future intelligent coaching layers can be built.

It is both:

- An intelligence amplification layer
- A foundation for future agent expansion

But in V1:

It remains disciplined, simple, and focused.

---

# 0) Conventions (V1)

## Capability ID format

`mcp.<domain>.<verb><Noun>` (camelCase)

## Common types

- `EntityRef`: `{ type: "UserProfile" | "Experience" | ... , id: string }`
- `ScreenContext`: `{ route: string, screen: string, entityRefs: EntityRef[], allowedCapabilityIds: string[] }`

## Standard envelopes

All capabilities return:

```ts
type McpResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };
```

---

# 1) Screen → Allowed Capability Sets (V1)

Routes are from your implemented navigation and page mapping.

## Profile hub

**Routes:** `/profile`, `/profile/full`
Allow: `ctx.*`, `read.profile.*`, `write.profile.*`, `read.experience.*`, `read.story.*`, `read.events.*`, `write.events.*`, `ai.profile.*`

## Experiences

**Routes:** `/profile/experiences`, `/profile/experiences/new`, `/profile/experiences/:id`
Allow: `ctx.*`, `read.experience.*`, `write.experience.*`, `read.story.* (scoped)`, `ai.story.*`, `read.events.*`, `write.events.*`

## Stories

**Routes:** `/profile/stories`, `/profile/experiences/:experienceId/stories`, `/profile/experiences/:experienceId/stories/:storyId`
Allow: `ctx.*`, `read.story.*`, `write.story.*`, `ai.story.*`, `read.experience.*`, `read.events.*`, `write.events.*`

## Personal Canvas

**Route:** `/profile/canvas`
Allow: `ctx.*`, `read.canvas.*`, `write.canvas.*`, `ai.canvas.*`, `read.profile.* (subset)`, `read.experience.*, `read.story._ (subset)`, `read.events._`, `write.events.\*`

## CV Upload workflow

**Route:** `/profile/cv-upload` (or `/cv-upload` depending on implementation)
Allow: `ctx.*`, `ai.cvParse.*`, `write.profile.*`, `write.experience.*`, `read.profile.*`, `read.events.*`, `write.events.*`

## Jobs

**Routes:** `/jobs`, `/jobs/new`, `/jobs/:id`, `/jobs/:id/match`, `/jobs/:id/application-strength`
Allow: `ctx.*`, `read.job.*`, `write.job.*`, `read.company.*`, `write.company.* (linking)`, `read.matching.*`, `read.profile.*`, `read.experience.*`, `read.story.*`, `ai.job.*`, `ai.matching.*`, `ai.appStrength.*`, `read.events.*`, `write.events.*`

## Companies

**Routes:** `/companies`, `/companies/new`, `/companies/:companyId`
Allow: `ctx.*`, `read.company.*`, `write.company.*`, `read.companyCanvas.*`, `write.companyCanvas.*`, `ai.company.*`, `read.events.*`, `write.events.*`

## Applications: CV

**Routes:** `/applications/cv`, `/applications/cv/new`, `/applications/cv/:id`, `/applications/cv/:id/print`
Allow: `ctx.*`, `read.cv.*`, `write.cv.*`, `ai.materials.* (generateCv)`, `ai.improveMaterial.*`, `read.profile.*`, `read.experience.*`, `read.story.*`, `read.events.*`, `write.events.*`

## Applications: Cover Letters

**Routes:** `/applications/cover-letters`, `/applications/cover-letters/new`, `/applications/cover-letters/:id`, `/applications/cover-letters/:id/print`
Allow: `ctx.*`, `read.coverLetter.*`, `write.coverLetter.*`, `read.profile.*`, `read.experience.*`, `read.story.*`, `ai.materials.* (generateCoverLetter)`, `ai.improveMaterial.*`, `read.events.*`, `write.events.*`

## Applications: Speech

**Routes:** `/applications/speech`, `/applications/speech/:id`
Allow: `ctx.*`, `read.speech.*`, `write.speech.*`, `read.profile.*`, `read.experience.*`, `read.story.*`, `ai.materials.* (generateSpeech)`, `read.events.*`, `write.events.*`

## Settings: CV

**Routes:** `/settings/cv`, `/settings/cv/:id`
Allow: `ctx.*`, `read.cvSettings.*`, `write.cvSettings.*`, `read.cvTemplate.*`, `write.cvTemplate.*`, `read.events.*`, `write.events.*`

---

# 2) Capability Catalog (V1)

## A) Context & Capability Discovery

### 1. `ctx.getScreenContext`

**Purpose:** Provide route/screen + entity refs + allowlist
**Input:** `{ route: string }`
**Output:** `ScreenContext`

### 2. `ctx.listAllowedCapabilities`

**Purpose:** Return only IDs + short descriptions for the current screen
**Input:** `{ screenContext: ScreenContext }`
**Output:** `{ capabilities: { id: string; title: string; kind: "read"|"write"|"ai" }[] }`

---

## B) Companion Memory & User Action History (new for C0/C13)

### 3. `mcp.events.listRecentUserEvents`

**Input:** `{ limit: number; types?: string[] }`
**Output:** `{ events: { type: string; entityRef?: EntityRef; at: string; meta: Record<string,unknown> }[] }`

### 4. `mcp.events.appendUserEvent`

**Input:** `{ type: string; entityRef?: EntityRef; meta?: Record<string,unknown> }`
**Output:** `{ eventId: string }`

### 5. `mcp.memory.getCompanionInsights`

**Input:** `{ limit: number }`
**Output:** `{ insights: { key: string; value: string; confidence: number; updatedAt: string }[] }`

### 6. `mcp.memory.upsertCompanionInsight`

**Input:** `{ key: string; value: string; confidence: number }`
**Output:** `{ insightId: string }`

(These align with your desire for short/long term memory + action history, without storing raw transcripts.)

---

## C) Read capabilities (grounding data)

### Profile / Identity (UserProfile, PersonalCanvas)

#### 7. `mcp.profile.getUserProfile`

**Input:** `{}`
**Output:** `{ userProfile: UserProfile }`

#### 8. `mcp.canvas.getPersonalCanvas`

**Input:** `{}`
**Output:** `{ personalCanvas: PersonalCanvas | null }`

### Experiences & Stories (Experience, STARStory)

#### 9. `mcp.experience.listExperiences`

**Input:** `{}`
**Output:** `{ experiences: Experience[] }`

#### 10. `mcp.experience.getExperience`

**Input:** `{ experienceId: string }`
**Output:** `{ experience: Experience }`

#### 11. `mcp.story.listStoriesForExperience`

**Input:** `{ experienceId: string }`
**Output:** `{ stories: STARStory[] }`

#### 12. `mcp.story.getStory`

**Input:** `{ storyId: string }`
**Output:** `{ story: STARStory }`

#### 13. `mcp.story.listAllStories`

**Input:** `{}`
**Output:** `{ stories: STARStory[] }`

### Jobs / Companies / Matching

#### 14. `mcp.job.listJobs`

**Input:** `{}`
**Output:** `{ jobs: JobDescription[] }`

#### 15. `mcp.job.getJob`

**Input:** `{ jobId: string }`
**Output:** `{ job: JobDescription }`

#### 16. `mcp.company.getCompany`

**Input:** `{ companyId: string }`
**Output:** `{ company: Company }`

#### 17. `mcp.companyCanvas.getCompanyCanvas`

**Input:** `{ companyId: string }`
**Output:** `{ companyCanvas: CompanyCanvas | null }`

#### 18. `mcp.matching.getMatchingSummary`

**Input:** `{ jobId: string }`
**Output:** `{ matchingSummary: MatchingSummary | null }`

### Materials (CVDocument, CoverLetter, SpeechBlock, templates/settings)

#### 19. `mcp.cv.getCvDocument`

**Input:** `{ cvId: string }`
**Output:** `{ cv: CVDocument }`

#### 20. `mcp.coverLetter.getCoverLetter`

**Input:** `{ coverLetterId: string }`
**Output:** `{ coverLetter: CoverLetter }`

#### 21. `mcp.speech.getSpeechBlock`

**Input:** `{ speechId: string }`
**Output:** `{ speech: SpeechBlock }`

#### 22. `mcp.cvSettings.getCvSettings`

**Input:** `{}`
**Output:** `{ cvSettings: CVSettings }`

#### 23. `mcp.cvTemplate.getCvTemplate`

**Input:** `{ templateId: string }`
**Output:** `{ template: CVTemplate }`

---

## D) Write capabilities (action mode)

### Profile writes

#### 24. `mcp.profile.updateUserProfile`

**Input:** `{ patch: Partial<UserProfile> }`
**Output:** `{ updated: true }`
**Rule:** patch only; must not clear fields unless explicitly set.

### Canvas writes

#### 25. `mcp.canvas.updatePersonalCanvasSection`

**Input:** `{ section: keyof PersonalCanvas; items: string[] }`
**Output:** `{ updated: true }`

#### 26. `mcp.canvas.setPersonalCanvasNeedsUpdate`

**Input:** `{ needsUpdate: boolean }`
**Output:** `{ updated: true }`

### Experience writes

#### 27. `mcp.experience.createExperience`

**Input:** `{ experience: Omit<Experience,"experienceId"> }`
**Output:** `{ experienceId: string }`

#### 28. `mcp.experience.updateExperience`

**Input:** `{ experienceId: string; patch: Partial<Experience> }`
**Output:** `{ updated: true }`

### Story writes

#### 29. `mcp.story.createStory`

**Input:** `{ experienceId: string; story: Omit<STARStory,"storyId"> }`
**Output:** `{ storyId: string }`

#### 30. `mcp.story.updateStory`

**Input:** `{ storyId: string; patch: Partial<STARStory> }`
**Output:** `{ updated: true }`

### Job / company writes

#### 31. `mcp.job.updateJob`

**Input:** `{ jobId: string; patch: Partial<JobDescription> }`
**Output:** `{ updated: true }`

#### 32. `mcp.job.linkCompanyToJob`

**Input:** `{ jobId: string; companyId: string }`
**Output:** `{ updated: true }`

#### 33. `mcp.company.updateCompany`

**Input:** `{ companyId: string; patch: Partial<Company> }`
**Output:** `{ updated: true }`

#### 34. `mcp.companyCanvas.updateCompanyCanvasBlock`

**Input:** `{ companyId: string; block: keyof CompanyCanvas; items: string[] }`
**Output:** `{ updated: true }`

### Materials writes

#### 35. `mcp.cv.updateCvDocumentContent`

**Input:** `{ cvId: string; content: string }`
**Output:** `{ updated: true }`

#### 36. `mcp.coverLetter.updateCoverLetterContent`

**Input:** `{ coverLetterId: string; content: string }`
**Output:** `{ updated: true }`

#### 37. `mcp.speech.updateSpeechBlockSection`

**Input:** `{ speechId: string; patch: Partial<SpeechBlock> }`
**Output:** `{ updated: true }`

### CV settings/templates

#### 38. `mcp.cvSettings.updateCvSettings`

**Input:** `{ patch: Partial<CVSettings> }`
**Output:** `{ updated: true }`

#### 39. `mcp.cvTemplate.updateCvTemplate`

**Input:** `{ templateId: string; patch: Partial<CVTemplate> }`
**Output:** `{ updated: true }`

---

## E) AI Invocation capabilities (wrapping existing AI Operations)

These are “tools” the agent can request; internally they call your existing AI ops list.

### CV upload parsing

#### 40. `ai.cvParse.parseCvText`

Calls: `ai.parseCvText`
**Input:** `{ cvText: string }`
**Output:** `{ profile: ..., experienceItems: ..., rawBlocks: ... }`

#### 41. `ai.cvParse.extractExperienceBlocks`

Calls: `ai.extractExperienceBlocks`
**Input:** `{ language: string; experienceItems: {experienceType; rawBlock}[] }`
**Output:** `{ experiences: Experience[] }`

### Stories

#### 42. `ai.story.generateStarStory`

Calls: `ai.generateStarStory`
**Input:** `{ sourceText: string }`
**Output:** `{ stories: STARStory[] }`

#### 43. `ai.story.generateAchievementsAndKpis`

Calls: `ai.generateAchievementsAndKpis`
**Input:** `{ starStory: { situation; task; action; result } }`
**Output:** `{ achievements: string[]; kpiSuggestions: string[] }`

### Personal canvas

#### 44. `ai.canvas.generatePersonalCanvas`

Calls: `ai.generatePersonalCanvas`
**Input:** `{ profile: UserProfile; experiences: Experience[]; stories: STARStory[] }`
**Output:** `{ personalCanvas: PersonalCanvas }`

### Job & company

#### 45. `ai.job.parseJobDescription`

Calls: `ai.parseJobDescription`
**Input:** `{ rawText: string }`
**Output:** `{ job: JobDescription }`

#### 46. `ai.company.analyzeCompany`

Calls: `ai.analyzeCompany` / `ai.analyzeCompanyInfo` (ensure naming is consistent in codebase)  
**Input:** `{ companyName?: string; industry?: string; size?: string; rawText: string; jobContext?: {...} }`
**Output:** `{ companyProfile: Company }`

#### 47. `ai.company.generateCompanyCanvas`

Calls: `ai.generateCompanyCanvas`
**Input:** `{ companyProfile: Company; additionalNotes: string[] }`
**Output:** `{ companyCanvas: CompanyCanvas }`

### Matching

#### 48. `ai.matching.generateMatchingSummary`

Calls: `ai.generateMatchingSummary`
**Input:** `{ profile: UserProfile; experiences: Experience[]; stories?: STARStory[]; personalCanvas?: PersonalCanvas; jobDescription?: JobDescription; company?: Company }`
**Output:** `{ matchingSummary: MatchingSummary }`

### Materials generation

#### 49. `ai.materials.generateCv`

Calls: `ai.generateCv`
**Input:** `{ profile; experiences; stories; templateMarkdown; jobContext? }`
**Output:** `{ content: string /* markdown */ }`

#### 50. `ai.materials.generateCoverLetter`

Calls: `ai.generateCoverLetter`
**Input:** `{ profile; personalCanvas?; job?; company?; matchingSummary?; tone? }`
**Output:** `{ content: string /* markdown */ }`

#### 51. `ai.materials.generateSpeech`

Calls: `ai.generateSpeech`
**Input:** `{ profile; stories?; job?; tone? }`
**Output:** `{ speechBlock: SpeechBlock }`

### Material improvement (C3)

#### 52. `ai.materials.improveMaterial`

Calls: `ai.improveMaterial`
**Input:** `{ materialType: "cv"|"coverLetter"; content: string; preset: string; note?: string; jobContext?: ... }`
**Output:** `{ improvedContent: string /* markdown */; feedback?: {...} }`

### Application strength gate (A2)

#### 53. `ai.appStrength.evaluateApplicationStrength`

Calls: `ai.evaluateApplicationStrength`
**Input:** `{ job: JobDescription; cv?: CVDocument; coverLetter?: CoverLetter }`
**Output:** `{ overallScore: number; breakdown: ...; decisionLabel: ...; topImprovements: string[] }`

---

# 3) “One task at a time” enforcement (how the catalog supports it)

To keep the companion calm + non-overwhelming:

- `ai.careerCompanionTurn` (the new op you’ll add) must output **0–1 proposedAction**, and that action must be one of the **write** or **ai** capabilities above.
- The UI shows a single proposal card, user confirms, then it calls exactly one capability (e.g., `mcp.story.updateStory`).

This matches your rule: _one task at a time, always grounded in data, can ask clarifying questions._
