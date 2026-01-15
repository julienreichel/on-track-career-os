<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NextAction, UserProgressState } from '@/domain/onboarding';

type Props = {
  state: UserProgressState;
  nextAction: NextAction;
};

const props = defineProps<Props>();
const { t } = useI18n();

const SECONDARY_CTA_LIMIT = 2;
const phaseLabel = computed(() => t(`progress.phaseLabels.${props.state.phase}`));
const primary = computed(() => props.nextAction.primary);
const secondary = computed(() => props.nextAction.secondary.slice(0, SECONDARY_CTA_LIMIT));
</script>

<template>
  <UCard class="space-y-4" data-testid="progress-banner">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-wide text-dimmed">
          {{ t('progress.phaseLabel') }}
        </p>
        <h2 class="text-lg font-semibold text-highlighted">
          {{ phaseLabel }}
        </h2>
      </div>
      <UBadge color="primary" variant="soft">
        {{ t('progress.nextActionLabel') }}
      </UBadge>
    </div>

    <div class="space-y-2">
      <p class="text-sm text-default">
        {{ t(primary.rationaleKey) }}
      </p>
      <div class="flex flex-col gap-2 sm:flex-row">
        <UButton
          color="primary"
          icon="i-heroicons-arrow-right"
          :label="t(primary.labelKey)"
          :to="primary.to"
          data-testid="progress-primary-cta"
        />
        <UButton
          v-for="action in secondary"
          :key="action.id"
          variant="outline"
          color="neutral"
          :label="t(action.labelKey)"
          :to="action.to"
          data-testid="progress-secondary-cta"
        />
      </div>
    </div>
  </UCard>
</template>
