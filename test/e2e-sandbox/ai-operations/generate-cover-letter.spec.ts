import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import * as amplifyOutputs from '../../../amplify_outputs.json';
import type { Schema } from '@amplify/data/resource';
import { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';

/**
 * E2E Sandbox Test: AI Operations - Generate Cover Letter
 *
 * Tests ai.generateCoverLetter Lambda function against live Amplify sandbox
 *
 * Prerequisites: Amplify sandbox must be running
 */

Amplify.configure(amplifyOutputs);
// Use userPool auth mode for owner-based authorization
const client = generateClient<Schema>({ authMode: 'userPool' });
let repository: AiOperationsRepository;

describe('AI Operations - Generate Cover Letter (E2E Sandbox)', () => {
  const testEmail = `cover-letter-test-${Date.now()}@example.com`;
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
          name: 'Cover Letter Test User',
        },
      },
    });

    testUserId = signUpResult.userId;
    console.log('Test user created:', testUserId);

    // Wait for post-confirmation Lambda to create UserProfile
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Initialize repository with client
    repository = new AiOperationsRepository(client.queries);
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
        // Delete both UserProfile and Cognito user in one call
        await client.mutations.deleteUserProfileWithAuth({ userId: testUserId });
        console.log('Test user cleaned up:', testUserId);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 30000);

  // Test data
  const mockUserProfile = {
    fullName: 'Jane Smith',
    headline: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    seniorityLevel: 'Senior',
    goals: ['Lead technical teams', 'Build scalable systems'],
    aspirations: ['CTO role', 'Technical mentorship'],
    personalValues: ['Innovation', 'Quality'],
    strengths: ['System design', 'Team leadership'],
    interests: ['Open source', 'Sustainability'],
    languages: ['English (Native)', 'Spanish (Conversational)'],
  };

  const mockExperiences = [
    {
      title: 'Senior Software Engineer',
      companyName: 'TechCorp Inc',
      experienceType: 'work',
      startDate: '2021-01-01',
      endDate: '2024-01-01',
      responsibilities: [
        'Led development of microservices architecture',
        'Mentored junior developers',
        'Architected scalable cloud solutions',
      ],
      tasks: [
        'Designed and implemented 12 microservices',
        'Reduced deployment time by 70%',
        'Increased system uptime to 99.9%',
      ],
      achievements: [],
      kpiSuggestions: [],
    },
  ];

  const mockStories = [
    {
      title: 'System Migration Success',
      situation: 'Legacy system causing performance issues',
      task: 'Migrate to microservices architecture',
      action: 'Designed and implemented new architecture',
      result: 'Improved performance by 50%',
    },
  ];

  it('should generate cover letter from minimal input', async () => {
    const result = await repository.generateCoverLetter({
      language: 'en',
      profile: mockUserProfile,
      experiences: mockExperiences,
      stories: [],
      personalCanvas: undefined,
      jobDescription: undefined,
    });

    // Verify result
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain(mockUserProfile.fullName);
    expect(result).toContain(mockExperiences[0].companyName);

    console.log('Generated cover letter:', result.slice(0, 200) + '...');
  });

  it('should generate cover letter with job description', async () => {
    const jobDescription = {
      title: 'Staff Software Engineer',
      seniorityLevel: 'Staff',
      roleSummary: 'Lead technical architecture for a fast-growing startup',
      responsibilities: [
        'Design scalable systems',
        'Lead technical decision making',
        'Mentor engineering team',
      ],
      requiredSkills: ['System design', 'Leadership', 'Microservices'],
      behaviours: ['Collaborative', 'Innovative'],
      successCriteria: ['Technical excellence', 'Team growth'],
      explicitPains: ['Scaling challenges', 'Technical debt'],
      atsKeywords: [],
    };

    const result = await repository.generateCoverLetter({
      language: 'en',
      profile: mockUserProfile,
      experiences: mockExperiences,
      stories: mockStories,
      personalCanvas: undefined,
      jobDescription,
      matchingSummary: {
        overallScore: 75,
        scoreBreakdown: {
          skillFit: 35,
          experienceFit: 20,
          interestFit: 10,
          edge: 10,
        },
        recommendation: 'maybe',
        reasoningHighlights: ['Strong architecture experience'],
        strengthsForThisRole: ['System design leadership'],
        skillMatch: ['[MATCH] Microservices — led migration'],
        riskyPoints: ['Risk: Limited startup scale. Mitigation: highlight adaptability.'],
        impactOpportunities: ['Improve scalability'],
        tailoringTips: ['Emphasize systems architecture wins'],
      },
    });

    // Verify tailored result
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain(mockUserProfile.fullName);
    const keywordCandidates = [
      jobDescription.title,
      jobDescription.roleSummary,
      'startup',
      'scalable',
      'technical debt',
      'microservices',
      'system design',
      'mentoring',
    ];
    const normalizedResult = result.toLowerCase();
    const keywordMatches = keywordCandidates.filter((keyword) =>
      normalizedResult.includes(keyword.toLowerCase())
    );
    expect(keywordMatches.length).toBeGreaterThanOrEqual(3);

    console.log('Generated tailored cover letter:', result.slice(0, 200) + '...');
  });

  it('should validate AI operation is properly configured', async () => {
    // Test with minimal valid input to ensure operation works
    const result = await repository.generateCoverLetter({
      language: 'en',
      profile: {
        fullName: 'Test User',
        headline: 'Developer',
        location: 'Remote',
        seniorityLevel: 'Mid',
        goals: [],
        aspirations: [],
        personalValues: [],
        strengths: [],
        interests: [],
        languages: [],
      },
      experiences: [
        {
          title: 'Developer',
          companyName: 'Test Company',
          experienceType: 'work',
          startDate: '2020-01-01',
          endDate: '2023-01-01',
          responsibilities: ['Code'],
          tasks: ['Development'],
          achievements: [],
          kpiSuggestions: [],
        },
      ],
      stories: [],
      personalCanvas: undefined,
      jobDescription: undefined,
    });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    console.log('Validation test - cover letter generated successfully');
  });
});
