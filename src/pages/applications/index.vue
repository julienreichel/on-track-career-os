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
            :title="t('cvList.title')"
            :description="t('cvList.subtitle')"
            icon="i-heroicons-document-text"
            :to="{ name: 'applications-cv' }"
          />
          <UPageCard
            :title="t('coverLetter.list.title')"
            :description="t('coverLetter.list.subtitle')"
            icon="i-heroicons-envelope"
            :to="{ name: 'applications-cover-letters' }"
          />
          <UPageCard
            :title="t('speech.list.title')"
            :description="t('speech.list.subtitle')"
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
