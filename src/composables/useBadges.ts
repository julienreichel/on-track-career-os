import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '#imports';
import { useUserProgress } from '@/composables/useUserProgress';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { badgeCatalogById, computeEligibleBadges, diffBadges } from '@/domain/badges';
import type { BadgeDefinition, BadgeId } from '@/domain/badges';

export function useBadges() {
  const { t } = useI18n();
  const toast = useToast();
  const progress = useUserProgress();
  const profileService = new UserProfileService();

  const earnedBadges = ref<BadgeId[]>([]);
  const newlyEarnedBadges = ref<BadgeId[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const earnedBadgeDefinitions = computed<BadgeDefinition[]>(() =>
    earnedBadges.value
      .map((id) => badgeCatalogById[id])
      .filter((badge): badge is BadgeDefinition => Boolean(badge))
  );

  const isBadgeId = (value: string | null | undefined): value is BadgeId =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(badgeCatalogById, value);

  const load = async () => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;

    try {
      await progress.load();

      const inputs = progress.inputs.value;
      const state = progress.state.value;
      const profile = progress.profile.value;

      if (!inputs || !state || !profile) {
        earnedBadges.value = [];
        newlyEarnedBadges.value = [];
        return;
      }

      const existing = (profile.earnedBadges ?? []).filter(isBadgeId);
      const eligible = computeEligibleBadges(inputs, state);
      const diff = diffBadges(existing, eligible);

      earnedBadges.value = diff.allEarned;
      newlyEarnedBadges.value = diff.newlyEarned;

      if (diff.newlyEarned.length > 0) {
        await profileService.updateUserProfile({
          id: profile.id,
          earnedBadges: diff.allEarned,
        });
        profile.earnedBadges = diff.allEarned;
      }

      if (diff.newlyEarned.length > 0) {
        diff.newlyEarned.forEach((badgeId) => {
          const badge = badgeCatalogById[badgeId];
          if (!badge) return;
          toast.add({
            title: t('badges.toast.title', { badge: t(badge.titleKey) }),
            description: t(badge.descriptionKey),
            color: 'primary',
          });
        });
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'badges.errors.loadFailed';
    } finally {
      loading.value = false;
    }
  };

  return {
    earnedBadges,
    newlyEarnedBadges,
    earnedBadgeDefinitions,
    loading,
    error,
    load,
  };
}
