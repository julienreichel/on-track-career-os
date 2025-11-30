import { env } from '$amplify/env/pre-signup';
import type { PreSignUpTriggerHandler } from 'aws-lambda';

/**
 * Pre Sign-up Lambda Trigger
 *
 * PURPOSE:
 * Auto-confirm and auto-verify users in sandbox/dev environments
 * to avoid email verification during testing.
 *
 * BEHAVIOR (when AUTO_CONFIRM_USERS=true):
 * - Auto-confirms user (no confirmation code required)
 * - Auto-verifies email (email_verified = true)
 * - No confirmation emails sent
 *
 * PRODUCTION (AUTO_CONFIRM_USERS=false or not set):
 * - Normal email verification flow (auto-confirm DISABLED)
 * - Users must verify email via confirmation code
 *
 * ENVIRONMENT CONFIGURATION:
 * - Set AUTO_CONFIRM_USERS in amplify/auth/pre-signup/resource.ts
 * - Or override via backend.addOutput() for specific branches
 * - Or set via backend.preSignup.addEnvironment() in backend.ts
 *
 * CONFIGURATION:
 * Attached to Cognito User Pool → Pre sign-up trigger
 */

export const handler: PreSignUpTriggerHandler = async (event) => {
  // Check if auto-confirmation is enabled via environment variable
  // Default to 'false' for security (production behavior)
  const autoConfirmEnabled = env.AUTO_CONFIRM_USERS === 'true';

  console.log('Pre Sign-up trigger:', {
    autoConfirmEnabled,
    email: event.request.userAttributes.email,
  });

  // Only auto-confirm if explicitly enabled (for sandbox/dev)
  if (autoConfirmEnabled) {
    console.log('Auto-confirming user (AUTO_CONFIRM_USERS=true)');

    // Auto-confirm user (no email verification code required)
    event.response.autoConfirmUser = true;

    // Auto-verify email if provided
    if (event.request.userAttributes.email) {
      event.response.autoVerifyEmail = true;
    }

    // Auto-verify phone if provided
    if (event.request.userAttributes.phone_number) {
      event.response.autoVerifyPhone = true;
    }
  } else {
    console.log('Production mode - requiring email verification (AUTO_CONFIRM_USERS=false)');
    // In production, let Cognito handle normal verification flow
    // event.response fields remain undefined, so Cognito sends verification email
  }

  return event;
};
