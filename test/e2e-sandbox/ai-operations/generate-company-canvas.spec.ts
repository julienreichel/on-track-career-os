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

describe('AI Operations - Generate Company Canvas (E2E Sandbox)', () => {
  const testEmail = `company-canvas-${Date.now()}@example.com`;
  const testPassword = 'CompanyCanvas123!';
  let testUserId: string | undefined;

  beforeAll(async () => {
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: 'Company Canvas Tester',
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

  it('generates BMC blocks from structured inputs', async () => {
    const companyProfile = {
      companyName: 'Atlas Robotics',
      productsServices: ['Autonomous inspection drones'],
      targetMarkets: ['Energy utilities'],
      customerSegments: ['Grid operators'],
    };

    const signals = {
      marketChallenges: ['Aging infrastructure'],
      internalPains: ['Manual inspections'],
      partnerships: ['Drone hardware OEMs'],
      hiringFocus: ['Field engineers'],
      strategicNotes: ['Expanding into LATAM'],
    };

    const canvas = await repository.generateCompanyCanvas({
      companyProfile,
      signals,
      additionalNotes: ['Prioritize safety compliance'],
    });

    expect(canvas.companyName).toContain('Atlas');
    expect(Array.isArray(canvas.valuePropositions)).toBe(true);
    expect(Array.isArray(canvas.customerSegments)).toBe(true);
    expect(typeof canvas.analysisSummary).toBe('string');
    expect(typeof canvas.confidence).toBe('number');
  });
});
