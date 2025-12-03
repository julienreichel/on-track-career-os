# ✅ MASTER PROMPT 1

# **Implement CV Upload → Text Extraction → Experience Segmentation**

### **Context**

This prompt covers the full flow from uploading a CV to generating structured experience blocks. This is the first and most critical intake step. Backend AI operations already exist (`ai.parseCvText`, `ai.extractExperienceBlocks`) .
The goal is to create the UI pages, components, composables, and tests for this part of EPIC 1A.

---

### **Components & Composables**

According to _Component–Page Mapping_ and _Architecture_:

- **Components**:
  - `ProfileForm.vue` (already planned)
  - `ExperienceList.vue`
  - `ExperienceForm.vue`
  - `CvUploadDropzone.vue` (new minimal component)
    — based on `<UDropzone>` from Nuxt UI

- **Composables**:
  - `useUserProfile()`
  - `useExperienceStore()`
  - `useAiClient()`

- **Repositories/services** (already existing for Experience + UserProfile)
- **AI Operations**:
  - `ai.parseCvText`
  - `ai.extractExperienceBlocks`

---

### **Pages to Implement**

From Navigation spec :

1. `/profile/cv-upload`
2. `/profile/experiences`
3. `/profile/experiences/[id].vue`

Keep minimal UI for MVP: form → preview → save.

---

### **Implementation Instructions**

1. In `/profile/cv-upload`:
   - Use `<UDropzone>` to upload a PDF.
   - Extract text locally using the browser’s built-in FileReader.
   - Send extracted text to `useAiClient().parseCvText()`.
   - Display parsed sections (rawBlocks, experiences).
   - Let user confirm & import.

2. When user confirms:
   - Send `sections.experiences` to `ai.extractExperienceBlocks`.
   - For each returned experience block, create an `Experience` in DB via `experienceRepository`.

3. Redirect to `/profile/experiences`.

4. In `/profile/experiences`:
   - Show `<UTable>` listing all experiences.
   - Actions: Edit, Delete.

5. In `/profile/experiences/[id]`:
   - Render `ExperienceForm.vue`
   - Let user edit responsibilities, tasks, dates.

---

### **Testing Instructions**

- **Unit tests** (Vitest):
  - ExperienceStore receives blocks and creates domain objects.
  - AiClient mocks return expected structured JSON.

- **Component tests**:
  - Dropzone triggers file load → render parsed preview.
  - Save button persists data then redirects.

- **E2E tests** (Playwright):
  - Upload sample CV → experiences page shows items.

---

### **Acceptance Criteria**

- User can upload a CV.
- AI extracts structured text sections without error.
- Experiences are created in DB as draft experiences.
- User can view and edit extracted experiences.
- Error states shown if AI output schema is invalid.
- The entire flow respects DRY & YAGNI (minimal UI, no fancy features).
- Covered by unit, component, and E2E tests.

---

# ✅ MASTER PROMPT 2

# **Implement Manual Experience Creation & Editing**

### **Context**

Some users won’t upload a CV or will want to manually add or correct experiences. This builds on the existing Experience domain layer (repositories/services/composables) which is already implemented and tested in backend .

---

### **Components & Composables**

- `ExperienceList.vue`
- `ExperienceForm.vue`
- `useExperienceStore()`
- `useAiClient()` (optional for generating achievements later)

---

### **Pages to Implement**

- `/profile/experiences/new`
- `/profile/experiences/[id]`

Use simple form-based layout based on `<UForm>` + `<UFormGroup>` .

---

### **Implementation Instructions**

1. Create a minimal ExperienceForm component:
   - Title
   - Company
   - Start/end dates
   - Responsibilities (textarea)
   - Tasks (textarea)

2. On Save:
   - Call `experienceRepository.save()`.

3. On Edit:
   - Load by ID
   - Populate form
   - Update experience
   - Mark experience as `complete` when user finishes editing.

4. Keep no extra fields in MVP (YAGNI).

---

### **Testing Instructions**

- Unit tests for ExperienceRepository already exist; verify happy/edge cases.
- Component tests:
  - Filling form creates correct GraphQL mutation payload.
  - Editing persists modified fields.

- E2E tests:
  - Create experience → appears in list.

---

### **Acceptance Criteria**

- User can create and edit an experience fully manually.
- All fields reflect the Experience CDM model .
- No unused fields or extra features.
- Validated inputs.
- Tests implemented at unit, component, E2E levels.

---

# ✅ MASTER PROMPT 3

# **Implement Capture of Aspirations, Professional Goals, Values, Strengths, Weaknesses**

### **Context**

This part populates the UserProfile entity (goals, aspirations, personalValues, strengths, weaknesses) defined in the CDM .
This is a simple structured form with zero AI operations (by design = YAGNI).
It is required to generate the Personal Canvas later.

---

### **Components & Composables**

- `ProfileForm.vue`
- `useUserProfile()`

---

### **Pages to Implement**

- `/profile` (Profile Overview)

---

### **Implementation Instructions**

1. Create ProfileForm with fields:
   - Goals (textarea or array input)
   - Aspirations
   - Personal Values (list)
   - Strengths (list)
   - Weaknesses (list)

2. Use `<UFormGroup>` with simple list editors; do **not** build sophisticated tag editors (MVP).

3. Use `userProfileRepository.updateUserProfile()` on submit.

4. After saving, redirect back to `/profile`.

---

### **Testing Instructions**

- Unit test composable: updateProfile merges fields properly.
- Component tests validate:
  - Rendering fields with existing values.
  - Saving persists to DB.

- E2E test:
  - Fill out profile → reload page → values persist.

---

### **Acceptance Criteria**

- Users can edit all EPIC 1A identity attributes.
- Data is saved correctly in GraphQL.
- No AI calls required.
- Minimal UI, no extra features.

---

# ✅ MASTER PROMPT 4

# **Implement Experience → Story Linking Preparation (but not STAR builder)**

### **Context**

EPIC 1A ends where structured experiences and user identity are collected.
STAR stories belong to **EPIC 2**, but we must prepare linking from experience → story.

This prompt implements the **linking capability only** (no STAR generation).

---

### **Components & Composables**

- ExperienceList.vue (add “Add Story” button)
- useExperienceStore()

---

### **Pages**

- No new pages.
- Only add navigation entry to `/stories/new` (EPIC 2) but not implemented here.

---

### **Implementation Instructions**

1. On ExperienceList.vue:
   - Add “Add Story” CTA next to each experience.
   - CTA routes to `/stories/new?experienceId=id`.
   - Do not implement story creation logic here.

2. Mark experience status to reflect whether it has linked stories (optional boolean in UI — but not required by MVP → follow YAGNI).

---

### **Testing Instructions**

- Component tests: Clicking link leads to correct route.

---

### **Acceptance Criteria**

- Users see a button to add stories later.
- No story logic implemented here.
- Stays within strict scope of EPIC 1A.

---

# ✅ MASTER PROMPT 5

# **Implement First-Time Onboarding Wizard**

### **Context**

This wizard supports the user’s first contact with EPIC 1A and is documented in Navigation + Component mapping .
It must be minimal, guiding the user through:

1. Upload CV or skip
2. Enter values/goals
3. Quick tour of features

---

### **Components & Composables**

- `<USteps>`, `<UCard>` (Nuxt UI)
- ProfileForm (reused)
- CvUploadDropzone
- useUserProfile()
- useExperienceStore()

---

### **Pages**

- `/onboarding/index.vue`
- `/onboarding/step-[1..3].vue` (or a single multi-step component)

---

### **Implementation Instructions**

Step 1: Upload CV

- Same logic as master prompt 1
- Offer “Skip” button

Step 2: Identity Intake

- Embed 3–5 key fields from ProfileForm:
  - Goals
  - Aspirations
  - Values

Step 3: Summary

- Show what’s done
- CTA: “Go to Dashboard”

---

### **Testing Instructions**

- Component tests:
  - Steps change correctly.
  - Skipping CV still allows completion.
  - Each step validates required minimal fields.

- E2E:
  - Full onboarding flow.

---

### **Acceptance Criteria**

- User can complete onboarding in <2 minutes.
- CV upload optional.
- Values/goals captured.
- After step 3, user lands on Dashboard.
- Clear “You’re ready to start” feeling.

---

# ✅ Final Notes

All 5 master prompts above:

- Fully aligned with EPIC 1A
- Fully aligned with your architecture, components, composables, CDM, and current project status
- Use existing backend implementations where available
- Avoid overbuilding (YAGNI)
- Avoid duplicate logic (DRY)
- Include implementation + test + acceptance criteria
- Prepare the platform for EPIC 1B and EPIC 2
