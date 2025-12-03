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
            :title="t('features.cvUpload.title')"
            :description="t('features.cvUpload.description')"
            icon="i-heroicons-arrow-up-tray"
            :to="{ name: 'profile-cv-upload' }"
          />
          <UPageCard
            :title="t('features.experiences.title')"
            :description="t('features.experiences.description')"
            icon="i-heroicons-briefcase"
            :to="{ name: 'profile-experiences' }"
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
import { useI18n } from 'vue-i18n';

// Home page - requires authentication
const { t } = useI18n();
</script>
