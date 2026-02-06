import { computed, ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { ProgressInputs, UserProgressState } from '@/domain/onboarding';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import {
  computeUserProgressState,
  getNextAction,
  getUnlockableFeatures,
} from '@/domain/onboarding';

export type UseUserProgress = ReturnType<typeof useUserProgress>;

type ProgressSnapshot = NonNullable<Awaited<ReturnType<UserProfileService['getProgressSnapshot']>>>;

export function useUserProgress() {
  const auth = useAuthUser();
  const jobAnalysis = useJobAnalysis();
  const profileService = new UserProfileService();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const state = ref<UserProgressState | null>(null);
  const profile = ref<UserProfile | null>(null);
  const inputs = ref<ProgressInputs | null>(null);
  const snapshot = ref<ProgressSnapshot | null>(null);
  const hasLoaded = ref(false);
  let loadPromise: Promise<void> | null = null;

  const nextAction = computed(() => (state.value ? getNextAction(state.value) : null));
  const unlockableFeatures = computed(() =>
    state.value ? getUnlockableFeatures(state.value) : null
  );

  const load = async () => {
    if (hasLoaded.value) {
      return loadPromise ?? Promise.resolve();
    }

    if (loading.value) {
      return loadPromise ?? Promise.resolve();
    }

    loading.value = true;
    error.value = null;

    loadPromise = (async () => {
      try {
        if (!auth.userId.value) {
          await auth.loadUserId();
        }

        const userId = auth.userId.value;
        if (!userId) {
          throw new Error('Missing user information');
        }

        if (jobAnalysis.jobs.value.length === 0) {
          await jobAnalysis.listJobs();
        }

        const loadedSnapshot = await profileService.getProgressSnapshot(userId);
        if (!loadedSnapshot) {
          throw new Error('User profile not found');
        }

        const jobs = jobAnalysis.jobs.value;
        const tailoredCvs = loadedSnapshot.cvs.filter((doc) => Boolean(doc.jobId));
        const tailoredCoverLetters = loadedSnapshot.coverLetters.filter((doc) =>
          Boolean(doc.jobId)
        );
        const tailoredSpeechBlocks = loadedSnapshot.speechBlocks.filter((doc) =>
          Boolean(doc.jobId)
        );

        const progressInputs: ProgressInputs = {
          profile: loadedSnapshot.profile,
          cvCount: loadedSnapshot.cvs.length,
          experienceCount: loadedSnapshot.experiences.length,
          storyCount: loadedSnapshot.stories.length,
          personalCanvasCount: loadedSnapshot.personalCanvas ? 1 : 0,
          jobCount: jobs.length,
          matchingSummaryCount: loadedSnapshot.matchingSummaries.length,
          tailoredCvCount: tailoredCvs.length,
          tailoredCoverLetterCount: tailoredCoverLetters.length,
          tailoredSpeechCount: tailoredSpeechBlocks.length,
          companyCanvasCount: 0, // TODO: Add company canvases to progress snapshot
          hasCustomTemplate: false, // TODO: Implement custom template tracking
        };

        snapshot.value = loadedSnapshot;
        profile.value = loadedSnapshot.profile;
        inputs.value = progressInputs;
        state.value = computeUserProgressState(progressInputs);
        hasLoaded.value = true;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'progress.errors.loadFailed';
        state.value = null;
        profile.value = null;
        inputs.value = null;
        snapshot.value = null;
        hasLoaded.value = false;
        console.error('[useUserProgress] Failed to load progress', err);
      } finally {
        loading.value = false;
        loadPromise = null;
      }
    })();

    return loadPromise;
  };

  const refresh = async () => {
    hasLoaded.value = false;
    await load();
  };

  return {
    state,
    profile,
    inputs,
    snapshot,
    nextAction,
    unlockableFeatures,
    loading,
    error,
    load,
    refresh,
  };
}
