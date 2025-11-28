# COMPONENT → PAGE MAPPING (MVP → V1)

**Complete mapping of:**

* UI Pages
* Frontend Components
* Composables
* CDM Entities
* AI Operations

Each page includes:

* UI Components (Nuxt UI)
* Frontend Components
* Composables (state + logic)
* CDM Entities created/updated
* AI Operations triggered on that page

---

# 0. AUTH & ONBOARDING

---

## **0.1 Login / Signup Page**

### UI

* `<UCard>`

### Components

* Auth UI component

### Composables

* None

### CDM Entities

* **UserProfile** (created empty)

### AI Ops

* None

---

## **0.2 First-Time Onboarding Wizard**

### UI

* `<USteps>`
* `<UCard>`
* `<UForm>`

### Components

* User Profile Manager (initialization)

### Composables

* `useUserProfile()`

### CDM

* UserProfile (goals, values)
* Experience (later in onboarding)

### AI

* Optional: `ai.parseCvText`

---

# 1. DASHBOARD

---

## **1.1 Dashboard Page**

### UI

* `<UGrid>`
* `<UCard>`

### Components

* Dashboard Overview Component

### Composables

* `useUserProfile()`
* `useExperienceStore()`
* `useJobAnalysis()`
* `useTailoringEngine()`

### CDM Entities

* UserProfile
* Experiences
* JobDescription
* CVDocument (drafts)

### AI Ops

* None (display-only)

---

# 2. MY PROFILE

---

## **2.1 Profile Overview**

### UI

* `<UCard>`
* `<UFormGroup>`

### Components

* User Profile Manager

### Composables

* `useUserProfile()`

### CDM

* UserProfile

### AI Ops

* None

---

## **2.2 Experience List**

### UI

* `<UTable>`

### Components

* Experience List Component

### Composables

* `useExperienceStore()`

### CDM

* Experience[]

### AI

* None

---

## **2.3 Experience Editor**

### UI

* `<UForm>`
* `<UTextarea>`
* `<UButton>`

### Components

* Experience Intake Component

### Composables

* `useExperienceStore()`

### CDM

* Experience

### AI Ops

* `ai.extractExperienceBlocks` (if imported)
* `ai.generateAchievementsAndKpis` (button-triggered)

---

## **2.4 STAR Story Builder**

### UI

* Custom `<UChat>`
* `<UModal>` (suggestions)

### Components

* Story Builder Component

### Composables

* `useStoryEngine()`

### CDM

* STARStory
* Achievements
* KPI Suggestions

### AI Ops

* `ai.generateStarStory`
* `ai.generateAchievementsAndKpis`

---

## **2.5 Personal Business Model Canvas**

### UI

* `<UDraggable>`
* `<UCard>`
* `<UContainer>`

### Components

* Personal Canvas Component

### Composables

* `useCanvasEngine()`
* `useUserProfile()`

### CDM

* PersonalCanvas

### AI Ops

* `ai.generatePersonalCanvas`

---

## **2.6 Strengths & Communication Profile (V1)**

### UI

* `<UCard>`

### Components

* Communication Profile Module

### Composables

* `useUserProfile()`

### CDM

* CommunicationProfile

### AI Ops

* Future (tone, psychology inference)

---

# 3. JOBS & COMPANIES

---

## **3.1 Job List**

### UI

* `<UTable>`

### Components

* Job List Component

### Composables

* `useJobAnalysis()`

### CDM

* JobDescription[]

### AI

* None

---

## **3.2 Add Job Description**

### UI

* `<UTextarea>`
* `<UButton>`

### Components

* Job Intake Component

### Composables

* `useJobAnalysis()`

### CDM

* JobDescription (raw text)

### AI Ops

* `ai.parseJobDescription`

---

## **3.3 Job Role Card**

### UI

* `<UTabs>`
* `<UCard>`

### Components

* Job Role Card Component

### Composables

* `useJobAnalysis()`

### CDM

* JobRoleCard

### AI Ops

* `ai.generateJobRoleCard`

---

## **3.4 Company List**

### UI

* `<UTable>`

### Components

* Company List Component

### Composables

* `useCanvasEngine()`

### CDM

* Company[]

### AI

* None

---

## **3.5 Add Company Info**

### UI

* `<UForm>`
* `<UTextarea>`

### Components

* Company Intake Component

### Composables

* `useCanvasEngine()`

### CDM

* Company

### AI Ops

* `ai.analyzeCompanyInfo`

---

## **3.6 Company Business Model Canvas**

### UI

* `<UDraggable>`
* `<UCard>`

### Components

* Company Canvas Component

### Composables

* `useCanvasEngine()`

### CDM

* CompanyCanvas

### AI Ops

* `ai.generateCompanyCanvas`

---

# 4. MATCHING

---

## **4.1 Matching Summary (User ↔ Job ↔ Company)**

### UI

* `<UCard>`
* `<UAlert>`
* `<UBadge>`

### Components

* Matching Engine Component

### Composables

* `useMatchingEngine()`
* `useUserProfile()`
* `useExperienceStore()`
* `useCanvasEngine()`
* `useJobAnalysis()`

### CDM

* MatchingSummary

### AI Ops

* `ai.generateMatchingSummary`

---

# 5. APPLICATION MATERIALS

---

## **5.1 CV Builder**

### UI

* `<UEditor>`
* `<USelect>`
* `<UGrid>`

### Components

* CV Builder Component

### Composables

* `useTailoringEngine()`
* `useUserProfile()`
* `useExperienceStore()`

### CDM

* CVDocument

### AI Ops

* `ai.generateTailoredCvBlocks` (tailored mode)

---

## **5.2 Cover Letter Builder**

### UI

* `<URadioGroup>`
* `<UEditor>`

### Components

* Cover Letter Generator Component

### Composables

* `useTailoringEngine()`
* `useStoryEngine()`
* `useCanvasEngine()`
* `useJobAnalysis()`

### CDM

* CoverLetter

### AI Ops

* `ai.generateCoverLetter`

---

## **5.3 Speech Builder**

### UI

* `<UTextarea>`
* `<USteps>`

### Components

* Speech Builder Component

### Composables

* `useTailoringEngine()`

### CDM

* SpeechBlock

### AI Ops

* `ai.generateTailoredSpeech`

---

## **5.4 KPI Generator**

### UI

* `<UCard>`
* `<UBadge>`

### Components

* KPI Proposition Component

### Composables

* `useTailoringEngine()`

### CDM

* KPISet

### AI Ops

* `ai.generateTailoredKpis`

---

# 6. INTERVIEW PREP

---

## **6.1 Interview Questions Generator**

### UI

* `<UAccordion>`
* `<UCard>`

### Components

* Interview Questions Component

### Composables

* `useInterviewEngine()`
* `useStoryEngine()`

### CDM

* InterviewQuestionSet

### AI Ops

* `ai.generateInterviewQuestions`

---

## **6.2 Interview Simulator (Text) — V1**

### UI

* Custom `<ChatPane>`
* `<UProgress>`

### Components

* Interview Simulation Component

### Composables

* `useInterviewEngine()`

### CDM

* InterviewSession

### AI Ops

* `ai.simulateInterviewTurn`
* `ai.evaluateInterviewAnswer`

---

# 7. SYSTEM UTILITY PAGES

---

## **7.1 Template Library**

### UI

* `<UCard>`

### Components

* Template Library Component

### Composables

* `useTailoringEngine()`

### CDM

* None (static)

### AI

* None

---

## **7.2 Settings**

### UI

* `<UForm>`

### Components

* Settings Component

### Composables

* `useUserProfile()`

### CDM

* UserProfile (updates)

### AI Ops

* None

---

# 8. COMPONENT → PAGE SUMMARY TABLE

```
Page                Component(s)           Composables               CDM Entity            AI Ops
---------------------------------------------------------------------------------------------------------
Profile Overview    User Profile Manager   useUserProfile            UserProfile           -
Experience Editor   Experience Intake      useExperienceStore        Experience            extractExperienceBlocks,
                                                                                            generateAchievements
STAR Builder        Story Builder          useStoryEngine            STARStory             generateStarStory,
                                                                                            generateAchievements
Personal Canvas     Canvas Component       useCanvasEngine           PersonalCanvas        generatePersonalCanvas
Add Job             Job Intake             useJobAnalysis            JobDescription        parseJobDescription
Job Role Card       Job Role Card          useJobAnalysis            JobRoleCard           generateJobRoleCard
Add Company         Company Intake         useCanvasEngine           Company               analyzeCompanyInfo
Company Canvas      Company Canvas         useCanvasEngine           CompanyCanvas         generateCompanyCanvas
Matching            Matching Engine        useMatchingEngine         MatchingSummary       generateMatchingSummary
CV Builder          CV Builder             useTailoringEngine        CVDocument            generateTailoredCvBlocks
Letter Builder      Letter Generator       useTailoringEngine        CoverLetter           generateCoverLetter
Speech Builder      Speech Generator       useTailoringEngine        SpeechBlock           generateTailoredSpeech
KPI Generator       KPI Component          useTailoringEngine        KPISet                generateTailoredKpis
Q&A Generator       Interview Q Generator  useInterviewEngine        InterviewQuestionSet  generateInterviewQuestions
Interview Sim       Interview Simulator    useInterviewEngine        InterviewSession      simulateInterviewTurn,
                                                                                            evaluateInterviewAnswer
```
