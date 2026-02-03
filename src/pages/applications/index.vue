<template>
  <UPage>
    <UPageHeader
      :title="t('applicationsPage.title')"
      :description="t('applicationsPage.description')"
      :links="[
        {
          label: t('navigation.backToHome'),
          icon: 'i-heroicons-arrow-left',
          to: { name: 'index' },
        },
      ]"
    />

    <UPageBody>
      <UCard>
        <UPageGrid>
          <UPageCard
            :title="t('cvs.page.title')"
            :description="t('cvs.page.description')"
            icon="i-heroicons-document-text"
            :to="{ name: 'applications-cv' }"
          />
          <UPageCard
            :title="t('coverLetters.page.title')"
            :description="t('coverLetters.page.description')"
            icon="i-heroicons-envelope"
            :to="{ name: 'applications-cover-letters' }"
          />
          <UPageCard
            :title="t('speeches.page.title')"
            :description="t('speeches.page.description')"
            icon="i-heroicons-chat-bubble-left-right"
            :to="{ name: 'applications-speech' }"
          />
        </UPageGrid>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
