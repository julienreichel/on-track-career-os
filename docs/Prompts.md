## **Prompt 1 — Update UserProfile Data Model + Repository**

### **Purpose**

Extend the `UserProfile` schema to support new CV header fields while analysing the existing codebase first to match naming, patterns, authorizations, model separation and index structures.

### **Components / Composables (Create/Update)**

- Update UserProfile Model:
  - `profilePhotoKey`
  - `socialLinks[]` (label + url + includeInCv flag)
  - `primaryPhone` + boolean
  - `primaryEmail` + boolean
  - `workPermitInfo` + boolean

- Update repositories/services:
  - `UserProfileRepository`
  - `useUserProfile` composable

### **Pages to Modify**

- `/profile` → add sections for:
  - Photo upload
  - Social links editor
  - Contact inputs
  - Work permit input + toggles

### **Tests**

- Update userProfile model test snapshot
- Add validation tests on new fields
- Add persistence tests

### **Acceptance Criteria**

- New data persists into database
- Fields follow existing naming/validation conventions
- Profile load/save continues working
- No breaking changes to existing CVs

---

## **Prompt 2 — Implement Photo Upload with Amplify Storage**

### **Purpose**

Add a secure S3 photo upload pipeline to UserProfile, matching the existing storage conventions and IAM rules.

### **Components / Composables**

- `storage` configuration setup (Amplify)
- Photo upload helper
- Model storing S3 key
- Resolver for signed URL retrieval

### **Pages to Modify**

- `/profile`:
  - Upload button + validation UI
  - Display avatar preview

### **Tests**

- Mock upload unit test
- Permission failure test
- UI validation test

### **Acceptance Criteria**

- User can upload/update/remove a photo
- Image appears on profile
- Stored in S3 under secure user ownership rules
- Correct URL generated on deployment

---

## **Prompt 3 — CV Header Layout Integration**

### **Purpose**

Update print and preview CV layouts to consume the new data sources and render them visually cleanly.

First analyse the CV rendering architecture:
Markdown? Layout grid? CSS stack? Where does HTML come from?

### **Components / Composables**

- Update CV document formatter for:
  - photo
  - contacts
  - socials
  - work permit

- Component for header block
- Conditional rendering logic

### **Pages to Modify**

- `/cv/:id`
- `/cv/:id/print`

### **Tests**

- Rendering snapshot tests
- Visibility toggle tests
- No-layout-drift regression tests

### **Acceptance Criteria**

- CV header displays top-right photo
- Contact & social info appear with toggles respected
- No template breaking on small/large screens
- Print mode matches PDF/export

---

## **Prompt 4 — Update CV Generator Lambda Input Structure**

### **Purpose**

Extend `generateCv` AI input with new header metadata while preserving backward compatibility.

### **Components / Composables**

- Update Lambda request payload structure
- Filter lists based on include flags
- Map profile fields to new CV header fields

### **Pages to Modify**

- None (AI backend only)

### **Tests**

- Snapshot tests on new input
- Filtering rules tests
- Old CVs run unchanged

### **Acceptance Criteria**

- AI receives new structured metadata
- Fields hidden when toggle disabled
- No failures when fields missing
- Lambda respects null/undefined gracefully

---

## **Prompt 5 — Social Link List Editor Implementation**

### **Purpose**

Build a reusable editable list component for socials, aligned with existing UX patterns.

### **Components / Composables**

- New SocialLinkList component
- Social link form logic
- Include/Exclude toggle

### **Pages to Modify**

- `/profile` page section

### **Tests**

- CRUD UI tests
- Validation test (URL format)
- `includeInCv` toggle test

### **Acceptance Criteria**

- Multiple links supported
- Label + URL stored
- User controls CV visibility
- Data persists correctly

---

## **Prompt 6 — Work Permit Field + Toggle Integration**

### **Purpose**

Provide structured place to store work eligibility details.

### **Components / Composables**

- Add field to model + form
- Visibility checkbox

### **Pages to Modify**

- `/profile`

### **Tests**

- Save/load tests
- Visibility toggle works

### **Acceptance Criteria**

- Field editable & optional
- Appears in CV only when toggled
- No CV dependency breaks

---

## **Prompt 7 — Contact Info UI & Storage**

### **Purpose**

Allow user to store and decide CV visibility of email and phone.

### **Components / Composables**

- Add form inputs
- Add boolean toggles

### **Pages to Modify**

- `/profile`

### **Tests**

- Validation tests
- CV integration test

### **Acceptance Criteria**

- Both fields optional
- Both can be hidden
- Used automatically by generator
