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
