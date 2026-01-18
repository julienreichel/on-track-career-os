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

      // Show single calm toast for newly earned badges
      if (diff.newlyEarned.length === 1) {
        const badgeId = diff.newlyEarned[0];
        const badge = badgeId ? badgeCatalogById[badgeId] : undefined;
        if (badge) {
          toast.add({
            title: t(badge.titleKey),
            description: t(badge.descriptionKey),
            color: 'neutral',
            icon: 'i-heroicons-check-circle',
          });
        }
      } else if (diff.newlyEarned.length > 1) {
        toast.add({
          title: t('badges.toast.multiple', { count: diff.newlyEarned.length }),
          description: t('badges.toast.multipleDescription'),
          color: 'neutral',
          icon: 'i-heroicons-check-circle',
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
