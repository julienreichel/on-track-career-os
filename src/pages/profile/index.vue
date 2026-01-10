<template>
  <UPage>
    <UPageHeader
      :title="t('profile.title')"
      :description="t('profile.description')"
      :links="headerLinks"
    />

    <UPageBody>
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="error"
      />

      <USkeleton v-if="loading" class="h-40 rounded-xl" />
      <ProfileSummaryCard v-else :profile="profile" :photo-url="photoPreviewUrl" />

      <UCard class="mt-6">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ t('profile.sections.relatedPages') }}
          </h3>
        </template>

        <UPageGrid>
          <UPageCard
            :title="t('profile.summary.viewFullProfile')"
            :description="t('profile.summary.fullProfileDescription')"
            icon="i-heroicons-user-circle"
            to="/profile/full"
            :links="[
              {
                label: t('profile.summary.editFromSummary'),
                icon: 'i-heroicons-pencil-square',
                to: '/profile/full?mode=edit',
              },
            ]"
          />

          <UPageCard
            v-if="showCvUpload"
            :title="t('profile.links.uploadCv')"
            :description="t('profile.links.uploadCvDescription')"
            icon="i-heroicons-document-arrow-up"
            to="/profile/cv-upload"
          />

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

          <UPageCard
            :title="t('profile.links.applications')"
            :description="t('profile.links.applicationsDescription')"
            icon="i-heroicons-document-duplicate"
            to="/applications"
          />

          <UPageCard
            :title="t('profile.links.communication')"
            :description="t('profile.links.communicationDescription')"
            icon="i-heroicons-chat-bubble-left-right"
            disabled
          />
        </UPageGrid>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { useUserProfile } from '@/application/user-profile/useUserProfile';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PageHeaderLink } from '@/types/ui';

const { t } = useI18n();
const router = useRouter();
const { userId } = useAuthUser();

const profile = ref<UserProfile | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const photoPreviewUrl = ref<string | null>(null);
const showCvUpload = ref(false);

const profilePhotoService = new ProfilePhotoService();
const experienceRepo = new ExperienceRepository();

const goToFullProfile = (mode?: 'edit') => {
  void router.push({
    path: '/profile/full',
    query: mode ? { mode } : undefined,
  });
};

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('navigation.backToHome'),
    icon: 'i-heroicons-arrow-left',
    to: '/',
  },
  {
    label: t('profile.summary.editFromSummary'),
    icon: 'i-heroicons-pencil',
    color: 'primary',
    onClick: () => goToFullProfile('edit'),
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
  userId,
  async (newUserId) => {
    if (!newUserId) return;
    try {
      const profileComposable = useUserProfile(newUserId);
      loading.value = profileComposable.loading.value;
      error.value = profileComposable.error.value;
      await profileComposable.load();
      profile.value = profileComposable.item.value;
      loading.value = false;
      await loadPhotoPreview(profile.value?.profilePhotoKey);
    } catch (err) {
      console.error('[profile-summary] Failed to load profile:', err);
      error.value = t('profile.messages.loadError');
      loading.value = false;
    }

    try {
      const experiences = await experienceRepo.list(newUserId);
      showCvUpload.value = experiences.length === 0;
    } catch (err) {
      console.error('[profile-summary] Experience check failed:', err);
      showCvUpload.value = true;
    }
  },
  { immediate: true }
);
</script>
