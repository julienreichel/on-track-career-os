# Amplify Environment Variables

## AMPLIFY_ENVIRONMENT

**Automatically set by Amplify Gen 2** - you don't need to configure this manually.

### How It Works

When you use Amplify Gen 2, the `AMPLIFY_ENVIRONMENT` variable is automatically set based on how you're running:

| Context | AMPLIFY_ENVIRONMENT Value | Purpose |
|---------|---------------------------|---------|
| `npx ampx sandbox` | `sandbox` | Local development/testing |
| `npx ampx sandbox --environment dev` | `dev` | Dev environment |
| Amplify Hosting (main branch) | `main` | Production (treated as prod) |
| Amplify Hosting (feature branch) | `<branch-name>` | Per-branch environment |

### Access in Lambda Functions

```typescript
import { env } from '$amplify/env/<function-name>';

export const handler = async (event) => {
  const environment = env.AMPLIFY_ENVIRONMENT || 'production';
  console.log('Running in environment:', environment);
  
  // Use for environment-specific logic
  const isSandbox = environment === 'sandbox' || environment === 'dev';
  
  if (isSandbox) {
    // Test/dev behavior
  } else {
    // Production behavior
  }
};
```

### Pre Sign-up Trigger Example

Our `amplify/auth/pre-signup/handler.ts` uses this to control auto-confirmation:

```typescript
const environment = env.AMPLIFY_ENVIRONMENT || 'production';
const isSandbox = environment === 'sandbox' || environment === 'dev';

if (isSandbox) {
  // Auto-confirm users for testing
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
} else {
  // Production: require email verification
}
```

### CI/CD

In GitHub Actions, when you run `npx ampx sandbox`, Amplify automatically sets `AMPLIFY_ENVIRONMENT=sandbox`. No additional configuration needed.

```yaml
- name: Deploy Amplify Sandbox
  run: |
    npx ampx sandbox --once
    # AMPLIFY_ENVIRONMENT will be 'sandbox' automatically
```

### Production Deployment

When deployed via Amplify Hosting (connected to your GitHub repo):
- Main branch → `AMPLIFY_ENVIRONMENT` will be `main` (not `sandbox` or `dev`)
- Feature branches → `AMPLIFY_ENVIRONMENT` will be the branch name

Our code checks for `sandbox` or `dev` specifically, so any other value (including `main`, `production`, or branch names) will use production behavior (email verification required).

### Safe Defaults

The code always defaults to production behavior if `AMPLIFY_ENVIRONMENT` is not set:

```typescript
const environment = env.AMPLIFY_ENVIRONMENT || 'production';
```

This ensures that:
- ✅ Sandbox/dev environments get auto-confirmation for testing
- ✅ Production environments require email verification
- ✅ If something goes wrong, it fails **secure** (requires verification)
