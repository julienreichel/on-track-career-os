import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useBadges } from '@/composables/useBadges';
import type { ProgressInputs, UserProgressState } from '@/domain/onboarding';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

const toastAdd = vi.fn();

vi.mock('#app', () => ({
  useToast: () => ({
    add: toastAdd,
  }),
}));

vi.mock('#imports', () => ({
  useToast: () => ({
    add: toastAdd,
  }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params?.badge ? `${key}:${params.badge}` : key,
  }),
}));

const mockLoad = vi.fn();

const progressInputs = ref<ProgressInputs | null>(null);
const progressState = ref<UserProgressState | null>(null);
const progressProfile = ref<UserProfile | null>(null);

vi.mock('@/composables/useUserProgress', () => ({
  useUserProgress: () => ({
    load: mockLoad,
    inputs: progressInputs,
    state: progressState,
    profile: progressProfile,
  }),
}));

const updateUserProfile = vi.fn();

vi.mock('@/domain/user-profile/UserProfileService', () => ({
  UserProfileService: vi.fn().mockImplementation(() => ({
    updateUserProfile,
  })),
}));

const baseInputs: ProgressInputs = {
  profile: null,
  cvCount: 0,
  experiencesCount: 1,
  storiesCount: 1,
  personalCanvasCount: 0,
  jobsCount: 0,
  matchingSummaryCount: 0,
  tailoredCvCount: 0,
  tailoredCoverLetterCount: 0,
  tailoredSpeechCount: 1,
};

const baseState: UserProgressState = {
  phase: 'phase1',
  phase1: { isComplete: true, missing: [] },
  phase2A: { isComplete: false, missing: ['jobUploaded', 'matchingSummary'] },
  phase2B: { isComplete: false, missing: ['profileDepth', 'personalCanvas'] },
  phase3: { isComplete: false, missing: ['tailoredCv', 'tailoredCoverLetter'] },
};

describe('useBadges', () => {
  beforeEach(() => {
    toastAdd.mockClear();
    updateUserProfile.mockClear();
    mockLoad.mockResolvedValue(undefined);
    progressInputs.value = null;
    progressState.value = null;
    progressProfile.value = null;
  });

  it('persists newly earned badges and marks them as seen', async () => {
    progressInputs.value = { ...baseInputs };
    progressState.value = { ...baseState };
    progressProfile.value = {
      id: 'user-1',
      earnedBadges: [],
    } as UserProfile;

    const badges = useBadges();
    await badges.load();

    expect(updateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({ earnedBadges: expect.arrayContaining(['grounded', 'pitchReady']) })
    );
    expect(toastAdd).toHaveBeenCalled();
  });

  it('does not persist when no new badges are earned', async () => {
    progressInputs.value = { ...baseInputs };
    progressState.value = { ...baseState };
    progressProfile.value = {
      id: 'user-1',
      earnedBadges: ['grounded', 'pitchReady'],
    } as UserProfile;

    const badges = useBadges();
    await badges.load();

    expect(updateUserProfile).not.toHaveBeenCalled();
    expect(toastAdd).not.toHaveBeenCalled();
  });
});
