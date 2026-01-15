<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NextAction } from '@/domain/onboarding';

type Props = {
  nextAction: NextAction | null;
};

const props = defineProps<Props>();
const { t } = useI18n();

const primary = computed(() => props.nextAction?.primary ?? null);
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
        :label="t('onboarding.complete.identityPath')"
        to="/profile"
      />
      <UButton
        variant="outline"
        color="neutral"
        :label="t('onboarding.complete.jobPath')"
        to="/jobs/new"
      />
      <UButton
        v-if="primary"
        variant="ghost"
        color="neutral"
        :label="t(primary.labelKey)"
        :to="primary.to"
      />
    </div>
  </UCard>
</template>
