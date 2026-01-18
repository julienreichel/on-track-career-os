import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useActiveJobsDashboard } from '@/composables/useActiveJobsDashboard';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';

const jobsRef = ref<JobDescription[]>([]);
const mockListJobs = vi.fn();

const cvItems = ref<CVDocument[]>([]);
const mockLoadCv = vi.fn();

const coverItems = ref<CoverLetter[]>([]);
const mockLoadCover = vi.fn();

const speechItems = ref<SpeechBlock[]>([]);
const mockLoadSpeech = vi.fn();

vi.mock('@/composables/useJobAnalysis', () => ({
  useJobAnalysis: () => ({
    jobs: jobsRef,
    listJobs: mockListJobs,
  }),
}));

vi.mock('@/composables/useCvDocuments', () => ({
  useCvDocuments: () => ({
    items: cvItems,
    loadAll: mockLoadCv,
  }),
}));

vi.mock('@/application/cover-letter/useCoverLetters', () => ({
  useCoverLetters: () => ({
    items: coverItems,
    loadAll: mockLoadCover,
  }),
}));

vi.mock('@/application/speech-block/useSpeechBlocks', () => ({
  useSpeechBlocks: () => ({
    items: speechItems,
    loadAll: mockLoadSpeech,
  }),
}));

const buildJob = (overrides: Partial<JobDescription>): JobDescription =>
  ({
    id: 'job-1',
    title: 'Lead Engineer',
    status: 'complete',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }) as JobDescription;

describe('useActiveJobsDashboard', () => {
  beforeEach(() => {
    jobsRef.value = [];
    cvItems.value = [];
    coverItems.value = [];
    speechItems.value = [];
    mockListJobs.mockReset();
    mockLoadCv.mockReset();
    mockLoadCover.mockReset();
    mockLoadSpeech.mockReset();
  });

  it('loads jobs and materials once', async () => {
    const dashboard = useActiveJobsDashboard();
    await dashboard.load();

    expect(mockListJobs).toHaveBeenCalled();
    expect(mockLoadCv).toHaveBeenCalled();
    expect(mockLoadCover).toHaveBeenCalled();
    expect(mockLoadSpeech).toHaveBeenCalled();
  });

  it('prefers match generation when job is not analyzed', () => {
    jobsRef.value = [buildJob({ status: 'complete' })];

    const dashboard = useActiveJobsDashboard();
    const [state] = dashboard.states.value;

    expect(state.matchStatus).toBe('pending');
    expect(state.matchLabelKey).toBe('dashboard.activeJobs.match.naValue');
    expect(state.cta.labelKey).toBe('dashboard.activeJobs.cta.generateMatch');
  });

  it('suggests CV when match is ready and materials are missing', () => {
    jobsRef.value = [
      buildJob({
        status: 'analyzed',
        matchingSummaries: [{ overallScore: 82, updatedAt: '2024-01-03T00:00:00.000Z' }],
      }),
    ];

    const dashboard = useActiveJobsDashboard();
    const [state] = dashboard.states.value;

    expect(state.matchStatus).toBe('ready');
    expect(state.matchLabelKey).toBe('dashboard.activeJobs.match.value');
    expect(state.matchLabelParams).toEqual({ score: 82 });
    expect(state.materialsMissing).toEqual(['cv', 'coverLetter', 'speech']);
    expect(state.cta.labelKey).toBe('dashboard.activeJobs.cta.generateCv');
  });

  it('orders incomplete jobs first and limits to three', () => {
    jobsRef.value = [
      buildJob({ id: 'job-1', status: 'analyzed', updatedAt: '2024-01-10T00:00:00.000Z' }),
      buildJob({ id: 'job-2', status: 'complete', updatedAt: '2024-01-11T00:00:00.000Z' }),
      buildJob({ id: 'job-3', status: 'analyzed', updatedAt: '2024-01-12T00:00:00.000Z' }),
      buildJob({ id: 'job-4', status: 'complete', updatedAt: '2024-01-13T00:00:00.000Z' }),
    ];

    const dashboard = useActiveJobsDashboard();
    const states = dashboard.states.value;

    expect(states).toHaveLength(3);
    expect(states[0]?.jobId).toBe('job-4');
    expect(states[1]?.jobId).toBe('job-3');
  });
});
