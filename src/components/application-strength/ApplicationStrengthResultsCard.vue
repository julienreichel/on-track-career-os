<script setup lang="ts">
import { computed } from 'vue';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';
import ScoreSummaryCard from '@/components/common/ScoreSummaryCard.vue';

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
  {
    key: 'atsReadiness',
    label: 'ATS readiness',
    value: props.evaluation.dimensionScores.atsReadiness,
    max: 100,
    testId: 'application-strength-dimension-atsReadiness',
  },
  {
    key: 'keywordCoverage',
    label: 'Keyword coverage',
    value: props.evaluation.dimensionScores.keywordCoverage,
    max: 100,
    testId: 'application-strength-dimension-keywordCoverage',
  },
  {
    key: 'clarityFocus',
    label: 'Clarity and focus',
    value: props.evaluation.dimensionScores.clarityFocus,
    max: 100,
    testId: 'application-strength-dimension-clarityFocus',
  },
  {
    key: 'targetedFitSignals',
    label: 'Targeted fit signals',
    value: props.evaluation.dimensionScores.targetedFitSignals,
    max: 100,
    testId: 'application-strength-dimension-targetedFitSignals',
  },
  {
    key: 'evidenceStrength',
    label: 'Evidence strength',
    value: props.evaluation.dimensionScores.evidenceStrength,
    max: 100,
    testId: 'application-strength-dimension-evidenceStrength',
  },
]);
</script>

<template>
  <div class="space-y-6">
    <ScoreSummaryCard
      title="Overall score"
      :overall-score="props.evaluation.overallScore"
      :overall-max="100"
      :badge-color="decisionColor"
      :badge-label="`${props.evaluation.decision.label} · ${props.evaluation.decision.readyToApply ? 'ready to apply' : 'not ready'}`"
      :metrics="dimensions"
      metrics-grid-class="md:grid-cols-5"
      test-id="application-strength-results-overview"
    />

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
