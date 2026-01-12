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

describe('AI Operations - Analyze Company Info (E2E Sandbox)', () => {
  const testEmail = `company-analyze-${Date.now()}@example.com`;
  const testPassword = 'CompanyAnalyze123!';
  let testUserId: string | undefined;

  beforeAll(async () => {
    const signUpResult = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
          name: 'Company Analyze Tester',
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

  it('analyzes research text into structured company profile', async () => {
    const rawText = `
Nova Dynamics builds AI-powered energy analytics for grid operators.
Recent press mentions scalability challenges and a partnership with Siemens.
They are hiring platform engineers focused on data ingestion.
`.trim();

    const analysis = await repository.analyzeCompanyInfo({
      companyName: 'Nova Dynamics',
      industry: 'Energy',
      size: '201-500',
      rawText,
      jobContext: {
        title: 'Head of Platform Engineering',
        summary: 'Needs to ensure reliable grid analytics',
      },
    });

    expect(typeof analysis.companyProfile.companyName).toBe('string');
    expect(Array.isArray(analysis.companyProfile.productsServices)).toBe(true);
  });
});
