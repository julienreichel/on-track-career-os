<script setup lang="ts">
import type { ApplicationStrengthImprovement } from '@/domain/application-strength/ApplicationStrengthEvaluation';

const props = defineProps<{
  improvements: ApplicationStrengthImprovement[];
}>();

function impactColor(impact: ApplicationStrengthImprovement['impact']) {
  if (impact === 'high') {
    return 'error';
  }
  if (impact === 'low') {
    return 'neutral';
  }
  return 'warning';
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h4 class="text-base font-medium">Top improvements</h4>
        <p class="text-sm text-dimmed">Priority suggestions to improve your application quality.</p>
      </div>
    </template>

    <ul class="space-y-3">
      <li v-for="(item, index) in props.improvements" :key="`improvement-${index}`">
        <div class="rounded-lg border border-border/50 p-3" :data-testid="`application-strength-improvement-${index}`">
          <div class="flex w-full flex-col gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-medium text-highlighted">{{ item.title }}</p>
              <UBadge :color="impactColor(item.impact)" variant="outline" size="xs">
                {{ item.impact }}
              </UBadge>
            </div>
            <p class="text-sm text-default">{{ item.action }}</p>
            <p class="text-xs text-dimmed">
              Target: {{ item.target.document }} / {{ item.target.anchor }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </UCard>
</template>
