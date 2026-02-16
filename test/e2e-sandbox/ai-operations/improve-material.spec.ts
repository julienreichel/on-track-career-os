import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, signUp } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import * as amplifyOutputs from '../../../amplify_outputs.json';
import type { Schema } from '@amplify/data/resource';

Amplify.configure(amplifyOutputs);
const client = generateClient<Schema>({ authMode: 'userPool' });

describe('AI Operations - Improve Material (E2E Sandbox)', () => {
  const testEmail = `improve-material-${Date.now()}@example.com`;
  const testPassword = 'ImproveMaterial123!';
  let testUserId: string | undefined;

  beforeAll(async () => {
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: 'Improve Material Tester',
        },
      },
    });

    testUserId = signUpResult.userId;
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 30000);

  it('is registered and returns markdown output', async () => {
    const result = await client.queries.improveMaterial({
      language: 'en',
      materialType: 'cv',
      currentMarkdown: `# Alex Candidate

## Summary
Engineer with strong delivery background and measurable impact in SaaS products.

## Experience
### Staff Engineer — Acme
- Led delivery initiatives across four squads and reduced lead time by 72%.
- Improved reliability from 99.2% to 99.95% through observability standards.
- Mentored six engineers and improved onboarding speed.

## Skills
TypeScript, AWS, Leadership, Architecture, Product collaboration.`,
      instructions: {
        presets: ['More results-focused', 'More concise'],
        note: 'Strengthen role targeting while preserving facts.',
      },
      improvementContext: {
        overallScore: 61,
        dimensionScores: {
          atsReadiness: 66,
          clarityFocus: 63,
          targetedFitSignals: 54,
          evidenceStrength: 60,
        },
        decision: {
          label: 'borderline',
          readyToApply: false,
          rationaleBullets: ['Targeted fit needs clearer evidence', 'Summary can be better aligned'],
        },
        missingSignals: ['Cross-functional stakeholder outcomes'],
        topImprovements: [
          {
            title: 'Improve summary targeting',
            action: 'Improve top summary alignment with target role',
            impact: 'high',
            target: { document: 'cv', anchor: 'summary' },
          },
        ],
        notes: {
          atsNotes: ['Use target role keywords in summary'],
          humanReaderNotes: ['Tighten first section for better scanability'],
        },
      },
      profile: {
        fullName: 'Alex Candidate',
        headline: 'Staff Engineer',
        strengths: ['Leadership'],
        aspirations: ['Scale delivery teams'],
      },
      experiences: [
        {
          id: 'exp-1',
          title: 'Staff Engineer',
          companyName: 'Acme',
          experienceType: 'work',
          responsibilities: ['Lead platform initiatives'],
          tasks: ['Improve reliability and delivery speed'],
        },
      ],
    });

    expect(result.errors).toBeUndefined();
    expect(typeof result.data).toBe('string');
    expect((result.data ?? '').trim().length).toBeGreaterThan(0);
  }, 90000);
});
