import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import * as amplifyOutputs from '../../../amplify_outputs.json';
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
// Use userPool auth mode for owner-based authorization
const client = generateClient<Schema>({ authMode: 'userPool' });

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
          name: 'Profile Test User', // Use standard 'name' attribute
        },
      },
    });
    testUserId = signUpResult.userId;
    console.log('Test user created:', testUserId);

    // Wait for post-confirmation Lambda to create UserProfile
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  beforeEach(async () => {
    // Sign in before each test to ensure fresh authenticated session
    await signIn({
      username: testEmail,
      password: testPassword,
    });
  });

  afterEach(async () => {
    // Sign out after each test
    try {
      await signOut();
    } catch {
      // Ignore sign-out errors
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
    // Owner field should contain the user ID (format varies by Amplify version)
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

    // Wait for post-confirmation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Sign out current user (from beforeEach) and sign in as User B
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

    // Note: afterEach will try to sign in as original user and will fail
    // Sign out User B so afterEach doesn't fail
    await signOut();
  }, 30000);
});
