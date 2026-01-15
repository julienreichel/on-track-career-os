import { computed, ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { ProgressInputs, UserProgressState } from '@/domain/onboarding';
import { computeUserProgressState, getNextAction, getUnlockableFeatures } from '@/domain/onboarding';

export function useUserProgress() {
  const auth = useAuthUser();
  const jobAnalysis = useJobAnalysis();
  const profileService = new UserProfileService();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const state = ref<UserProgressState | null>(null);
  const hasLoaded = ref(false);

  const nextAction = computed(() => (state.value ? getNextAction(state.value) : null));
  const unlockableFeatures = computed(() =>
    state.value ? getUnlockableFeatures(state.value) : null
  );

  const load = async () => {
    if (loading.value || hasLoaded.value) {
      return;
    }

    loading.value = true;
    error.value = null;

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

      const snapshot = await profileService.getProgressSnapshot(userId);
      if (!snapshot) {
        throw new Error('User profile not found');
      }

      const jobs = jobAnalysis.jobs.value;
      const tailoredCvs = snapshot.cvs.filter((doc) => Boolean(doc.jobId));
      const tailoredCoverLetters = snapshot.coverLetters.filter((doc) => Boolean(doc.jobId));
      const tailoredSpeechBlocks = snapshot.speechBlocks.filter((doc) => Boolean(doc.jobId));

      const inputs: ProgressInputs = {
        profile: snapshot.profile,
        cvCount: snapshot.cvs.length,
        experiencesCount: snapshot.experiences.length,
        storiesCount: snapshot.stories.length,
        personalCanvasCount: snapshot.personalCanvas ? 1 : 0,
        jobsCount: jobs.length,
        matchingSummaryCount: snapshot.matchingSummaries.length,
        tailoredCvCount: tailoredCvs.length,
        tailoredCoverLetterCount: tailoredCoverLetters.length,
        tailoredSpeechCount: tailoredSpeechBlocks.length,
      };

      state.value = computeUserProgressState(inputs);
      hasLoaded.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'progress.errors.loadFailed';
      state.value = null;
      hasLoaded.value = false;
      console.error('[useUserProgress] Failed to load progress', err);
    } finally {
      loading.value = false;
    }
  };

  const refresh = async () => {
    hasLoaded.value = false;
    await load();
  };

  return {
    state,
    nextAction,
    unlockableFeatures,
    loading,
    error,
    load,
    refresh,
  };
}
