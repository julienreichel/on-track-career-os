# CONCEPTUAL DATA MODEL (CDM)

**Version 1 — MVP Foundations + V1/V2 Extensions**

---

# 1. PRIMARY ENTITY CLUSTERS

The platform contains **five major data domains**:

1. **User Identity Domain**
2. **Experience & Story Domain**
3. **Job & Company Domain**
4. **Application Materials Domain**
5. **Interview Domain**

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
- companyName
- customerSegments (list)
- valuePropositions (list)
- channels (list)
- customerRelationships (list)
- revenueStreams (list)
- keyResources (list)
- keyActivities (list)
- keyPartners (list)
- costStructure (list)
- sourceOperation
- lastGeneratedAt
- needsUpdate (boolean)

**Relationships:**

- 1 CompanyCanvas → 1 Company
- 1 CompanyCanvas is produced/refreshed by `ai.generateCompanyCanvas`

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

- cvId
- name
- templateId
- isTailored (boolean)
- contentJSON (block-structured document)

**Relationships:**

- 1 CVDocument → \* ExperienceBlocks (references)
- 1 UserProfile → \* CVDocuments
- 1 JobDescription → 1 CVDocument (optional per job)

---

## **ENTITY: CoverLetter**

_(EPIC 6)_

**Attributes:**

- letterId
- tone
- content

**Relationships:**

- 1 CoverLetter → 1 UserProfile
- 1 CoverLetter → 1 JobDescription

---

## **ENTITY: SpeechBlock**

_(EPIC 4)_

**Attributes:**

- speechId
- elevatorPitch
- careerStory
- whyMe

**Relationships:**

- 1 SpeechBlock → 1 UserProfile
- 1 SpeechBlock → 1 JobDescription (tailored)

---

## **ENTITY: KPISet**

_(EPIC 6)_

**Attributes:**

- kpiId
- kpiList
- justificationList

**Relationships:**

- 1 KPISet → 1 JobDescription
- 1 KPISet → 1 MatchingSummary

---

# 6. INTERVIEW DOMAIN

## **ENTITY: InterviewQuestionSet**

_(EPIC 7)_

**Attributes:**

- setId
- behavioralQuestions
- technicalQuestions
- culturalQuestions
- painBasedQuestions

**Relationships:**

- 1 QuestionSet → 1 JobDescription
- 1 QuestionSet → \* STARStories (linked)

---

## **ENTITY: InterviewSession**

_(EPIC 9)_

**Attributes:**

- sessionId
- transcript
- scores (clarity, structure, relevance)
- feedback
- createdAt

**Relationships:**

- 1 InterviewSession → 1 UserProfile
- 1 InterviewSession → 1 JobDescription

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

JobDescription ↔ (CV / CoverLetter / Speech / KPISet)
1 ↔ 1 (tailored)

InterviewSession ↔ (UserProfile / JobDescription)
multiple sessions permitted
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

### **InterviewSession**

- Read-only after generation
