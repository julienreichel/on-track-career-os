import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Schema } from '../resource';
import { env } from '$amplify/env/delete-user-profile';

const cognitoClient = new CognitoIdentityProviderClient({});

const JSON_INDENT = 2;

type DeleteUserProfileHandler = Schema['deleteUserProfileWithAuth']['functionHandler'];

/**
 * Custom Mutation: deleteUserProfileWithAuth
 *
 * PURPOSE:
 * Deletes ONLY the Cognito user. The UserProfile should be deleted separately
 * using the standard delete mutation. This mutation is for E2E test cleanup.
 *
 * FLOW:
 * 1. Receive userId in arguments
 * 2. Delete Cognito user via AdminDeleteUser
 * 3. Return success status
 *
 * NOTE: Call this AFTER deleting the UserProfile via client.models.UserProfile.delete()
 *
 * CONFIGURATION:
 * - Exposed as custom mutation: deleteUserProfileWithAuth
 * - Requires authenticated user
 * - Requires cognito-idp:AdminDeleteUser permission
 * - Uses USER_POOL_ID from environment
 */

export const handler: DeleteUserProfileHandler = async (event) => {
  console.log('deleteUserProfileWithAuth started');
  console.log('Event:', JSON.stringify(event, null, JSON_INDENT));

  const { userId } = event.arguments;
  const userPoolId = env.USER_POOL_ID;

  if (!userId) {
    console.error('Missing userId in arguments');
    return false;
  }

  if (!userPoolId) {
    console.error('USER_POOL_ID environment variable not set');
    return false;
  }

  console.log('Deleting Cognito user:', { userId, userPoolId });

  try {
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: userId,
      })
    );

    console.log(`Successfully deleted Cognito user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting Cognito user:', error);
    // Return false but don't throw - allows graceful degradation
    return false;
  }
};
