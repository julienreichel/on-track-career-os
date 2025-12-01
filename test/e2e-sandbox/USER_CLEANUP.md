# E2E Test User Cleanup

## Problem

E2E sandbox tests create real Cognito users. Without proper cleanup, these accumulate in the user pool, causing:
- Exceeded user limits in development
- Difficulty identifying real test failures
- Resource waste

## Solution

Two-step cleanup process in test `afterEach` hooks:

```typescript
afterEach(async () => {
  try {
    if (testUserId) {
      // Step 1: Delete UserProfile from database
      await client.models.UserProfile.delete({ id: testUserId });
      
      // Step 2: Delete Cognito user via custom mutation
      await client.mutations.deleteUserProfileWithAuth({ userId: testUserId });
      
      console.log('Test user cleaned up:', testUserId);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 30000);
```

## Implementation Details

### Custom Mutation

**Location:** `amplify/data/delete-user-profile/handler.ts`

**GraphQL Operation:** `deleteUserProfileWithAuth`

```graphql
mutation DeleteUser($userId: String!) {
  deleteUserProfileWithAuth(userId: $userId)
}
```

**Parameters:**
- `userId` (required): Cognito user ID to delete

**Returns:** `boolean` - `true` if successful, `false` otherwise

**Authorization:** Requires authenticated user (any authenticated user can call this - designed for test cleanup)

### Permissions

The Lambda requires:
- IAM permission: `cognito-idp:AdminDeleteUser`
- Configured in `amplify/backend.ts`:

```typescript
backend.deleteUserProfile.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['cognito-idp:AdminDeleteUser'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);
```

### Why Two Steps?

1. **UserProfile deletion**: Uses standard GraphQL delete with owner-based authorization
   - User can only delete their own profile
   - Follows normal authorization rules

2. **Cognito deletion**: Requires admin privileges
   - Cannot be done client-side (requires `AdminDeleteUser`)
   - Needs Lambda with IAM permissions
   - No owner-based restrictions (for test cleanup flexibility)

### Test Pattern

All E2E sandbox tests follow this pattern:

```typescript
describe('Test Suite', () => {
  let testEmail: string;
  let testUserId: string | undefined;

  beforeEach(async () => {
    // Create unique test user
    testEmail = `test-${Date.now()}@example.com`;
    const signUpResult = await signUp({ username: testEmail, ... });
    testUserId = signUpResult.userId;
    
    // Wait for post-confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sign in
    await signIn({ username: testEmail, ... });
  }, 30000);

  afterEach(async () => {
    // Cleanup (two-step process above)
  }, 30000);

  it('test case', async () => {
    // Test uses fresh user created in beforeEach
  });
});
```

## Alternative Approaches Considered

### 1. Post-Delete Resolver (Rejected)

**Approach:** Attach Lambda as post-resolver to `UserProfile.delete` operation

**Issues:**
- Amplify Gen 2 API doesn't support `.addFunction()` on model operations
- Would require complex GraphQL resolver configuration
- Mixing business logic with test infrastructure

### 2. Single Custom Mutation (Rejected)

**Approach:** One mutation that deletes both UserProfile and Cognito user

**Issues:**
- Lambda would need to call GraphQL (circular dependency)
- Requires amplify_outputs.json in Lambda environment
- Complex authorization handling (IAM vs owner-based)
- Error handling complexity (partial failures)

### 3. Manual CLI Cleanup (Rejected)

**Approach:** Use AWS CLI to delete users after tests

**Issues:**
- Not automatic
- Requires manual intervention
- Tests leave system dirty
- Risk of forgetting cleanup

## Deployment

1. Deploy backend changes:
   ```bash
   AUTO_CONFIRM_USERS=true npx ampx sandbox --once
   ```

2. The custom mutation will be available in the GraphQL schema

3. TypeScript types are auto-generated for `client.mutations.deleteUserProfileWithAuth`

## Usage in Non-Test Code

⚠️ **This mutation is designed for E2E test cleanup only**

Do NOT use in production code. For user account deletion in production:
- Implement proper multi-step deletion workflow
- Add confirmation dialogs
- Handle cascade deletes for related data
- Send notifications
- Comply with GDPR/data retention policies

## Future Improvements

1. **Batch cleanup:** Delete multiple test users at once
2. **Time-based cleanup:** Auto-delete users created >24h ago
3. **Test isolation:** Use separate user pools for tests
4. **Mock Cognito:** Use local Cognito emulator for tests

## References

- Amplify Gen 2 Functions: https://docs.amplify.aws/react/build-a-backend/functions/
- AWS SDK Cognito: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cognito-identity-provider/
- Test Pattern: `test/e2e-sandbox/README.md`
