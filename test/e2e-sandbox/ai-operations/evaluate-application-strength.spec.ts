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

describe('AI Operations - Evaluate Application Strength (E2E Sandbox)', () => {
  const testEmail = `application-strength-${Date.now()}@example.com`;
  const testPassword = 'ApplicationStrength123!';
  let testUserId: string | undefined;

  beforeAll(async () => {
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: 'Application Strength Tester',
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

  it('evaluates application strength from job + CV + optional cover letter', async () => {
    const result = await repository.evaluateApplicationStrength({
      job: {
        title: 'Senior Product Manager',
        seniorityLevel: 'Senior',
        roleSummary: 'Lead product strategy and delivery for B2B SaaS.',
        responsibilities: ['Own roadmap', 'Lead stakeholder alignment'],
        requiredSkills: ['Stakeholder management', 'Product strategy', 'Analytics'],
        behaviours: ['Ownership', 'Collaboration'],
        successCriteria: ['Improve activation rate'],
        explicitPains: ['Fragmented roadmap planning'],
        atsKeywords: ['Product strategy', 'Roadmap', 'Stakeholder management'],
      },
      cvText:
        'Senior product manager with 8 years in SaaS. Led roadmap redesign and increased activation by 18%.',
      coverLetterText: '',
      language: 'en',
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);

    expect(result.dimensionScores.atsReadiness).toBeGreaterThanOrEqual(0);
    expect(result.dimensionScores.atsReadiness).toBeLessThanOrEqual(100);

    expect(['strong', 'borderline', 'risky']).toContain(result.decision.label);
    expect(typeof result.decision.readyToApply).toBe('boolean');
    expect(result.decision.rationaleBullets.length).toBeGreaterThanOrEqual(2);
    expect(result.decision.rationaleBullets.length).toBeLessThanOrEqual(5);

    expect(Array.isArray(result.missingSignals)).toBe(true);
    expect(Array.isArray(result.notes.atsNotes)).toBe(true);
    expect(Array.isArray(result.notes.humanReaderNotes)).toBe(true);

    expect(result.topImprovements.length).toBeGreaterThanOrEqual(2);
    result.topImprovements.forEach((item) => {
      expect(['high', 'medium', 'low']).toContain(item.impact);
      expect(['cv', 'coverLetter']).toContain(item.target.document);
      expect(item.target.anchor.length).toBeGreaterThan(0);
    });

    // Empty cover letter path should not return cover-letter-only targets
    expect(result.topImprovements.every((item) => item.target.document === 'cv')).toBe(true);
  });
});
