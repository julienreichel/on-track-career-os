<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { ApplicationStrengthImprovement } from '@/domain/application-strength/ApplicationStrengthEvaluation';

const props = defineProps<{
  improvements: ApplicationStrengthImprovement[];
}>();
const { t } = useI18n();

function impactColor(impact: ApplicationStrengthImprovement['impact']) {
  if (impact === 'high') {
    return 'error';
  }
  if (impact === 'low') {
    return 'neutral';
  }
  return 'warning';
}

function impactLabel(impact: ApplicationStrengthImprovement['impact']) {
  return t(`applicationStrength.improvements.impact.${impact}`);
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h4 class="text-base font-medium">{{ t('applicationStrength.improvements.title') }}</h4>
        <p class="text-sm text-dimmed">{{ t('applicationStrength.improvements.description') }}</p>
      </div>
    </template>

    <ul class="space-y-3">
      <li v-for="(item, index) in props.improvements" :key="`improvement-${index}`">
        <div class="rounded-lg border border-border/50 p-3" :data-testid="`application-strength-improvement-${index}`">
          <div class="flex w-full flex-col gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-medium text-highlighted">{{ item.title }}</p>
              <UBadge :color="impactColor(item.impact)" variant="outline" size="xs">
                {{ impactLabel(item.impact) }}
              </UBadge>
            </div>
            <p class="text-sm text-default">{{ item.action }}</p>
            <p class="text-xs text-dimmed">
              {{ t('applicationStrength.improvements.target', {
                document: item.target.document,
                anchor: item.target.anchor,
              }) }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </UCard>
</template>
