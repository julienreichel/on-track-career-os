import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useApplicationStrengthPage } from '@/composables/useApplicationStrengthPage';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useAuthUser } from '@/composables/useAuthUser';
import { useApplicationStrengthInputs } from '@/composables/useApplicationStrengthInputs';
import { useApplicationStrengthEvaluator } from '@/composables/useApplicationStrengthEvaluator';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';

vi.mock('@/composables/useJobAnalysis');
vi.mock('@/composables/useAuthUser');
vi.mock('@/composables/useApplicationStrengthInputs');
vi.mock('@/composables/useApplicationStrengthEvaluator');

const pageError = ref<string | null>(null);
const pageErrorMessageKey = ref<string | null>(null);
const setPageError = vi.fn((error: string, key?: string) => {
  pageError.value = error;
  pageErrorMessageKey.value = key || null;
});
const clearPageError = vi.fn(() => {
  pageError.value = null;
  pageErrorMessageKey.value = null;
});

vi.mock('@/composables/useErrorDisplay', () => ({
  useErrorDisplay: () => ({
    pageError,
    pageErrorMessageKey,
    setPageError,
    clearPageError,
    notifyActionError: vi.fn(),
  }),
}));
vi.mock('@/domain/user-profile/UserProfileService');
vi.mock('@/composables/useAnalytics', () => ({
  useAnalytics: () => ({
    captureEvent: vi.fn(),
  }),
}));
vi.mock('@/utils/logError', () => ({
  logError: vi.fn(),
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: { value: 'en' },
  }),
}));

describe('useApplicationStrengthPage', () => {
  const mockJob = {
    id: 'job-1',
    title: 'Software Engineer',
    seniorityLevel: 'Senior',
    roleSummary: 'Build great software',
    responsibilities: ['Code', 'Review'],
    requiredSkills: ['JavaScript', 'TypeScript'],
    behaviours: ['Teamwork'],
    successCriteria: ['Deliver on time'],
    explicitPains: ['Technical debt'],
    atsKeywords: ['software', 'engineer'],
  };

  const mockUserProfile = {
    fullName: 'John Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pageError.value = null;
    pageErrorMessageKey.value = null;

    vi.mocked(useJobAnalysis).mockReturnValue({
      selectedJob: { value: mockJob },
      loadJobWithRelations: vi.fn().mockResolvedValue(undefined),
    } as never);

    vi.mocked(useAuthUser).mockReturnValue({
      userId: { value: 'user-1' },
      loadUserId: vi.fn().mockResolvedValue(undefined),
    } as never);

    vi.mocked(useApplicationStrengthInputs).mockReturnValue({
      canEvaluate: { value: true },
      cvText: { value: 'CV content' },
      coverLetterText: { value: 'Cover letter content' },
      validationErrors: { value: [] },
      reset: vi.fn(),
    } as never);

    vi.mocked(useApplicationStrengthEvaluator).mockReturnValue({
      evaluation: { value: null },
      loading: { value: false },
      evaluate: vi.fn().mockResolvedValue({ overallScore: 80 }),
      reset: vi.fn(),
    } as never);

    vi.mocked(UserProfileService).mockImplementation(
      () =>
        ({
          getFullUserProfile: vi.fn().mockResolvedValue(mockUserProfile),
        }) as never
    );
  });

  it('initializes with expected state', () => {
    const page = useApplicationStrengthPage('job-1');

    expect(page.loading.value).toBe(false);
    expect(page.pageError.value).toBeNull();
    expect(page.hasJob.value).toBe(true);
    expect(page.canEvaluate.value).toBe(true);
  });

  it('loads job and candidate name successfully', async () => {
    const loadJobMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useJobAnalysis).mockReturnValue({
      selectedJob: { value: mockJob },
      loadJobWithRelations: loadJobMock,
    } as never);

    const page = useApplicationStrengthPage('job-1');
    await page.load();

    expect(loadJobMock).toHaveBeenCalledWith('job-1');
    expect(page.loading.value).toBe(false);
    expect(page.pageError.value).toBeNull();
  });

  it('sets error when job not found', async () => {
    vi.mocked(useJobAnalysis).mockReturnValue({
      selectedJob: { value: null },
      loadJobWithRelations: vi.fn().mockResolvedValue(undefined),
    } as never);

    const page = useApplicationStrengthPage('job-1');
    await page.load();

    expect(page.pageErrorMessageKey.value).toBe('applicationStrength.errors.jobNotFound');
  });

  it('evaluates application strength successfully', async () => {
    const evaluateMock = vi.fn().mockResolvedValue({ overallScore: 85 });
    vi.mocked(useApplicationStrengthEvaluator).mockReturnValue({
      evaluation: { value: null },
      loading: { value: false },
      evaluate: evaluateMock,
      reset: vi.fn(),
    } as never);

    const page = useApplicationStrengthPage('job-1');
    const result = await page.evaluate();

    expect(evaluateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        job: expect.objectContaining({
          title: 'Software Engineer',
          responsibilities: ['Code', 'Review'],
        }),
        cvText: 'CV content',
        coverLetterText: 'Cover letter content',
        language: 'en',
      })
    );
    expect(result).toEqual({ overallScore: 85 });
  });

  it('handles evaluation error when job is missing', async () => {
    vi.mocked(useJobAnalysis).mockReturnValue({
      selectedJob: { value: null },
      loadJobWithRelations: vi.fn().mockResolvedValue(undefined),
    } as never);

    const page = useApplicationStrengthPage('job-1');
    const result = await page.evaluate();

    expect(result).toBeNull();
    expect(page.pageErrorMessageKey.value).toBe('applicationStrength.errors.jobNotFound');
  });

  it('clears evaluation and inputs', () => {
    const resetInputs = vi.fn();
    const resetEvaluator = vi.fn();

    vi.mocked(useApplicationStrengthInputs).mockReturnValue({
      canEvaluate: { value: true },
      cvText: { value: '' },
      coverLetterText: { value: '' },
      validationErrors: { value: [] },
      reset: resetInputs,
    } as never);

    vi.mocked(useApplicationStrengthEvaluator).mockReturnValue({
      evaluation: { value: { overallScore: 80 } },
      loading: { value: false },
      evaluate: vi.fn(),
      reset: resetEvaluator,
    } as never);

    const page = useApplicationStrengthPage('job-1');
    page.clear();

    expect(resetInputs).toHaveBeenCalled();
    expect(resetEvaluator).toHaveBeenCalled();
  });
});
