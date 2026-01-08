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

  it('includes optional profile fields when present', () => {
    const enrichedProfile: UserProfile = {
      ...profile,
      strengths: ['Leadership', 'Problem solving'],
      interests: ['AI', 'Product'],
      skills: ['TypeScript', 'Vue'],
      certifications: ['PMP'],
      languages: ['English', 'Spanish'],
    } as UserProfile;

    const result = buildTailoringContext({
      userProfile: enrichedProfile,
      job,
      matchingSummary: summary,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.userProfile.strengths).toEqual(['Leadership', 'Problem solving']);
    expect(result.value.userProfile.interests).toEqual(['AI', 'Product']);
    expect(result.value.userProfile.skills).toEqual(['TypeScript', 'Vue']);
    expect(result.value.userProfile.certifications).toEqual(['PMP']);
    expect(result.value.userProfile.languages).toEqual(['English', 'Spanish']);
  });

  it('includes optional job fields when present', () => {
    const enrichedJob: JobDescription = {
      ...job,
      seniorityLevel: 'Senior',
      roleSummary: 'Lead product initiatives',
      responsibilities: ['Define roadmap', 'Lead team'],
      requiredSkills: ['Strategy', 'Analytics'],
      behaviours: ['Data-driven'],
      successCriteria: ['Ship features'],
      explicitPains: ['Legacy systems'],
    } as JobDescription;

    const result = buildTailoringContext({
      userProfile: profile,
      job: enrichedJob,
      matchingSummary: summary,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.jobDescription.seniorityLevel).toBe('Senior');
    expect(result.value.jobDescription.roleSummary).toBe('Lead product initiatives');
    expect(result.value.jobDescription.responsibilities).toEqual(['Define roadmap', 'Lead team']);
    expect(result.value.jobDescription.requiredSkills).toEqual(['Strategy', 'Analytics']);
    expect(result.value.jobDescription.behaviours).toEqual(['Data-driven']);
    expect(result.value.jobDescription.successCriteria).toEqual(['Ship features']);
    expect(result.value.jobDescription.explicitPains).toEqual(['Legacy systems']);
  });

  it('handles normalizeRecommendation edge cases', () => {
    const summaryWithInvalidRec = {
      ...summary,
      recommendation: 'invalid-value' as never,
    } as MatchingSummary;

    const result = buildTailoringContext({
      userProfile: profile,
      job,
      matchingSummary: summaryWithInvalidRec,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.matchingSummary.recommendation).toBe('maybe');
  });

  it('filters out null/empty strings from arrays', () => {
    const profileWithNulls: UserProfile = {
      ...profile,
      strengths: ['Valid', null, '', '  ', 'Also valid'],
      skills: [null, '', '  '],
    } as unknown as UserProfile;

    const result = buildTailoringContext({
      userProfile: profileWithNulls,
      job,
      matchingSummary: summary,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.userProfile.strengths).toEqual(['Valid', 'Also valid']);
    expect(result.value.userProfile.skills).toBeUndefined();
  });

  it('normalizes numbers properly', () => {
    const summaryWithBadNumbers = {
      ...summary,
      overallScore: 'not-a-number' as never,
      scoreBreakdown: {
        skillFit: Infinity,
        experienceFit: NaN,
        interestFit: null as never,
        edge: undefined as never,
      },
    } as MatchingSummary;

    const result = buildTailoringContext({
      userProfile: profile,
      job,
      matchingSummary: summaryWithBadNumbers,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.matchingSummary.overallScore).toBe(0);
    expect(result.value.matchingSummary.scoreBreakdown.skillFit).toBe(0);
    expect(result.value.matchingSummary.scoreBreakdown.experienceFit).toBe(0);
    expect(result.value.matchingSummary.scoreBreakdown.interestFit).toBe(0);
    expect(result.value.matchingSummary.scoreBreakdown.edge).toBe(0);
  });
});
