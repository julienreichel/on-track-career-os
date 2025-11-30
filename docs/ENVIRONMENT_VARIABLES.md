# Environment Variables for Lambda Functions

## Overview

Lambda functions in Amplify Gen 2 use environment variables defined in `defineFunction()` and accessed via type-safe `$amplify/env/<function-name>` imports.

## AUTO_CONFIRM_USERS (Pre Sign-up Lambda)

Controls whether users are auto-confirmed (sandbox/dev) or require email verification (production).

### How It Works

#### 1. Define in resource.ts

**amplify/auth/pre-signup/resource.ts:**
```typescript
import { defineFunction } from '@aws-amplify/backend';

export const preSignup = defineFunction({
  name: 'pre-signup',
  entry: './handler.ts',
  environment: {
    // Default to secure (production) behavior
    AUTO_CONFIRM_USERS: 'false',
  },
});
```

#### 2. Access in Lambda Handler

**amplify/auth/pre-signup/handler.ts:**
```typescript
import { env } from '$amplify/env/pre-signup';

export const handler: PreSignUpTriggerHandler = async (event) => {
  // Type-safe access to AUTO_CONFIRM_USERS
  const autoConfirmEnabled = env.AUTO_CONFIRM_USERS === 'true';

  if (autoConfirmEnabled) {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
  }
  
  return event;
};
```

The `$amplify/env/pre-signup` import:
- Auto-generated during Amplify build
- Provides TypeScript types for all environment variables
- Includes IntelliSense/autocomplete

#### 3. Override in CI/CD

For sandbox testing, override via environment variable:

**.github/workflows/e2e-sandbox.yml:**
```yaml
- name: Deploy Amplify Sandbox
  env:
    AUTO_CONFIRM_USERS: 'true'  # Enable for tests
  run: npx ampx sandbox --once
```

When set during deployment, the environment variable overrides the default from `resource.ts`.

#### 4. Override in Amplify Hosting

For specific branches in Amplify Hosting:

1. Amplify Console → Your App → Environment variables
2. Add variable:
   - Key: `AUTO_CONFIRM_USERS`
   - Value: `true` (dev) or `false` (prod)
   - Branch: Select target

### Security Model

| Environment | AUTO_CONFIRM_USERS | Behavior |
|-------------|-------------------|----------|
| **Production** | `'false'` (default) | ✅ Email verification required (secure) |
| **Sandbox** | `'true'` (override) | ⚠️ Auto-confirm (testing only) |
| **Dev branch** | Configurable | Override per branch |

### Local Development

```bash
# Enable auto-confirmation
export AUTO_CONFIRM_USERS=true
npx ampx sandbox

# Or run tests (already configured)
npm run test:sandbox
```

## Other Lambda Environment Variables

### AI Operations (MODEL_ID)

**amplify/data/resource.ts:**
```typescript
export const MODEL_ID = 'amazon.nova-lite-v1:0';

export const generateStarStoryFunction = defineFunction({
  entry: './ai-operations/generateStarStory.ts',
  environment: {
    MODEL_ID,  // Bedrock model ID
  },
  timeoutSeconds: 60,
});
```

**amplify/data/ai-operations/generateStarStory.ts:**
```typescript
import { env } from '$amplify/env/generateStarStory';

const modelId = env.MODEL_ID; // Type-safe access
```

## TypeScript Errors Before First Build

**Error:** `Property 'AUTO_CONFIRM_USERS' does not exist on type 'LambdaProvidedEnvVars'`

**Cause:** `$amplify/env/<function-name>` is generated during Amplify build

**Solution:** Deploy sandbox once to generate types:
```bash
npx ampx sandbox
```

After deployment, TypeScript will recognize the environment variables.

## Troubleshooting

### Auto-confirmation Not Working

1. Check environment variable is set:
   ```bash
   echo $AUTO_CONFIRM_USERS
   ```

2. Verify in CloudWatch logs:
   ```
   Pre Sign-up trigger: { autoConfirmEnabled: true, email: '...' }
   Auto-confirming user (AUTO_CONFIRM_USERS=true)
   ```

3. Ensure sandbox is deployed with override:
   ```bash
   AUTO_CONFIRM_USERS=true npx ampx sandbox
   ```

### Production Users Auto-Confirmed (CRITICAL)

Should NOT happen if:
- `resource.ts` has `AUTO_CONFIRM_USERS: 'false'` default
- No override in Amplify Console for production branch

**Check:** Amplify Console → Environment variables → Ensure NOT set to `'true'` for main branch

## Related Files

- `amplify/auth/pre-signup/resource.ts` - Environment variable definition
- `amplify/auth/pre-signup/handler.ts` - Lambda handler
- `.github/workflows/e2e-sandbox.yml` - CI override
- `test/e2e-sandbox/README.md` - E2E testing guide
