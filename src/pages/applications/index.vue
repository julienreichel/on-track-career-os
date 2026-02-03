<template>
  <UPage>
    <UPageHeader
      :title="t('applications.page.title')"
      :description="t('applications.page.description')"
      :links="[
        {
          label: t('common.back'),
          icon: 'i-heroicons-arrow-left',
          to: { name: 'index' },
        },
      ]"
    />

    <UPageBody>
      <UCard>
        <UPageGrid>
          <UPageCard
            :title="t('applications.cvs.page.title')"
            :description="t('applications.cvs.page.description')"
            icon="i-heroicons-document-text"
            :to="{ name: 'applications-cv' }"
          />
          <UPageCard
            :title="t('applications.coverLetters.page.title')"
            :description="t('applications.coverLetters.page.description')"
            icon="i-heroicons-envelope"
            :to="{ name: 'applications-cover-letters' }"
          />
          <UPageCard
            :title="t('applications.speeches.page.title')"
            :description="t('applications.speeches.page.description')"
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
