<template>
  <UPage>
    <UPageHeader :title="t('home.title')" :description="t('home.description')" />

    <UPageBody>
      <UCard>
        <UPageGrid>
          <UPageCard
            :title="t('features.profile.title')"
            :description="t('features.profile.description')"
            icon="i-heroicons-user-circle"
            :to="{ name: 'profile' }"
          />
          <UPageCard
            v-if="showCvUpload"
            :title="t('features.cvUpload.title')"
            :description="t('features.cvUpload.description')"
            icon="i-heroicons-arrow-up-tray"
            :to="{ name: 'profile-cv-upload' }"
          />
          <UPageCard
            :title="t('features.jobs.title')"
            :description="t('features.jobs.description')"
            icon="i-heroicons-building-office"
          />
          <UPageCard
            :title="t('features.applications.title')"
            :description="t('features.applications.description')"
            icon="i-heroicons-document-text"
          />
          <UPageCard
            :title="t('features.interview.title')"
            :description="t('features.interview.description')"
            icon="i-heroicons-chat-bubble-left-right"
          />
        </UPageGrid>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';

// Home page - requires authentication
const { t } = useI18n();

const showCvUpload = ref(false);
const experienceRepo = new ExperienceRepository();

// Check if user has any experiences
onMounted(async () => {
  try {
    const experiences = await experienceRepo.list();
    // Show CV upload only if user has no experiences
    showCvUpload.value = !experiences || experiences.length === 0;
  } catch (error) {
    console.error('Error checking experiences:', error);
    // Show CV upload on error (better UX to show than hide)
    showCvUpload.value = true;
  }
});
</script>

