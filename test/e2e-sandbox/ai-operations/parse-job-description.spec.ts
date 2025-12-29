import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import * as amplifyOutputs from '../../../amplify_outputs.json';
import type { Schema } from '@amplify/data/resource';
import { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';

/**
 * Sandbox Tests — ai.parseJobDescription
 *
 * These tests verify the Lambda is wired through Amplify GraphQL and returns data
 * that maps 1:1 to the JobDescription model.
 *
 * Preconditions: Amplify sandbox (npm run dev -- --sandbox) must be running.
 */

Amplify.configure(amplifyOutputs);
const client = generateClient<Schema>({ authMode: 'userPool' });
let repository: AiOperationsRepository;

describe('AI Operations - Parse Job Description (E2E Sandbox)', () => {
  const testEmail = `job-parse-${Date.now()}@example.com`;
  const testPassword = 'JobParse123!';
  let testUserId: string | undefined;

  beforeAll(async () => {
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: 'Job Parse Tester',
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
      // Ignore sign-out errors
    }
  });

  afterAll(async () => {
    try {
      if (testUserId) {
        await signIn({ username: testEmail, password: testPassword });
        await client.mutations.deleteUserProfileWithAuth({ userId: testUserId });
        await signOut().catch(() => {});
        console.log('Test user cleaned up:', testUserId);
        testUserId = undefined;
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 30000);

  it('should parse job description text into structured fields', async () => {
    const jobText = `
Senior Product Marketing Manager

About the role
- Lead go-to-market launches for our B2B analytics platform
- Partner with Product to translate insights into positioning
- Enable Sales with concise messaging and competitive playbooks

Requirements
- 6+ years in SaaS product marketing
- Comfortable working with enterprise customers and data tools
- Exceptional storytelling and stakeholder management

Success in 12 months means accelerating enterprise adoption by 30% and reducing deal cycles.
The team currently struggles with fragmented messaging and lack of unified positioning.
`.trim();

    const parsed = await repository.parseJobDescription(jobText);

    console.log(parsed);

    expect(typeof parsed.title).toBe('string');
    expect(typeof parsed.roleSummary).toBe('string');
    expect(Array.isArray(parsed.responsibilities)).toBe(true);
    expect(Array.isArray(parsed.requiredSkills)).toBe(true);
    expect(Array.isArray(parsed.behaviours)).toBe(true);
    expect(Array.isArray(parsed.successCriteria)).toBe(true);
    expect(Array.isArray(parsed.explicitPains)).toBe(true);

    expect(parsed.title).toContain('Product');
    expect(parsed.responsibilities.length).toBeGreaterThan(0);
    expect(parsed.requiredSkills.length).toBeGreaterThan(0);
    expect(parsed.successCriteria.length).toBeGreaterThan(0);
  });
});
