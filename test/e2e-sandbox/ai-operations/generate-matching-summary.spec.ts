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

describe('AI Operations - Generate Matching Summary (E2E Sandbox)', () => {
  const testEmail = `matching-summary-${Date.now()}@example.com`;
  const testPassword = 'MatchingSummary123!';
  let testUserId: string | undefined;

  beforeAll(async () => {
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: 'Matching Summary Tester',
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

  it('generates a matching summary from structured inputs', async () => {
    const summary = await repository.generateMatchingSummary({
      profile: {
        fullName: 'Casey Candidate',
        strengths: ['Mentorship', 'Systems thinking'],
        skills: ['Leadership', 'Typescript'],
      },
      personalCanvas: {
        valueProposition: ['Lead reliable delivery'],
      },
      experiences: [
        {
          title: 'Engineering Manager',
          companyName: 'Atlas Robotics',
          experienceType: 'work',
          responsibilities: ['Grow EMs', 'Drive strategy'],
          tasks: ['Mentor managers', 'Set delivery cadence'],
          achievements: ['Reduced incidents by 30%'],
        },
      ],
      jobDescription: {
        title: 'Head of Engineering',
        seniorityLevel: 'Director',
        roleSummary: 'Lead a multi-team engineering org to deliver reliably.',
        responsibilities: ['Lead multi-team org', 'Drive strategy'],
        requiredSkills: ['Strategic planning', 'Cross-functional leadership'],
        behaviours: [],
        successCriteria: [],
        explicitPains: ['Need predictable delivery'],
        atsKeywords: [],
      },
    });

    expect(typeof summary.overallScore).toBe('number');
    expect(summary.overallScore).toBeGreaterThanOrEqual(0);
    expect(summary.overallScore).toBeLessThanOrEqual(100);
    expect(typeof summary.scoreBreakdown).toBe('object');
    expect(summary.scoreBreakdown).toHaveProperty('skillFit');
    expect(summary.scoreBreakdown).toHaveProperty('experienceFit');
    expect(['apply', 'maybe', 'skip']).toContain(summary.recommendation);
    expect(Array.isArray(summary.reasoningHighlights)).toBe(true);
    expect(Array.isArray(summary.strengthsForThisRole)).toBe(true);
    expect(Array.isArray(summary.skillMatch)).toBe(true);
    expect(Array.isArray(summary.riskyPoints)).toBe(true);
    expect(Array.isArray(summary.impactOpportunities)).toBe(true);
    expect(Array.isArray(summary.tailoringTips)).toBe(true);

    // Validate skill match format
    summary.skillMatch.forEach((item: string) => {
      expect(item).toMatch(/^\[(MATCH|PARTIAL|MISSING|OVER)\]/);
    });
  });
});
