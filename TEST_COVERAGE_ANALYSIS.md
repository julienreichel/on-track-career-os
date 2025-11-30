# Test Coverage Analysis - AI Operations

## Summary

After refactoring Lambda handlers to use utility wrappers, we've identified and removed redundant test coverage.

### New Utility Tests (13 new tests)

#### `withAiOperationHandler` & `withAiOperationHandlerObject` (5 tests)
- ✅ Logs input, executes function, logs output, returns JSON string
- ✅ Handles errors and rethrows with proper logging
- ✅ Handles complex output objects
- ✅ Object variant returns object directly (not JSON string)
- ✅ Both variants log errors consistently

#### `invokeAiWithRetry` (8 tests)
- ✅ Successfully invokes AI and validates output
- ✅ Extracts JSON from markdown wrappers
- ✅ Retries with schema on parse error with logging
- ✅ Does not log when operationName is not provided
- ✅ Applies validation and fallbacks
- ✅ Throws if retry also fails to parse
- ✅ Propagates validation errors
- ✅ Handles complex nested types

### Redundant Tests Identified

#### In Lambda Operation Tests (parseCvText, generateStarStory, extractExperienceBlocks)

**REDUNDANT** (now covered by utility tests):
1. ❌ "should retry with schema on parse error"
   - **Reason**: `invokeAiWithRetry` has comprehensive retry tests
   - **Covered by**: `invokeAiWithRetry` > "should retry with schema on parse error and log appropriately"
   
2. ❌ "should handle AI response wrapped in markdown code blocks"  
   - **Reason**: `invokeAiWithRetry` uses `extractJson` which is thoroughly tested
   - **Covered by**: `extractJson` tests (8 test cases) + `invokeAiWithRetry` > "should extract JSON from markdown wrappers"

**KEEP** (operation-specific business logic):
- ✅ Success cases with operation-specific data transformations
- ✅ Operation-specific validation fallbacks (e.g., default confidence, missing fields)
- ✅ Operation-specific error cases (e.g., missing required sections)
- ✅ Edge cases specific to the operation's domain logic

### Coverage Improvement

**Before Refactoring:**
- 170 tests total
- Significant duplication of retry/logging/extraction logic across 3 Lambda tests

**After Refactoring:**
- 177 tests total (13 added - 6 removed)
- Clear separation: utilities test infrastructure, Lambda tests test business logic
- Reduced maintenance burden: retry logic changes only need updates in one place

### Test Count per File

- `common.spec.ts`: 33 → 38 tests (+5)
- `bedrock.spec.ts`: 20 → 28 tests (+8)
- `parseCvText.spec.ts`: 3 → 2 tests (-1)
- `generateStarStory.spec.ts`: 7 → 5 tests (-2)
- `extractExperienceBlocks.spec.ts`: 4 → 3 tests (-1)

**Net Result**: +7 tests, better coverage, less duplication

### Recommendations

1. **Keep operation tests focused on**:
   - Data transformation correctness
   - Operation-specific validation rules
   - Business logic edge cases
   - Success scenarios with real-world data

2. **Utility tests handle**:
   - Retry logic
   - JSON extraction
   - Error logging
   - Handler wrappers
   - Generic error scenarios

3. **Future AI operations**:
   - Only test operation-specific logic
   - Rely on utility tests for infrastructure concerns
   - Follow the pattern: 2-3 tests per operation (success + validation + error case)
