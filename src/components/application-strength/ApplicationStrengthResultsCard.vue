<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';
import ScoreSummaryCard from '@/components/common/ScoreSummaryCard.vue';

const props = defineProps<{
  evaluation: ApplicationStrengthEvaluation;
}>();
const { t } = useI18n();

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
    label: t('applicationStrength.results.dimensions.atsReadiness'),
    value: props.evaluation.dimensionScores.atsReadiness,
    max: 100,
    testId: 'application-strength-dimension-atsReadiness',
  },
  {
    key: 'keywordCoverage',
    label: t('applicationStrength.results.dimensions.keywordCoverage'),
    value: props.evaluation.dimensionScores.keywordCoverage,
    max: 100,
    testId: 'application-strength-dimension-keywordCoverage',
  },
  {
    key: 'clarityFocus',
    label: t('applicationStrength.results.dimensions.clarityFocus'),
    value: props.evaluation.dimensionScores.clarityFocus,
    max: 100,
    testId: 'application-strength-dimension-clarityFocus',
  },
  {
    key: 'targetedFitSignals',
    label: t('applicationStrength.results.dimensions.targetedFitSignals'),
    value: props.evaluation.dimensionScores.targetedFitSignals,
    max: 100,
    testId: 'application-strength-dimension-targetedFitSignals',
  },
  {
    key: 'evidenceStrength',
    label: t('applicationStrength.results.dimensions.evidenceStrength'),
    value: props.evaluation.dimensionScores.evidenceStrength,
    max: 100,
    testId: 'application-strength-dimension-evidenceStrength',
  },
]);

const decisionLabel = computed(() =>
  t(`applicationStrength.results.decisionLabels.${props.evaluation.decision.label}`)
);

const decisionReadinessLabel = computed(() =>
  props.evaluation.decision.readyToApply
    ? t('applicationStrength.results.decisionReady')
    : t('applicationStrength.results.decisionNotReady')
);
</script>

<template>
  <div class="space-y-6">
    <ScoreSummaryCard
      :title="t('applicationStrength.results.overallScore')"
      :overall-score="props.evaluation.overallScore"
      :overall-max="100"
      :badge-color="decisionColor"
      :badge-label="`${decisionLabel} · ${decisionReadinessLabel}`"
      :metrics="dimensions"
      metrics-grid-class="md:grid-cols-5"
      test-id="application-strength-results-overview"
    />

    <UCard>
      <template #header>
        <h4 class="text-base font-medium">{{ t('applicationStrength.results.decisionRationale') }}</h4>
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
        <h4 class="text-base font-medium">{{ t('applicationStrength.results.missingSignals') }}</h4>
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
      <p v-else class="text-sm text-dimmed">
        {{ t('applicationStrength.results.noMissingSignals') }}
      </p>
    </UCard>
  </div>
</template>
