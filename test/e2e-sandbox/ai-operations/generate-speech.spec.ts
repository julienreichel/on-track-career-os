import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import * as amplifyOutputs from '../../../amplify_outputs.json';
import type { Schema } from '@amplify/data/resource';
import { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';

Amplify.configure(amplifyOutputs);
const client = generateClient<Schema>({ authMode: 'userPool' });
let repository: AiOperationsRepository;

describe('AI Operations - Generate Speech (E2E Sandbox)', () => {
  const testEmail = `speech-${Date.now()}@example.com`;
  const testPassword = 'SpeechBlock123!';
  let testUserId: string | undefined;

  beforeAll(async () => {
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: 'Speech Block Tester',
        },
      },
    });

    testUserId = signUpResult.userId;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    repository = new AiOperationsRepository(client.queries);
  }, 30000);

  beforeEach(async () => {
    await signIn({ username: testEmail, password: testPassword });
  });

  afterEach(async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
  });

  afterAll(async () => {
    try {
      if (testUserId) {
        await signIn({ username: testEmail, password: testPassword });
        await client.mutations.deleteUserProfileWithAuth({ userId: testUserId });
        await signOut().catch(() => {});
        testUserId = undefined;
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 30000);

  it('generates speech blocks from structured inputs', async () => {
    const speech = await repository.generateSpeech({
      profile: {
        fullName: 'Casey Candidate',
        headline: 'Engineering Lead',
        strengths: ['Mentorship', 'Systems thinking'],
      },
      experiences: [
        {
          title: 'Engineering Manager',
          companyName: 'Atlas Robotics',
          responsibilities: ['Grow teams', 'Drive strategy'],
          achievements: ['Reduced incidents by 30%'],
        },
      ],
      jobDescription: {
        title: 'Head of Engineering',
        roleSummary: 'Scale teams with reliable delivery',
      },
    });
    console.log(speech);

    expect(typeof speech.elevatorPitch).toBe('string');
    expect(typeof speech.careerStory).toBe('string');
    expect(typeof speech.whyMe).toBe('string');
  });
});
