<template>
  <UCard v-if="hasScore">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-dimmed uppercase tracking-wide">
            {{ t('matching.score.title') }}
          </p>
          <p class="text-lg font-semibold text-highlighted">
            {{ t('matching.score.subtitle') }}
          </p>
        </div>
        <UBadge color="primary" variant="subtle">
          {{ t('matching.score.badge') }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-baseline justify-between">
        <p class="text-4xl font-bold text-highlighted">{{ formattedScore }}</p>
        <p class="text-sm text-dimmed">{{ t('matching.score.outOf') }}</p>
      </div>
      <UProgress :model-value="normalizedScore" :max="100" size="lg" color="primary" />
      <p class="text-sm text-dimmed">
        {{ t('matching.score.description') }}
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const props = defineProps<{
  score?: number | null;
}>();

const { t } = useI18n();

const hasScore = computed(() => typeof props.score === 'number' && !Number.isNaN(props.score));

const normalizedScore = computed(() => {
  if (!hasScore.value) {
    return 0;
  }

  const PERCENT = 100;
  return Math.min(PERCENT, Math.max(0, Number(props.score)));
});

const formattedScore = computed(() => `${Math.round(normalizedScore.value)}`);
</script>
