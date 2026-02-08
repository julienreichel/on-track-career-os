<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <UCard class="space-y-4">
    <template #header>
      <h2 class="text-lg font-semibold">{{ t('onboarding.complete.title') }}</h2>
      <p class="text-sm text-dimmed">{{ t('onboarding.complete.description') }}</p>
    </template>

    <div class="flex flex-col gap-2 sm:flex-row">
      <UButton
        color="primary"
        :label="t('onboarding.complete.identityPath')"
        to="/profile"
        icon="i-heroicons-arrow-right"
      />
      <UButton
        variant="outline"
        color="neutral"
        :label="t('onboarding.complete.jobPath')"
        to="/jobs/new"
        icon="i-heroicons-sparkles"
      />
    </div>
  </UCard>
</template>
