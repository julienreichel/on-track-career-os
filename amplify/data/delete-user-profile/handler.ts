import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import type { Schema } from '../resource';
import { env } from '$amplify/env/delete-user-profile';

const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const JSON_INDENT = 2;

type DeleteUserProfileHandler = Schema['deleteUserProfileWithAuth']['functionHandler'];

/**
 * Custom Mutation: deleteUserProfileWithAuth
 *
 * PURPOSE:
 * Deletes BOTH the UserProfile from DynamoDB AND the Cognito user.
 * This is a complete user deletion operation requiring only ONE call.
 *
 * FLOW:
 * 1. Receive userId in arguments
 * 2. Delete UserProfile from DynamoDB
 * 3. Delete Cognito user via AdminDeleteUser
 * 4. Return success status
 *
 * USAGE:
 * - E2E test cleanup
 * - User account deletion (future: add confirmation workflow)
 *
 * CONFIGURATION:
 * - Exposed as custom mutation: deleteUserProfileWithAuth
 * - Requires authenticated user
 * - Requires cognito-idp:AdminDeleteUser permission
 * - Requires dynamodb:DeleteItem permission
 * - Uses USER_POOL_ID and USERPROFILE_TABLE_NAME from environment
 */

export const handler: DeleteUserProfileHandler = async (event) => {
  console.log('deleteUserProfileWithAuth started');
  console.log('Event:', JSON.stringify(event, null, JSON_INDENT));

  const { userId } = event.arguments;
  const userPoolId = env.USER_POOL_ID;
  const tableName = env.USERPROFILE_TABLE_NAME;

  if (!userId) {
    console.error('Missing userId in arguments');
    return false;
  }

  if (!userPoolId) {
    console.error('USER_POOL_ID environment variable not set');
    return false;
  }

  if (!tableName) {
    console.error('USERPROFILE_TABLE_NAME environment variable not set');
    return false;
  }

  console.log('Deleting user:', { userId, userPoolId, tableName });

  try {
    // Step 1: Delete UserProfile from DynamoDB
    console.log('Deleting UserProfile from DynamoDB...');
    await dynamoClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id: userId },
      })
    );
    console.log(`Successfully deleted UserProfile: ${userId}`);

    // Step 2: Delete Cognito user
    console.log('Deleting Cognito user...');
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: userId,
      })
    );
    console.log(`Successfully deleted Cognito user: ${userId}`);

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    // Return false but don't throw - allows graceful degradation
    return false;
  }
};
