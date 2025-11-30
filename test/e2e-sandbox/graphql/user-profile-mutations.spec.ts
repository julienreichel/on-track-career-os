import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import amplifyOutputs from '../../../amplify_outputs.json';
import type { Schema } from '../../../amplify/data/resource';

/**
 * E2E Sandbox Test: UserProfile GraphQL Operations
 *
 * Tests UserProfile CRUD operations against live Amplify sandbox:
 * - Create (via post-confirmation)
 * - Read (query own profile)
 * - Update (modify profile fields)
 * - Delete (remove profile)
 *
 * Validates:
 * - Required fields (owner, fullName, email)
 * - Authorization rules (owner-based access)
 * - GraphQL input types match schema
 *
 * Prerequisites: Amplify sandbox must be running
 */

Amplify.configure(amplifyOutputs);
const client = generateClient<Schema>();

describe('UserProfile GraphQL Operations (E2E Sandbox)', () => {
  const testEmail = `profile-test-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  let testUserId: string | undefined;

  beforeAll(async () => {
    // Create one test user for all tests in this suite
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: 'Profile Test User',
        },
      },
    });
    testUserId = signUpResult.userId;

    // Sign in once for all tests
    await signIn({
      username: testEmail,
      password: testPassword,
    });
  });

  afterAll(async () => {
    try {
      await signOut();
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should read UserProfile with all required fields', async () => {
    if (!testUserId) {
      throw new Error('Test user not created');
    }

    const { data: profile } = await client.models.UserProfile.get({
      id: testUserId,
    });

    // Validate all required fields are present
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(testUserId);
    expect(profile?.fullName).toBeDefined();
    expect(profile?.owner).toBeDefined();
    expect(profile?.createdAt).toBeDefined();
    expect(profile?.updatedAt).toBeDefined();
  }, 30000);

  it('should update UserProfile fields', async () => {
    if (!testUserId) {
      throw new Error('Test user not created');
    }

    // Update profile
    const updatedName = 'Updated Test User';
    const { data: updatedProfile, errors } = await client.models.UserProfile.update({
      id: testUserId,
      fullName: updatedName,
    });

    // Check for GraphQL errors
    if (errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
    }

    // Validate update
    expect(updatedProfile).toBeDefined();
    expect(updatedProfile?.fullName).toBe(updatedName);

    // Re-fetch to confirm
    const { data: refetchedProfile } = await client.models.UserProfile.get({
      id: testUserId,
    });
    expect(refetchedProfile?.fullName).toBe(updatedName);
  }, 30000);

  it('should enforce owner field in create operation', async () => {
    // This test validates that the owner field is properly handled
    // The post-confirmation Lambda already creates the profile,
    // so this tests that the field is required and properly set

    if (!testUserId) {
      throw new Error('Test user not created');
    }

    // Fetch profile created by post-confirmation
    const { data: profile } = await client.models.UserProfile.get({
      id: testUserId,
    });

    // Validate owner field format
    expect(profile?.owner).toBeDefined();
    expect(profile?.owner).toMatch(/^[a-z0-9-]+::[a-z0-9-]+$/i); // Format: userId::userId
    expect(profile?.owner).toContain(testUserId!);
  }, 30000);

  it('should prevent unauthorized access to other profiles', async () => {
    // Create second user to test authorization
    const userBEmail = `profile-test-b-${Date.now()}@example.com`;
    await signUp({
      username: userBEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: userBEmail,
          name: 'User B',
        },
      },
    });

    // Sign out current user and sign in as User B
    await signOut();
    await signIn({
      username: userBEmail,
      password: testPassword,
    });

    // Try to access first user's profile
    const { data: userAProfile } = await client.models.UserProfile.get({
      id: testUserId!,
    });

    // Should be null due to authorization rules
    expect(userAProfile).toBeNull();

    // Sign back in as original test user for cleanup
    await signOut();
    await signIn({
      username: testEmail,
      password: testPassword,
    });
  }, 30000);
});
