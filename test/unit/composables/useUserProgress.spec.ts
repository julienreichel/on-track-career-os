import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useUserProgress } from '@/composables/useUserProgress';
import { allowConsoleOutput } from '../../setup/console-guard';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

const authUserId = ref<string | null>('user-1');
const mockLoadUserId = vi.fn();

const jobsRef = ref([
  {
    id: 'job-1',
    title: 'Engineer',
    status: 'complete',
  },
]);
const mockListJobs = vi.fn();

const mockGetProgressSnapshot = vi.fn();

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: authUserId,
    loadUserId: mockLoadUserId,
  }),
}));

vi.mock('@/composables/useJobAnalysis', () => ({
  useJobAnalysis: () => ({
    jobs: jobsRef,
    listJobs: mockListJobs,
  }),
}));

vi.mock('@/domain/user-profile/UserProfileService', () => ({
  UserProfileService: vi.fn().mockImplementation(() => ({
    getProgressSnapshot: mockGetProgressSnapshot,
  })),
}));

const buildSnapshot = () => ({
  profile: { id: 'user-1', fullName: 'Test User' } as UserProfile,
  experiences: [{ id: 'exp-1' }],
  stories: [],
  personalCanvas: null,
  cvs: [{ id: 'cv-1', jobId: 'job-1' }],
  coverLetters: [],
  speechBlocks: [],
  matchingSummaries: [],
});

describe('useUserProgress', () => {
  beforeEach(() => {
    mockLoadUserId.mockReset();
    mockListJobs.mockReset();
    mockGetProgressSnapshot.mockReset();
    authUserId.value = 'user-1';
    jobsRef.value = [];
  });

  it('loads snapshot and computes progress inputs', async () => {
    jobsRef.value = [];
    mockListJobs.mockResolvedValue(jobsRef.value);
    mockGetProgressSnapshot.mockResolvedValue(buildSnapshot());

    const progress = useUserProgress();
    await progress.load();

    expect(mockListJobs).toHaveBeenCalled();
    expect(progress.inputs.value?.cvCount).toBe(1);
    expect(progress.inputs.value?.experienceCount).toBe(1);
    expect(progress.state.value).not.toBeNull();
    expect(progress.nextAction.value).not.toBeNull();
  });

  it('sets error when user id is missing', async () => {
    authUserId.value = null;
    mockLoadUserId.mockResolvedValue(undefined);
    mockGetProgressSnapshot.mockResolvedValue(null);

    const progress = useUserProgress();
    await allowConsoleOutput(async () => {
      await progress.load();
    });

    expect(progress.error.value).toBeTruthy();
    expect(progress.state.value).toBeNull();
  });
});
