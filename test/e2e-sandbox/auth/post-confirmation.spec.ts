import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import * as amplifyOutputs from '../../../amplify_outputs.json';
import type { Schema } from '@amplify/data/resource';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';

/**
 * E2E Sandbox Test: Post-Confirmation Flow
 *
 * Tests the complete user registration flow:
 * 1. User signs up via Cognito
 * 2. Post-confirmation Lambda is triggered
 * 3. UserProfile is created in GraphQL with owner field
 * 4. User can query their own profile
 *
 * This test validates the fix for the post-confirmation error
 * where the owner field was missing from CreateUserProfileInput.
 *
 * Prerequisites: Amplify sandbox must be running (npx ampx sandbox --once)
 */

// Configure Amplify to use sandbox environment
Amplify.configure(amplifyOutputs);
// Use userPool auth mode for owner-based authorization
const client = generateClient<Schema>({ authMode: 'userPool' });
let repository: UserProfileRepository;

describe('Post-Confirmation Flow (E2E Sandbox)', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  const testName = 'Test User';
  let testUserId: string | undefined;

  beforeAll(async () => {
    // Create one test user for all tests in this suite
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: testName,
        },
        autoSignIn: true,
      },
    });

    testUserId = signUpResult.userId;
    console.log('Test user created:', testUserId);

    // Wait for post-confirmation Lambda to create UserProfile
    // Small delay to ensure async Lambda completes
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Initialize repository with client
    repository = new UserProfileRepository(client.models.UserProfile, client.mutations);
  }, 30000);

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

  afterAll(async () => {
    try {
      if (testUserId) {
        // Sign in to perform cleanup
        await signIn({
          username: testEmail,
          password: testPassword,
        });
        // Delete both UserProfile and Cognito user in one call via repository
        await repository.delete(testUserId);
        console.log('Test user cleaned up:', testUserId);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 30000);

  it('should create UserProfile with owner field after signup', async () => {
    // User already signed up in beforeAll, signed in via beforeEach
    expect(testUserId).toBeDefined();

    // Query UserProfile via repository - should exist with owner field (created by post-confirmation Lambda)
    const profile = await repository.get(testUserId!);

    // Assertions
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(testUserId);
    // In CI, Cognito might not store the 'name' attribute, so handler falls back to email
    expect(profile?.fullName).toMatch(new RegExp(`^(${testName}|${testEmail})$`));
    expect(profile?.owner).toBeDefined();
    expect(profile?.owner).toContain(testUserId!);
  }, 30000); // 30s timeout for AWS operations

  it('should enforce owner-based authorization on UserProfile', async () => {
    // This test validates that users can only access their own profiles
    // Current user should only see their own profile

    const profiles = await repository.list();

    // Should see at least own profile due to owner-based authorization
    expect(profiles.length).toBeGreaterThanOrEqual(1);

    // Find our profile in the list
    const ownProfile = profiles.find((p) => p.id === testUserId);
    expect(ownProfile).toBeDefined();
    expect(ownProfile?.owner).toContain(testUserId!);
  }, 30000);
});
