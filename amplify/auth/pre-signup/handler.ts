import type { PreSignUpTriggerHandler } from 'aws-lambda';

/**
 * Pre Sign-up Lambda Trigger
 *
 * PURPOSE:
 * Auto-confirm and auto-verify users in sandbox/dev environments
 * to avoid email verification during testing.
 *
 * BEHAVIOR:
 * - Auto-confirms user (no confirmation code required)
 * - Auto-verifies email (email_verified = true)
 * - No confirmation emails sent
 *
 * SECURITY:
 * - Only for sandbox/dev environments
 * - Should NOT be enabled in production
 *
 * CONFIGURATION:
 * Attached to Cognito User Pool → Pre sign-up trigger
 */

export const handler: PreSignUpTriggerHandler = async (event) => {
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

  return event;
};
