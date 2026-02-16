<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';
import type { MaterialImprovementState } from '@/composables/useMaterialImprovementEngine';
import type { ImproveMaterialType } from '@/domain/ai-operations/ImproveMaterial';
import {
  MATERIAL_IMPROVEMENT_OTHER_PRESET,
  MATERIAL_IMPROVEMENT_PRESET_GROUPS,
} from '@/domain/materials/improvementPresets';
import ScoreSummaryCard from '@/components/common/ScoreSummaryCard.vue';
import ApplicationStrengthImprovementsCard from '@/components/application-strength/ApplicationStrengthImprovementsCard.vue';

type MaterialFeedbackPanelEngine = {
  state: Ref<MaterialImprovementState>;
  score: Ref<number | null>;
  details: Ref<ApplicationStrengthEvaluation | null>;
  presets: Ref<string[]>;
  note: Ref<string>;
  canImprove: Ref<boolean>;
  actions: {
    runFeedback: () => Promise<unknown>;
    runImprove: () => Promise<unknown>;
    setPresets: (value: string[]) => void;
    setNote: (value: string) => void;
  };
};

const props = defineProps<{
  engine: MaterialFeedbackPanelEngine;
  materialType: ImproveMaterialType;
}>();

const { t } = useI18n();
const detailsExpanded = ref(false);

const isAnalyzing = computed(() => props.engine.state.value === 'analyzing');
const isImproving = computed(() => props.engine.state.value === 'improving');
const isBusy = computed(() => isAnalyzing.value || isImproving.value);
const hasFeedback = computed(() => props.engine.details.value !== null);
const canShowDetails = computed(() => hasFeedback.value && detailsExpanded.value);

const selectedPresets = computed<string[]>({
  get: () => props.engine.presets.value,
  set: (value) => props.engine.actions.setPresets(value),
});

const noteValue = computed<string>({
  get: () => props.engine.note.value,
  set: (value) => props.engine.actions.setNote(value),
});

type PresetOptionItem = {
  value: string;
  label: string;
};
type PresetGroupLabelItem = {
  type: 'label';
  label: string;
};

const presetOptions = computed<Array<Array<PresetOptionItem | PresetGroupLabelItem>>>(() =>
  MATERIAL_IMPROVEMENT_PRESET_GROUPS.map((group) => [
    {
      type: 'label',
      label: t(group.labelKey),
    },
    ...group.options.map((preset) => ({
      value: preset.value,
      label: t(preset.labelKey),
    })),
  ])
);
const showOtherInput = computed(() =>
  selectedPresets.value.includes(MATERIAL_IMPROVEMENT_OTHER_PRESET)
);

watch(
  showOtherInput,
  (enabled) => {
    if (!enabled && noteValue.value.length > 0) {
      noteValue.value = '';
    }
  },
  { immediate: true }
);

const scoreValue = computed(() => props.engine.details.value?.overallScore ?? 0);

const improveDisabled = computed(() => isBusy.value || !props.engine.canImprove.value);
const feedbackButtonLabel = computed(() =>
  isAnalyzing.value
    ? t('materialImprovement.panel.getFeedbackLoading')
    : t('materialImprovement.panel.getFeedback')
);
const improveButtonLabel = computed(() =>
  isImproving.value
    ? t('materialImprovement.panel.improveLoading')
    : t('materialImprovement.panel.improve')
);
const materialTypeLabel = computed(() =>
  t(`materialImprovement.panel.materialType.${props.materialType}`)
);
const decisionColor = computed(() => {
  const label = props.engine.details.value?.decision.label;
  if (label === 'strong') {
    return 'success';
  }
  if (label === 'borderline') {
    return 'warning';
  }
  return 'error';
});
const decisionLabel = computed(() => {
  const label = props.engine.details.value?.decision.label;
  if (!label) {
    return '';
  }
  return t(`applicationStrength.results.decisionLabels.${label}`);
});
const decisionReadinessLabel = computed(() => {
  const readyToApply = props.engine.details.value?.decision.readyToApply;
  if (typeof readyToApply !== 'boolean') {
    return '';
  }
  return readyToApply
    ? t('applicationStrength.results.decisionReady')
    : t('applicationStrength.results.decisionNotReady');
});
const scoreBadgeLabel = computed(() => {
  if (!hasFeedback.value) {
    return '';
  }
  return `${decisionLabel.value} · ${decisionReadinessLabel.value}`;
});
const scoreMetrics = computed(() => {
  const dimensions = props.engine.details.value?.dimensionScores;
  return [
    {
      key: 'atsReadiness',
      label: t('applicationStrength.results.dimensions.atsReadiness'),
      value: dimensions?.atsReadiness ?? 0,
      max: 100,
      testId: 'application-strength-dimension-atsReadiness',
    },
    {
      key: 'clarityFocus',
      label: t('applicationStrength.results.dimensions.clarityFocus'),
      value: dimensions?.clarityFocus ?? 0,
      max: 100,
      testId: 'application-strength-dimension-clarityFocus',
    },
    {
      key: 'targetedFitSignals',
      label: t('applicationStrength.results.dimensions.targetedFitSignals'),
      value: dimensions?.targetedFitSignals ?? 0,
      max: 100,
      testId: 'application-strength-dimension-targetedFitSignals',
    },
    {
      key: 'evidenceStrength',
      label: t('applicationStrength.results.dimensions.evidenceStrength'),
      value: dimensions?.evidenceStrength ?? 0,
      max: 100,
      testId: 'application-strength-dimension-evidenceStrength',
    },
  ];
});

async function handleRunFeedback() {
  await props.engine.actions.runFeedback();
}

async function handleRunImprove() {
  await props.engine.actions.runImprove();
}
</script>

<template>
  <div class="space-y-4" data-testid="material-feedback-panel">
    <UCard>
      <div class="space-y-3">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">
            {{ t('materialImprovement.panel.feedbackSectionTitle') }}
          </h3>
          <p class="text-sm text-dimmed">
            {{ t('materialImprovement.panel.description', { materialType: materialTypeLabel }) }}
          </p>
        </div>
        <USkeleton v-if="isAnalyzing" class="h-16 w-full" />

        <template v-else>
          <div v-if="!hasFeedback" class="flex justify-end">
            <UButton
              color="primary"
              :loading="isAnalyzing"
              :disabled="isBusy"
              :label="feedbackButtonLabel"
              data-testid="material-feedback-run-feedback"
              @click="handleRunFeedback"
            />
          </div>

          <template v-else>
            <ScoreSummaryCard
              :title="t('applicationStrength.results.overallScore')"
              :overall-score="scoreValue"
              :overall-max="100"
              :badge-color="decisionColor"
              :badge-label="scoreBadgeLabel"
              :metrics="scoreMetrics"
              metrics-grid-class="md:grid-cols-4"
              test-id="material-feedback-score"
            />

            <div class="flex justify-end">
              <UButton
                color="neutral"
                variant="ghost"
                :label="
                  canShowDetails
                    ? t('materialImprovement.panel.hideDetails')
                    : t('materialImprovement.panel.showDetails')
                "
                data-testid="material-feedback-toggle-details"
                @click="detailsExpanded = !detailsExpanded"
              />
            </div>

            <div
              v-if="canShowDetails && props.engine.details.value"
              class="space-y-4"
              data-testid="material-feedback-details"
            >
              <ApplicationStrengthImprovementsCard
                :improvements="props.engine.details.value.topImprovements"
              />
            </div>
          </template>
        </template>
      </div>
    </UCard>

    <UCard>
      <div class="space-y-3">
        <h3 class="text-lg font-semibold">
          {{ t('materialImprovement.panel.improvementSectionTitle') }}
        </h3>
        <div class="space-y-2">
          <USelectMenu
            v-model="selectedPresets"
            :items="presetOptions"
            value-key="value"
            multiple
            :placeholder="t('materialImprovement.panel.presetsPlaceholder')"
            data-testid="material-feedback-presets"
            class="w-sm"
          />
          <p class="text-xs text-dimmed">
            {{ t('materialImprovement.panel.presetsHint') }}
          </p>
        </div>

        <UTextarea
          v-if="showOtherInput"
          v-model="noteValue"
          :rows="3"
          class="w-full"
          :placeholder="t('materialImprovement.panel.notePlaceholder')"
          data-testid="material-feedback-note"
        />

        <div class="flex justify-end">
          <UButton
            :color="hasFeedback ? 'primary' : 'neutral'"
            :variant="hasFeedback ? 'solid' : 'soft'"
            :loading="isImproving"
            :disabled="improveDisabled"
            :label="improveButtonLabel"
            data-testid="material-feedback-run-improve"
            @click="handleRunImprove"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>
