# CONCEPTUAL DATA MODEL (CDM)

**Version 1 — MVP Foundations + V1/V2 Extensions**

---

# 1. PRIMARY ENTITY CLUSTERS

The platform contains **five major data domains**:

1. **User Identity Domain**
2. **Experience & Story Domain**
3. **Job & Company Domain**
4. **Application Materials Domain**
5. **Feedback & Learning Domain** _(New - V1 Enhancement)_

Each domain and its entities are described below.

---

# 2. USER IDENTITY DOMAIN

## **ENTITY: UserProfile**

Represents the core identity of the user.

**Attributes:**

- userId (PK)
- fullName
- headline
- location
- seniorityLevel
- goals
- aspirations
- personalValues (list)
- strengths (list)
- interests (list)
- skills (list)
- certifications (list)
- languages (list)
- createdAt
- updatedAt

**Relationships:**

- 1 UserProfile → \* Experiences
- 1 UserProfile → 1 PersonalCanvas
- 1 UserProfile → \* JobsAppliedTo
- 1 UserProfile → \* CoverLetters / CVs

---

## **ENTITY: PersonalCanvas**

_(EPIC 1B)_

**Attributes:**

- canvasId
- valueProposition
- keyActivities
- strengthsAdvantage
- targetRoles
- channels
- resources
- careerDirection
- painRelievers
- gainCreators
- lastGeneratedAt
- needsUpdate (boolean)

**Relationships:**

- 1 PersonalCanvas → 1 UserProfile

**Notes:**
Regenerated on demand. Editable by user.

---

## **ENTITY: CommunicationProfile**

_(V1 — EPIC 8)_

**Attributes:**

- profileId
- communicationStyle
- workStyle
- blindSpots
- recommendedTone

**Relationships:**

- 1 UserProfile → 1 CommunicationProfile

---

# 3. EXPERIENCE & STORY DOMAIN

## **ENTITY: Experience**

_(EPIC 1A)_

**Attributes:**

- experienceId
- title
- companyName
- startDate, endDate
- responsibilities (list)
- tasks (list)
- rawText (from CV)
- status (draft / complete)

**Relationships:**

- 1 Experience → \* STARStories
- 1 UserProfile → \* Experiences

---

## **ENTITY: STARStory**

_(EPIC 2)_

**Attributes:**

- storyId
- situation
- task
- action
- result
- achievements (AI-generated)
- kpiSuggestions (list)

**Relationships:**

- 1 STARStory → 1 Experience
- 1 STARStory → \* ApplicationMaterials (optional reuse)

---

# 4. JOB & COMPANY DOMAIN

Domain for **job analysis, company modeling, and matching**.

---

## **ENTITY: JobDescription**

_(EPIC 5A)_

**Attributes:**

- jobId
- rawText
- title
- seniorityLevel
- responsibilities
- requiredSkills
- behaviours
- successCriteria
- explicitPains
- status (draft / analyzed / complete)

**Relationships:**

- 1 Company → \* Jobs (optional)

---

## **ENTITY: Company**

_(EPIC 5B)_

**Attributes:**

- companyId
- companyName
- industry
- sizeRange
- website
- productsServices (list)
- targetMarkets (list)
- customerSegments (list)
- description
- rawNotes (long text from uploads)
- createdAt / updatedAt

**Relationships:**

- 1 Company → 1 CompanyCanvas
- 1 Company → \* Jobs
- 1 Company ← `ai.analyzeCompanyInfo` result populates/update fields

---

## **ENTITY: CompanyCanvas**

_(EPIC 5B)_

**Attributes:**

- canvasId
- companyId (FK)
- customerSegments (list)
- valuePropositions (list)
- channels (list)
- customerRelationships (list)
- revenueStreams (list)
- keyResources (list)
- keyActivities (list)
- keyPartners (list)
- costStructure (list)
- summary
- lastUpdatedAt

**Relationships:**

- 1 CompanyCanvas → 1 Company
- 1 CompanyCanvas is produced/refreshed by `ai.generateCompanyCanvas`

**Note:** Follows Business Model Canvas structure with 9 canonical blocks

---

## **ENTITY: MatchingSummary**

_(EPIC 5C)_

**Attributes:**

- matchId
- userFitScore (V2)
- impactAreas
- contributionMap
- riskMitigationPoints
- summaryParagraph

**Relationships:**

- 1 MatchingSummary → 1 UserProfile
- 1 MatchingSummary → 1 JobDescription
- 1 MatchingSummary → 1 Company

---

# 5. APPLICATION MATERIALS DOMAIN

Domain representing all generated or edited user-facing deliverables.

---

## **ENTITY: CVDocument**

_(EPIC 3 + EPIC 6)_

**Attributes:**

- id
- name (optional)
- templateId (optional; user template used as exemplar)
- isTailored (boolean, optional; indicates job context was used)
- content (string, Markdown)
- showProfilePhoto (boolean)
- jobId (optional)

**Relationships:**

- 1 CVDocument → 1 UserProfile
- 1 CVDocument → 1 JobDescription (optional)

---

## **ENTITY: CoverLetter**

_(EPIC 4B - ✅ Implemented)_

**Attributes:**

- id
- name (optional title/identifier)
- tone (optional)
- content (string)
- jobId (optional)

**Relationships:**

- 1 CoverLetter → 1 UserProfile
- 1 CoverLetter → 1 JobDescription (optional)

---

## **ENTITY: SpeechBlock**

_(EPIC 4)_

**Attributes:**

- id
- name (optional)
- elevatorPitch
- careerStory
- whyMe
- jobId (optional)

**Relationships:**

- 1 SpeechBlock → 1 UserProfile
- 1 SpeechBlock → 1 JobDescription (optional)

---

## **ENTITY: CVTemplate** _(EPIC 3C)_

**Attributes:**

- templateId
- userId (owner)
- name
- content (string, Markdown)
- source (enum/string: system:classic | system:modern | system:competency | user)
- createdAt
- updatedAt

**Relationships:**

- 1 UserProfile → \* CVTemplates
- 1 CVDocument → 0..1 CVTemplate (via templateId)
- (Optional) 1 CVSettings → 0..1 CVTemplate as default

**Notes:**
System exemplars can live in code; `source` preserves origin while storing only user-instantiated/custom templates.

---

## **ENTITY: CVSettings** _(EPIC 3C)_

**Attributes:**

- userId (PK or unique FK)
- defaultTemplateId (optional)
- askEachTime (boolean)
- defaultIncludedExperienceIds (list)
- defaultEnabledSections (list)
- showProfilePhoto (boolean, optional)
- createdAt
- updatedAt

**Relationships:**

- 1 UserProfile → 0..1 CVSettings

---

# 6. FEEDBACK & LEARNING DOMAIN

**Purpose:** Collect lightweight signals to improve AI recommendations and user experience without compromising privacy.

---

## **ENTITY: AIFeedback**

Captures user validation of AI-generated content to improve future recommendations.

**Attributes:**

- feedbackId (PK)
- userId (FK to UserProfile)
- aiOperationType (enum: personalCanvas, starStory, jobAnalysis, companyCanvas, matchingSummary, cvGeneration, coverLetterGeneration, speechGeneration)
- sourceEntityId (references the entity that was AI-generated)
- feedbackType (enum: thumbsUp, thumbsDown, edit, regenerate)
- userSatisfaction (1-5 scale, optional)
- specificIssue (enum: inaccurate, irrelevant, toneIncorrect, missingInfo, tooGeneric, other, optional)
- userComment (optional, max 500 chars)
- createdAt

**Relationships:**

- N AIFeedback → 1 UserProfile
- AIFeedback references any AI-generated entity via sourceEntityId

**Intent:**

- Enable users to quickly signal satisfaction/dissatisfaction with AI outputs
- Collect patterns to improve prompts and AI operations
- Non-invasive: appears as simple thumbs up/down with optional details
- Privacy-first: no content stored, only satisfaction signals and issue categories

---

## **ENTITY: UsageSignal** _(Optional)_

Aggregated, privacy-preserving usage patterns to understand user behavior.

**Attributes:**

- signalId (PK)
- userId (FK to UserProfile, hashed/anonymized)
- eventType (enum: profileCompleted, storyCreated, jobAnalyzed, cvGenerated, coverLetterGenerated, speechBuilt, materialExported)
- contextMetadata (JSON: {seniorityLevel, industry, featureUsed} - no PII)
- timestamp
- sessionId (optional, for flow analysis)

**Relationships:**

- N UsageSignal → 1 UserProfile (via anonymized userId)

**Intent:**

- Understand which features drive value
- Identify drop-off points in user journeys
- Measure feature adoption and success patterns
- Guide product development priorities
- All data aggregated and anonymized - no personal content stored

**Privacy Safeguards:**

- No personal information stored
- UserIds are hashed/anonymized
- Only behavioral patterns tracked, not content
- Aggregated analysis only
- User opt-out available

---

# 7. RELATIONSHIP SUMMARY

```
UserProfile ↔ Experiences
1 ↔ *

Experience ↔ STARStories
1 ↔ *

UserProfile ↔ PersonalCanvas
1 ↔ 1

UserProfile ↔ CommunicationProfile
1 ↔ 1

Company ↔ CompanyCanvas
1 ↔ 1

Company ↔ Jobs
1 ↔ *

MatchingSummary ↔ (User, Job, Company)
1 match per unique combination

JobDescription ↔ (CV / CoverLetter / Speech)
1 ↔ 0..* (optional tailoring)

UserProfile ↔ AIFeedback
1 ↔ * (user can provide feedback on multiple AI outputs)

UserProfile ↔ UsageSignal
1 ↔ * (user generates multiple usage signals over time)
```

---

# 8. ENTITY LIFECYCLE NOTES

### **Experience**

- Created via CV parsing or manual entry
- Draft → Complete
- Linked/unlinked to STAR stories

### **PersonalCanvas**

- Auto-generated
- User editable
- Marked _needsUpdate_ when profile changes

### **JobDescription**

- Draft → Analyzed → Complete
- Can be linked to Company

### **MatchingSummary**

- Updated when User, Job, or Company changes

### **Application Documents**

- Created → Edited → Exported
- (V2) Versioning planned

### **AIFeedback**

- Created when user provides feedback on AI-generated content
- Immutable once created (for data integrity)
- Used for AI improvement and user experience optimization
- Optional - users can skip feedback without impacting workflow

### **UsageSignal**

- Created automatically during user interactions (with consent)
- Aggregated for analytics - individual signals not analyzed
- Anonymized and privacy-preserving by design
- Used for product improvement and feature prioritization
