import { describe, it, expect } from 'vitest';
import { buildTailoringContext } from '@/application/tailoring/buildTailoringContext';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { Company } from '@/domain/company/Company';

describe('buildTailoringContext', () => {
  const profile: UserProfile = {
    id: 'user-1',
    fullName: 'Jane Doe',
  } as UserProfile;

  const job: JobDescription = {
    id: 'job-1',
    title: 'Product Manager',
  } as JobDescription;

  const summary: MatchingSummary = {
    id: 'summary-1',
    overallScore: 78,
    scoreBreakdown: {
      skillFit: 40,
      experienceFit: 20,
      interestFit: 8,
      edge: 10,
    },
    recommendation: 'maybe',
    reasoningHighlights: ['Strong product experience'],
    strengthsForThisRole: ['User research'],
    skillMatch: ['[MATCH] Roadmapping — led quarterly planning'],
    riskyPoints: ['Risk: Limited B2B. Mitigation: emphasize transferable wins.'],
    impactOpportunities: ['Improve onboarding'],
    tailoringTips: ['Highlight analytics impact'],
    generatedAt: new Date().toISOString(),
    needsUpdate: false,
  } as MatchingSummary;

  it('builds a minimal tailored payload', () => {
    const result = buildTailoringContext({
      userProfile: profile,
      job,
      matchingSummary: summary,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.language).toBe('en');
    expect(result.value.userProfile).toEqual({ fullName: 'Jane Doe' });
    expect(result.value.jobDescription).toEqual({ title: 'Product Manager' });
    expect(result.value.matchingSummary.overallScore).toBe(78);
    expect(result.value.matchingSummary.recommendation).toBe('maybe');
  });

  it('includes company summary when present and excludes large fields', () => {
    const company: Company = {
      id: 'company-1',
      companyName: 'Acme Corp',
      industry: 'Logistics',
      sizeRange: '201-500',
      website: 'https://acme.example',
      description: 'Supply chain software',
      rawNotes: 'Confidential notes',
      productsServices: ['Platform'],
      targetMarkets: ['Retail'],
      customerSegments: ['Enterprise'],
      canvas: {} as Company['canvas'],
    } as Company;

    const result = buildTailoringContext({
      userProfile: profile,
      job,
      matchingSummary: summary,
      company,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.company).toEqual({
      companyName: 'Acme Corp',
      industry: 'Logistics',
      sizeRange: '201-500',
      website: 'https://acme.example',
      description: 'Supply chain software',
    });
    expect(result.value.company).not.toHaveProperty('rawNotes');
    expect(result.value.company).not.toHaveProperty('canvas');
    expect(result.value.company).not.toHaveProperty('productsServices');
  });

  it('returns an error when job is missing', () => {
    const result = buildTailoringContext({
      userProfile: profile,
      matchingSummary: summary,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toMatch(/job/i);
  });

  it('returns an error when matching summary is missing', () => {
    const result = buildTailoringContext({
      userProfile: profile,
      job,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toMatch(/matching summary/i);
  });
});
