import { env } from '$amplify/env/pre-signup';
import type { PreSignUpTriggerHandler } from 'aws-lambda';

/**
 * Pre Sign-up Lambda Trigger
 *
 * PURPOSE:
 * Auto-confirm and auto-verify users in sandbox/dev environments
 * to avoid email verification during testing.
 *
 * BEHAVIOR (sandbox/dev only):
 * - Auto-confirms user (no confirmation code required)
 * - Auto-verifies email (email_verified = true)
 * - No confirmation emails sent
 *
 * PRODUCTION:
 * - Normal email verification flow (auto-confirm DISABLED)
 * - Users must verify email via confirmation code
 *
 * CONFIGURATION:
 * Attached to Cognito User Pool → Pre sign-up trigger
 */

export const handler: PreSignUpTriggerHandler = async (event) => {
  // Get environment from Amplify
  const environment = env.AMPLIFY_ENVIRONMENT || 'production';
  const isSandbox = environment === 'sandbox' || environment === 'dev';

  console.log('Pre Sign-up trigger:', {
    environment,
    isSandbox,
    email: event.request.userAttributes.email,
  });

  // Only auto-confirm in sandbox/dev environments
  if (isSandbox) {
    console.log('Auto-confirming user (sandbox/dev mode)');
    
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
    console.log('Production mode - requiring email verification');
    // In production, let Cognito handle normal verification flow
    // event.response fields remain undefined, so Cognito sends verification email
  }

  return event;
};
