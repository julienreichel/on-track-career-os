# Test Distribution Analysis: E2E vs Nuxt Tests

**Date**: December 12, 2025  
**Current State**: 85 E2E tests, 192 Nuxt component tests

## Summary

**Problem**: Some tests in E2E suite could be moved to Nuxt tests for faster feedback and better test pyramid distribution.

**Principle**: E2E tests should verify end-to-end workflows with real browser, backend, and auth. Nuxt tests should verify component behavior, UI logic, and presentation in isolation.

---

## Current Test Distribution

### E2E Tests (85 tests, ~2-3 minutes runtime)
- `smoke.spec.ts`: 3 tests - Basic app structure
- `index-page.spec.ts`: 12 tests - Home page navigation and layout
- `profile-page.spec.ts`: 17 tests - Profile view/edit modes
- `experiences.spec.ts`: 13 tests - Experience CRUD operations
- `stories.spec.ts`: 28 tests - Story creation and AI generation
- `cv-upload-flow.spec.ts`: 12 tests - CV upload and import workflow

### Nuxt Component Tests (192 tests, ~5-10 seconds runtime)
- Layout tests: `default.spec.ts`, `empty.spec.ts`
- CV components: `UploadStep`, `ParsingStep`, `ExperiencesPreview`, `ProfilePreview`, `BadgeList`, `SingleBadge`, `ImportSuccess`
- Experience components: `ExperienceForm`, `ExperienceList`
- Story components: `StoryForm`, `StoryBuilder`, `AchievementsKpisPanel`
- Utility components: `TagInput`, `UnsavedChangesModal`
- Page tests: `profile/stories/index.spec.ts`

---

## Analysis by Test File

### ✅ **GOOD SPLIT: smoke.spec.ts**
**Current**: 3 E2E tests for basic app rendering
**Status**: ✅ Keep as-is
**Reason**: These are true smoke tests verifying the app loads correctly

---

### ⚠️ **NEEDS IMPROVEMENT: index-page.spec.ts**
**Current**: 12 E2E tests for home page
**Issues**:
- Tests like "should display page header with title" are UI checks, not workflows
- "should have profile feature card" tests component rendering
- "should be responsive on mobile" tests CSS/layout
- Only navigation tests ("should navigate to profile") are truly E2E

**Recommendation**:
```
MOVE TO NUXT (8 tests):
✅ should display page header with title and description
✅ should have profile feature card
✅ should display jobs feature card
✅ should display applications feature card
✅ should display interview prep feature card
✅ should have responsive layout on mobile
✅ should have accessible navigation
✅ should redirect to login or show login page

KEEP IN E2E (4 tests):
✅ should navigate to profile page when profile card is clicked
✅ Navigation between major features (home → profile → experiences)
✅ Auth redirect flow (when not authenticated)
✅ Initial app load with auth
```

**Create**: `test/nuxt/pages/index.spec.ts` to test home page component in isolation

---

### ⚠️ **NEEDS IMPROVEMENT: profile-page.spec.ts**
**Current**: 17 E2E tests for profile page
**Issues**:
- Many tests verify component rendering ("should display profile sections")
- Responsive tests are CSS checks, not E2E
- Edit mode toggle is UI state, not workflow

**Recommendation**:
```
MOVE TO NUXT (10 tests):
✅ should display profile page header
✅ should display back to home button
✅ should have edit button in view mode
✅ should display profile sections
✅ should display core identity section
✅ should display profile management section
✅ should display form inputs in edit mode
✅ should have cancel button in edit mode
✅ should be responsive on mobile/tablet/desktop (3 tests)

KEEP IN E2E (7 tests):
✅ should have link to experiences page
✅ should have link to personal canvas page
✅ should enter edit mode when edit button is clicked
✅ should exit edit mode when cancel is clicked
✅ should navigate back to home page
✅ should navigate to experiences page from profile
✅ should redirect to login when not authenticated
```

**Create**: `test/nuxt/pages/profile/index.spec.ts` for profile page component tests

---

### ✅ **GOOD SPLIT: experiences.spec.ts**
**Current**: 13 E2E tests for experience management
**Status**: ✅ Mostly good, minor improvements possible
**Current coverage**:
- Experience listing page structure ✅ (could move some to Nuxt)
- Experience creation form ✅ (form exists in ExperienceForm.spec.ts already)
- CRUD operations ✅ (keep in E2E)
- Navigation flows ✅ (keep in E2E)

**Recommendation**:
```
MOVE TO NUXT (3 tests):
✅ should display page header with title (already in page component)
✅ should display empty state if no experiences (UEmpty component test)
✅ should have "New Experience" button (button rendering)

KEEP IN E2E (10 tests):
✅ should navigate to new experience form
✅ should successfully create experience with valid data
✅ should show validation errors
✅ should allow canceling experience creation
✅ should display experience cards or table if experiences exist
✅ should navigate to story list when clicking view stories button
✅ All CRUD operations
```

**Note**: `ExperienceForm.spec.ts` already has 50+ tests for form validation - E2E should focus on integration

---

### ✅ **GOOD SPLIT: stories.spec.ts**
**Current**: 28 E2E tests for story management
**Status**: ✅ Mostly good - these are complex AI workflows
**Coverage**:
- Manual story creation ✅ (keep in E2E - involves STAR chat flow)
- AI generation from free text ✅ (keep in E2E - backend AI)
- Auto-generation from experience ✅ (keep in E2E - backend AI)
- Story listing and display ✅ (some could move to Nuxt)

**Recommendation**:
```
MOVE TO NUXT (5 tests):
✅ should display page header (page component rendering)
✅ should have back to profile navigation (button rendering)
✅ should have search functionality (search input rendering)
✅ should display empty state if no stories (UEmpty component)
✅ should display achievement badges on story cards (component styling)

KEEP IN E2E (23 tests):
✅ All manual story creation tests (STAR interview flow)
✅ All AI generation tests (backend integration)
✅ All navigation flows
✅ All CRUD operations
✅ Modal interactions
```

**Note**: `StoryForm.spec.ts` already tests STAR form fields - E2E tests the complete workflow

---

### ✅ **EXCELLENT SPLIT: cv-upload-flow.spec.ts**
**Current**: 12 E2E tests (11 active, 1 skipped)
**Status**: ✅ Perfect - this is a true E2E workflow
**Coverage**:
- File upload ✅
- AI parsing (backend) ✅
- Preview extracted data ✅
- Import to database ✅
- Verify imported data ✅

**Component tests already exist**:
- `UploadStep.spec.ts`: File input, validation, emit events
- `ParsingStep.spec.ts`: Loading state UI
- `ExperiencesPreview.spec.ts`: Preview display, count badge
- `ProfilePreview.spec.ts`: Profile section display
- `ImportSuccess.spec.ts`: Success message display

**Recommendation**: ✅ **Keep all tests in E2E** - this is the gold standard for E2E testing

---

## Proposed Test Pyramid Distribution

### After Refactoring

```
              E2E Tests (50-60 tests)
             /                    \
       Nuxt Tests (220-250 tests)
      /                            \
 Unit Tests (domain logic, composables)
```

**Target E2E Tests** (~55 tests, 1-2 min runtime):
- Authentication flows: 3-5 tests
- CV Upload workflow: 12 tests ✅
- Experience CRUD: 8-10 tests
- Story creation & AI generation: 20-25 tests
- Navigation flows: 5-7 tests
- End-to-end feature workflows: 5-8 tests

**Target Nuxt Tests** (~240 tests, 5-10 sec runtime):
- All component rendering and behavior
- Form validation and UI logic
- Responsive layout checks
- Empty states and error handling
- Component event emissions
- Props validation
- Computed properties

---

## Implementation Plan

### Phase 1: Move Simple Page Tests (High Impact, Low Risk)

**Create new files**:
1. `test/nuxt/pages/index.spec.ts` - Home page components
2. `test/nuxt/pages/profile/index.spec.ts` - Profile page components
3. `test/nuxt/pages/profile/experiences/index.spec.ts` - Experience list page

**Move tests**:
- 8 tests from `index-page.spec.ts`
- 10 tests from `profile-page.spec.ts`
- 3 tests from `experiences.spec.ts`
- 5 tests from `stories.spec.ts`

**Total**: 26 tests moved, reducing E2E from 85 to 59 tests

### Phase 2: Consolidate E2E Tests (Medium Priority)

**Refactor remaining E2E tests** to focus on:
- Critical user journeys (login → upload CV → generate stories → export)
- Cross-feature workflows (profile → experiences → stories → back)
- Backend integration points (AI operations, database)
- Authentication and authorization

**Goal**: Further reduce to ~50-55 E2E tests

### Phase 3: Add Missing Unit Tests (Future)

- Composables: `useStoryEditor`, `useExperienceStore`, etc.
- Domain logic: Experience validation, STAR story formatting
- Utilities: Date formatting, text processing

---

## Key Principles for Future Tests

### ✅ Write E2E Tests For:
- Complete user workflows that span multiple pages
- Features requiring authentication
- Backend API integration (AI operations, database writes)
- File uploads and external integrations
- Cross-component interactions (modals, navigation)
- Critical business flows (CV upload → import → display)

### ✅ Write Nuxt/Component Tests For:
- Component rendering and DOM structure
- Props and event emissions
- Computed properties and watchers
- Form validation (client-side)
- Responsive layouts and CSS
- Empty states and error displays
- UI state management (loading, disabled, etc.)
- Component-level user interactions (click, type, etc.)

### ❌ Avoid in E2E:
- Testing component props directly
- Checking CSS classes or styles
- Validating i18n keys
- Testing every button/link rendering
- Responsive layout checks
- Component isolation concerns

---

## Expected Benefits

### After Refactoring:

**Speed**:
- E2E suite: 85 tests @ 2-3 min → 55 tests @ 1-2 min ✅ 33-50% faster
- Nuxt suite: 192 tests @ 5-10 sec → 240 tests @ 8-15 sec ✅ Still fast
- Total test time: ~3 min → ~2 min ✅ 33% faster

**Reliability**:
- Fewer E2E flakes (less browser/network dependency)
- Faster feedback loop (Nuxt tests run first)
- Easier debugging (component tests isolate issues)

**Maintainability**:
- Component tests colocated with components
- E2E tests focus on real user workflows
- Clear separation of concerns

**Developer Experience**:
- Fast unit/component tests for quick iteration
- E2E tests verify critical paths before merge
- Better test failure messages

---

## Next Steps

1. ✅ Review this analysis with team
2. Create `test/nuxt/pages/` directory structure
3. Move 26 tests from Phase 1 (start with `index-page.spec.ts`)
4. Update E2E tests to focus on workflows
5. Run both suites and verify all tests pass
6. Update CI/CD to run Nuxt tests before E2E
7. Document test writing guidelines in `CONTRIBUTING.md`

---

## References

- [Test Pyramid by Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Nuxt Testing Best Practices](https://nuxt.com/docs/getting-started/testing)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
