<template>
  <UPage>
    <UPageHeader
      :title="t('profile.title')"
      :description="t('profile.description')"
      :links="headerLinks"
    />

    <UPageBody>
      <GuidanceBanner v-if="guidance.banner" :banner="guidance.banner" class="mb-6" />

      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="error"
      />

      <USkeleton v-if="loading" class="h-40 rounded-xl" />
      <NuxtLink
        v-else
        to="/profile/full"
        class="block cursor-pointer"
        :aria-label="t('profile.summary.viewFullProfile')"
      >
        <ProfileSummaryCard
          :profile="profile"
          :photo-url="photoPreviewUrl"
          class="transition hover:bg-elevated/50"
        />
      </NuxtLink>

      <UCard class="mt-6">
        <UPageGrid>
          <UPageCard
            :title="t('profile.links.experiences')"
            :description="t('profile.links.experiencesDescription')"
            icon="i-heroicons-briefcase"
            to="/profile/experiences"
          />

          <UPageCard
            :title="t('profile.links.starStories')"
            :description="t('profile.links.starStoriesDescription')"
            icon="i-heroicons-star"
            to="/profile/stories"
          />

          <UPageCard
            :title="t('profile.links.personalCanvas')"
            :description="t('profile.links.personalCanvasDescription')"
            icon="i-heroicons-squares-2x2"
            to="/profile/canvas"
          />
        </UPageGrid>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGuidance } from '@/composables/useGuidance';
import { useUserProgress } from '@/composables/useUserProgress';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PageHeaderLink } from '@/types/ui';
import GuidanceBanner from '@/components/guidance/GuidanceBanner.vue';

const { t } = useI18n();
const profile = ref<UserProfile | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const photoPreviewUrl = ref<string | null>(null);
const profilePhotoService = new ProfilePhotoService();
const progress = useUserProgress();
const { guidance } = useGuidance('profile', {}, { progress });

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.back'),
    icon: 'i-heroicons-arrow-left',
    to: '/',
  },
]);

const loadPhotoPreview = async (key: string | null | undefined) => {
  if (!key) {
    photoPreviewUrl.value = null;
    return;
  }
  try {
    photoPreviewUrl.value = await profilePhotoService.getSignedUrl(key);
  } catch (err) {
    console.error('[profile-summary] Failed to load photo preview:', err);
    photoPreviewUrl.value = null;
  }
};

watch(
  () => progress.profile.value,
  async (newProfile) => {
    if (!newProfile) return;
    try {
      profile.value = newProfile;
      loading.value = false;
      await loadPhotoPreview(profile.value?.profilePhotoKey);
    } catch (err) {
      console.error('[profile-summary] Failed to load profile:', err);
      error.value = t('profile.messages.loadError');
      loading.value = false;
    }
  },
  { immediate: true }
);

watch(
  () => progress.error.value,
  (progressError) => {
    if (!progressError) {
      return;
    }
    error.value = progressError;
    loading.value = false;
  },
  { immediate: true }
);

void progress.load();
</script>
