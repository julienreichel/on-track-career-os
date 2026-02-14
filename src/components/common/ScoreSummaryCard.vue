<script setup lang="ts">
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

type ScoreMetric = {
  key: string;
  label: string;
  value: number;
  max?: number;
  testId?: string;
};

const props = withDefaults(
  defineProps<{
    title: string;
    overallScore: number;
    overallMax?: number;
    badgeLabel?: string;
    badgeColor?: BadgeColor;
    metrics: ScoreMetric[];
    metricsGridClass?: string;
    testId?: string;
  }>(),
  {
    overallMax: 100,
    badgeLabel: '',
    badgeColor: 'neutral',
    metricsGridClass: 'md:grid-cols-4',
    testId: undefined,
  }
);
</script>

<template>
  <UCard :data-testid="props.testId">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex-1">
        <p class="text-sm text-dimmed uppercase tracking-wide">{{ props.title }}</p>
        <div class="mt-2 flex items-baseline gap-3">
          <p class="text-4xl font-bold text-highlighted">{{ props.overallScore }}</p>
          <p class="text-sm text-dimmed">/{{ props.overallMax }}</p>
        </div>
        <UBadge v-if="props.badgeLabel" :color="props.badgeColor" variant="outline" class="mt-2" size="lg">
          {{ props.badgeLabel }}
        </UBadge>
      </div>

      <div class="grid grid-cols-2 gap-3" :class="props.metricsGridClass">
        <div
          v-for="item in props.metrics"
          :key="item.key"
          :data-testid="item.testId"
          class="flex flex-col gap-1 rounded-lg border border-border/50 p-3"
        >
          <p class="text-xs text-dimmed uppercase tracking-wide">{{ item.label }}</p>
          <p class="text-xl font-semibold text-highlighted">
            {{ item.value }}
            <span v-if="typeof item.max === 'number'" class="text-sm text-dimmed">/{{ item.max }}</span>
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
