import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useOnboardingWizard } from '@/composables/useOnboardingWizard';
import type { UserProgressState } from '@/domain/onboarding';

vi.mock('@/composables/useAnalytics', () => ({
  useAnalytics: () => ({
    captureEvent: vi.fn(),
  }),
}));

const authUserId = ref('user-1');
const mockLoadUserId = vi.fn();

const progressState = ref<UserProgressState | null>(null);
const mockProgressLoad = vi.fn();
const mockProgressRefresh = vi.fn();

const mockParseFile = vi.fn();
const extractedExperiences = ref([{ title: 'Role', startDate: '2020-01-01' }]);
const extractedText = ref('resume');
const extractedProfile = ref({ fullName: 'Test User' });
const parsedCv = ref({ rawText: 'resume' });

const mockImportExperiences = vi.fn();
const mockMergeProfile = vi.fn();

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: authUserId,
    loadUserId: mockLoadUserId,
  }),
}));

vi.mock('@/composables/useUserProgress', () => ({
  useUserProgress: () => ({
    state: progressState,
    load: mockProgressLoad,
    refresh: mockProgressRefresh,
  }),
}));

vi.mock('@/composables/useCvParsing', () => ({
  useCvParsing: () => ({
    parseFile: mockParseFile,
    extractedExperiences,
    extractedText,
    extractedProfile,
    aiOps: {
      parsedCv,
    },
  }),
}));

vi.mock('@/composables/useExperienceImport', () => ({
  useExperienceImport: () => ({
    importExperiences: mockImportExperiences,
  }),
}));

vi.mock('@/composables/useProfileMerge', () => ({
  useProfileMerge: () => ({
    mergeProfile: mockMergeProfile,
  }),
}));

const buildState = (missing: string[]): UserProgressState =>
  ({
    phase: 'phase1',
    phase1: { isComplete: false, missing },
    phase2A: { isComplete: false, missing: ['jobUploaded', 'matchingSummary'] },
    phase2B: { isComplete: false, missing: ['profileDepth', 'stories', 'personalCanvas'] },
    phase3: { isComplete: false, missing: ['tailoredCv', 'tailoredCoverLetter', 'tailoredSpeech'] },
  }) as UserProgressState;

describe('useOnboardingWizard', () => {
  beforeEach(() => {
    mockLoadUserId.mockReset();
    mockProgressLoad.mockReset();
    mockProgressRefresh.mockReset();
    mockParseFile.mockReset();
    mockImportExperiences.mockReset();
    mockMergeProfile.mockReset();
    progressState.value = buildState(['cvUploaded']);
  });

  it('sets current step based on required onboarding step', async () => {
    const wizard = useOnboardingWizard();

    await wizard.load();

    expect(mockProgressLoad).toHaveBeenCalled();
    expect(wizard.currentStep.value).toBe('cv-upload');
  });

  it('advances to experience review after parsing CV', async () => {
    mockParseFile.mockResolvedValue(undefined);
    const wizard = useOnboardingWizard();

    await wizard.handleCvFile(new File(['resume'], 'resume.txt'));

    expect(mockParseFile).toHaveBeenCalled();
    expect(wizard.currentStep.value).toBe('experience-review');
  });

  it('imports experiences and advances to profile basics', async () => {
    mockImportExperiences.mockResolvedValue(undefined);
    mockMergeProfile.mockResolvedValue(undefined);
    progressState.value = buildState(['experienceCount']);

    const wizard = useOnboardingWizard();
    wizard.currentStep.value = 'experience-review';

    await wizard.importExperiences();

    expect(mockImportExperiences).toHaveBeenCalled();
    expect(mockMergeProfile).toHaveBeenCalled();
    expect(mockProgressRefresh).toHaveBeenCalled();
    expect(wizard.currentStep.value).toBe('profile-basics');
  });
});
