<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <UCard class="space-y-4">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-check-circle" class="text-success" />
        <h2 class="text-lg font-semibold">{{ t('onboarding.complete.title') }}</h2>
      </div>
    </template>

    <p class="text-sm text-dimmed">{{ t('onboarding.complete.description') }}</p>

    <div class="flex flex-col gap-2 sm:flex-row">
      <UButton
        color="primary"
        icon="i-heroicons-arrow-right"
        :label="t('onboarding.complete.jobPath')"
        to="/jobs/new"
      />
      <UButton
        variant="outline"
        color="neutral"
        :label="t('onboarding.complete.identityPath')"
        to="/profile"
      />
    </div>
  </UCard>
</template>
