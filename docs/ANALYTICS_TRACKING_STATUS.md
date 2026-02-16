# Analytics Tracking Implementation Status

## ✅ Implemented (18/18 events)

### Onboarding Flow

1. **onboarding_started** - `src/composables/useOnboardingWizard.ts` (load method, when user enters onboarding)
2. **onboarding_completed** - `src/composables/useOnboardingWizard.ts` (finish method)
3. **cv_upload_completed** - `src/composables/useOnboardingWizard.ts` (importExperiences method, after successful CV parsing and import)

### Profile Building

4. **experience_created** - `src/pages/profile/experiences/[id].vue` (handleSave method, for new experiences)
5. **story_created_from_experience** - `src/composables/useStoryEditor.ts` (save method)
6. **story_created_from_free_text** - `src/composables/useStoryEditor.ts` (save method)
7. **canvas_created** - `src/application/personal-canvas/useCanvasEngine.ts` (generateAndSave method)
8. **profile_updated** - `src/components/profile/FullForm.vue` (handleSubmit method)

### Job Matching

9. **job_uploaded** - `src/composables/useJobUpload.ts` (processFile method, after successful job creation)
10. **job_match_computed** - `src/composables/useMatchingEngine.ts` (regenerate method, after successful match generation)

### Application Materials

11. **cv_created** - `src/pages/applications/cv/new.vue` (generateGenericCv function, after successful CV document creation)
12. **cover_letter_created** - `src/pages/applications/cover-letters/new.vue` (generateCoverLetter function, after successful cover letter creation)
13. **speech_created** - `src/pages/applications/speech/new.vue` (generateSpeech function, after successful speech block creation)
14. **cv_template_created** - `src/application/cvtemplate/useCvTemplates.ts` (createTemplate method, after successful template creation)

### Application Strength (A2)

15. **application_strength_evaluation_started** - `src/composables/useApplicationStrengthEvaluator.ts` (before evaluation call)
16. **application_strength_evaluation_succeeded** - `src/composables/useApplicationStrengthEvaluator.ts` (after successful evaluation)
17. **application_strength_evaluation_failed** - `src/composables/useApplicationStrengthEvaluator.ts` and `src/composables/useApplicationStrengthPage.ts` (evaluation/page-load failures)
18. **application_strength_retry_clicked** - `src/pages/jobs/[jobId]/application-strength.vue` (retry actions from error states)

## 🎉 All Events Tracked!

All 18 analytics events have been successfully implemented following the established pattern:

1. Import `useAnalytics` from `@/composables/useAnalytics`
2. Call `const { captureEvent } = useAnalytics();` where needed
3. Trigger `captureEvent('event_name');` after successful operation
