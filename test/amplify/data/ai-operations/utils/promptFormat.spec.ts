import { describe, it, expect } from 'vitest';
import { formatAiInputContext } from '@amplify/data/ai-operations/utils/promptFormat';

describe('promptFormat', () => {
  it('renders core profile and list fields in natural language', () => {
    const output = formatAiInputContext({
      language: 'en',
      profile: {
        fullName: 'Casey Candidate',
        headline: 'Engineering Lead',
        location: 'San Francisco, CA',
        strengths: ['Leadership', 'Mentorship'],
        skills: ['Vue.js', 'Systems'],
        languages: ['English'],
      },
      experiences: [],
      stories: [],
      personalCanvas: null,
      jobDescription: null,
      matchingSummary: null,
      company: null,
    });

    expect(output).toContain('LANGUAGE');
    expect(output).toContain('Name: Casey Candidate');
    expect(output).toContain('Headline: Engineering Lead');
    expect(output).toContain('Location: San Francisco, CA');
    expect(output).toContain('Strengths: Leadership, Mentorship');
    expect(output).toContain('Skills: Vue.js, Systems');
    expect(output).toContain('Languages: English');
  });

  it('formats experiences with details and dates', () => {
    const output = formatAiInputContext({
      language: 'en',
      profile: { fullName: 'Casey Candidate' },
      experiences: [
        {
          title: 'Senior Engineer',
          companyName: 'Tech Corp',
          experienceType: 'Work',
          startDate: '2020-01-01',
          endDate: '2023-01-01',
          responsibilities: ['Lead delivery'],
          tasks: ['Ship features'],
          achievements: ['Improved reliability'],
          kpiSuggestions: ['Reduced incidents by 30%'],
        },
      ],
      stories: [],
      personalCanvas: null,
      jobDescription: null,
      matchingSummary: null,
      company: null,
    });

    expect(output).toContain('- Senior Engineer at Tech Corp (Work) — 2020-01-01 - 2023-01-01');
    expect(output).toContain('Responsibilities: Lead delivery');
    expect(output).toContain('Tasks: Ship features');
    expect(output).toContain('Achievements: Improved reliability');
    expect(output).toContain('KPIs: Reduced incidents by 30%');
  });

  it('formats stories with a standard label', () => {
    const output = formatAiInputContext({
      language: 'en',
      profile: { fullName: 'Casey Candidate' },
      experiences: [],
      stories: [
        {
          situation: 'Inherited a struggling team',
          task: 'Stabilize delivery',
          action: 'Introduced mentorship',
          result: 'Improved velocity',
          achievements: ['Raised NPS'],
        },
      ],
      personalCanvas: null,
      jobDescription: null,
      matchingSummary: null,
      company: null,
    });

    expect(output).toContain('STORIES');
    expect(output).toContain('Story 1');
    expect(output).toContain('Situation: Inherited a struggling team');
    expect(output).toContain('Result: Improved velocity');
    expect(output).toContain('Achievements: Raised NPS');
  });

  it('renders job, summary, and company sections in natural language', () => {
    const output = formatAiInputContext({
      language: 'en',
      profile: { fullName: 'Casey Candidate' },
      experiences: [],
      stories: [],
      personalCanvas: {
        valueProposition: ['Lead reliable delivery'],
      },
      jobDescription: {
        title: 'Head of Engineering',
        seniorityLevel: 'Lead',
        roleSummary: 'Scale teams',
        responsibilities: ['Build platforms'],
        requiredSkills: ['Leadership'],
        behaviours: ['Ownership'],
        successCriteria: ['Improve delivery'],
        explicitPains: ['Reliability gaps'],
        atsKeywords: ['Scaling'],
      },
      matchingSummary: {
        overallScore: 78,
        scoreBreakdown: {
          skillFit: 35,
          experienceFit: 25,
          interestFit: 8,
          edge: 10,
        },
        recommendation: 'apply',
        reasoningHighlights: ['Strong leadership'],
        strengthsForThisRole: ['Team scaling'],
        skillMatch: ['Leadership match'],
        riskyPoints: ['Limited B2B'],
        impactOpportunities: ['Improve cadence'],
        tailoringTips: ['Lead with outcomes'],
      },
      company: {
        companyName: 'Acme Systems',
        industry: 'Logistics',
        sizeRange: '201-500',
        website: 'https://acme.example',
        description: 'AI workflow platform',
        productsServices: ['Optimization'],
        targetMarkets: ['Logistics'],
        customerSegments: ['Mid-market'],
        rawNotes: 'Hiring rapidly',
      },
    });

    expect(output).toContain('Value proposition: Lead reliable delivery');
    expect(output).toContain('Title: Head of Engineering');
    expect(output).toContain('Overall score: 78');
    expect(output).toContain('Company: Acme Systems');
  });

  it('omits empty sections when data is missing', () => {
    const output = formatAiInputContext({
      language: 'en',
      profile: null,
      experiences: null,
      stories: null,
      personalCanvas: null,
      jobDescription: null,
      matchingSummary: null,
      company: null,
    });

    expect(output).toContain('LANGUAGE');
    expect(output).not.toContain('PROFILE');
    expect(output).not.toContain('EXPERIENCES');
    expect(output).not.toContain('STORIES');
    expect(output).not.toContain('PERSONAL CANVAS');
    expect(output).not.toContain('TARGET JOB DESCRIPTION');
    expect(output).not.toContain('MATCHING SUMMARY');
    expect(output).not.toContain('COMPANY SUMMARY');
  });
});
