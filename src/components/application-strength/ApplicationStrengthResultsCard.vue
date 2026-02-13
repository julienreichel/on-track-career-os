<script setup lang="ts">
import { computed } from 'vue';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';

const props = defineProps<{
  evaluation: ApplicationStrengthEvaluation;
}>();

const decisionColor = computed(() => {
  if (props.evaluation.decision.label === 'strong') {
    return 'success';
  }
  if (props.evaluation.decision.label === 'borderline') {
    return 'warning';
  }
  return 'error';
});

const dimensions = computed(() => [
  { key: 'atsReadiness', label: 'ATS readiness', value: props.evaluation.dimensionScores.atsReadiness },
  { key: 'keywordCoverage', label: 'Keyword coverage', value: props.evaluation.dimensionScores.keywordCoverage },
  { key: 'clarityFocus', label: 'Clarity and focus', value: props.evaluation.dimensionScores.clarityFocus },
  { key: 'targetedFitSignals', label: 'Targeted fit signals', value: props.evaluation.dimensionScores.targetedFitSignals },
  { key: 'evidenceStrength', label: 'Evidence strength', value: props.evaluation.dimensionScores.evidenceStrength },
]);
</script>

<template>
  <div class="space-y-6">
    <UCard data-testid="application-strength-results-overview">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex-1">
          <p class="text-sm text-dimmed uppercase tracking-wide">Overall score</p>
          <div class="mt-2 flex items-baseline gap-3">
            <p class="text-4xl font-bold text-highlighted">{{ props.evaluation.overallScore }}</p>
            <p class="text-sm text-dimmed">/100</p>
          </div>
          <UBadge :color="decisionColor" variant="outline" size="lg" class="mt-2">
            {{ props.evaluation.decision.label }} ·
            {{ props.evaluation.decision.readyToApply ? 'ready to apply' : 'not ready' }}
          </UBadge>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div
            v-for="dimension in dimensions"
            :key="dimension.key"
            :data-testid="`application-strength-dimension-${dimension.key}`"
            class="flex flex-col gap-1 rounded-lg border border-border/50 p-3"
          >
            <p class="text-xs text-dimmed uppercase tracking-wide">{{ dimension.label }}</p>
            <p class="text-xl font-semibold text-highlighted">{{ dimension.value }}/100</p>
          </div>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h4 class="text-base font-medium">Decision rationale</h4>
      </template>
      <ul class="space-y-2">
        <li
          v-for="(item, index) in props.evaluation.decision.rationaleBullets"
          :key="`rationale-${index}`"
          class="text-sm text-default"
        >
          • {{ item }}
        </li>
      </ul>
    </UCard>

    <UCard>
      <template #header>
        <h4 class="text-base font-medium">Missing signals</h4>
      </template>
      <ul v-if="props.evaluation.missingSignals.length" class="space-y-2">
        <li
          v-for="(signal, index) in props.evaluation.missingSignals"
          :key="`missing-${index}`"
          class="text-sm text-default"
        >
          • {{ signal }}
        </li>
      </ul>
      <p v-else class="text-sm text-dimmed">No major missing signals detected.</p>
    </UCard>
  </div>
</template>
