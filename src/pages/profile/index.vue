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
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">
                {{ t('profile.summary.viewFullProfile') }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ t('profile.summary.fullProfileDescription') }}
              </p>
            </div>
            <UButton color="primary" icon="i-heroicons-pencil-square" @click="goToFullProfile('edit')">
              {{ t('profile.summary.editFromSummary') }}
            </UButton>
          </div>
        </template>

        <UButton
          color="neutral"
          variant="soft"
          icon="i-heroicons-arrow-right-circle"
          @click="goToFullProfile()"
        >
          {{ t('profile.summary.viewFullProfile') }}
        </UButton>
      </UCard>

      <UCard class="mt-6">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ t('profile.sections.relatedPages') }}
          </h3>
        </template>

        <UPageGrid>
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
            :title="t('profile.links.cvDocuments')"
            :description="t('profile.links.cvDocumentsDescription')"
            icon="i-heroicons-document-duplicate"
            to="/cv"
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
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

const { t } = useI18n();
const router = useRouter();
const { userId } = useAuthUser();

const profile = ref<UserProfile | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const photoPreviewUrl = ref<string | null>(null);
const showCvUpload = ref(false);

const profilePhotoService = new ProfilePhotoService();
const userProfileRepo = new UserProfileRepository();
const experienceRepo = new ExperienceRepository();

const goToFullProfile = (mode?: 'edit') => {
  router.push({
    path: '/profile/full',
    query: mode ? { mode } : undefined,
  });
};

const headerLinks = computed(() => [
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
      loadPhotoPreview(profile.value?.profilePhotoKey);
    } catch (err) {
      console.error('[profile-summary] Failed to load profile:', err);
      error.value = t('profile.messages.loadError');
      loading.value = false;
    }

    try {
      const userProfile = await userProfileRepo.get(newUserId);
      if (!userProfile) {
        showCvUpload.value = true;
        return;
      }
      const experiences = await experienceRepo.list(userProfile);
      showCvUpload.value = !experiences || experiences.length === 0;
    } catch (err) {
      console.error('[profile-summary] Experience check failed:', err);
      showCvUpload.value = true;
    }
  },
  { immediate: true }
);
</script>
