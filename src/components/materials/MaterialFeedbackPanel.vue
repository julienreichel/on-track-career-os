<script setup lang="ts">
import { computed, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ApplicationStrengthEvaluation } from '@/domain/application-strength/ApplicationStrengthEvaluation';
import type { MaterialImprovementState } from '@/composables/useMaterialImprovementEngine';
import type { ImproveMaterialType } from '@/domain/ai-operations/ImproveMaterial';
import { MATERIAL_IMPROVEMENT_PRESETS } from '@/domain/materials/improvementPresets';

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

const presetOptions = computed(() =>
  MATERIAL_IMPROVEMENT_PRESETS.map((preset) => ({
    value: preset as string,
    label: t(`materialImprovement.presets.items.${preset}.label`),
  }))
);

const scoreText = computed(() =>
  typeof props.engine.score.value === 'number'
    ? String(props.engine.score.value)
    : t('materialImprovement.panel.scoreUnavailable')
);

const improveDisabled = computed(() => isBusy.value || !props.engine.canImprove.value);
const feedbackButtonLabel = computed(() =>
  isAnalyzing.value ? t('materialImprovement.panel.getFeedbackLoading') : t('materialImprovement.panel.getFeedback')
);
const improveButtonLabel = computed(() =>
  isImproving.value ? t('materialImprovement.panel.improveLoading') : t('materialImprovement.panel.improve')
);
const materialTypeLabel = computed(() => t(`materialImprovement.panel.materialType.${props.materialType}`));

async function handleRunFeedback() {
  await props.engine.actions.runFeedback();
}

async function handleRunImprove() {
  await props.engine.actions.runImprove();
}
</script>

<template>
  <UCard data-testid="material-feedback-panel">
    <template #header>
      <div class="space-y-1">
        <h3 class="text-lg font-semibold">{{ t('materialImprovement.panel.title') }}</h3>
        <p class="text-sm text-dimmed">
          {{ t('materialImprovement.panel.description', { materialType: materialTypeLabel }) }}
        </p>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-dimmed">
            {{ t('materialImprovement.panel.scoreLabel') }}
          </p>
          <p class="text-2xl font-semibold text-highlighted" data-testid="material-feedback-score">
            {{ scoreText }}
          </p>
        </div>
        <UBadge color="neutral" variant="soft">
          {{ t('materialImprovement.panel.state.' + props.engine.state.value) }}
        </UBadge>
      </div>

      <USkeleton v-if="isAnalyzing" class="h-16 w-full" />

      <div v-else class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <UButton
            color="primary"
            :loading="isAnalyzing"
            :disabled="isBusy"
            :label="feedbackButtonLabel"
            data-testid="material-feedback-run-feedback"
            @click="handleRunFeedback"
          />
          <UButton
            color="neutral"
            variant="soft"
            :loading="isImproving"
            :disabled="improveDisabled"
            :label="improveButtonLabel"
            data-testid="material-feedback-run-improve"
            @click="handleRunImprove"
          />
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="!hasFeedback"
            :label="
              canShowDetails
                ? t('materialImprovement.panel.hideDetails')
                : t('materialImprovement.panel.showDetails')
            "
            data-testid="material-feedback-toggle-details"
            @click="detailsExpanded = !detailsExpanded"
          />
        </div>

        <div class="space-y-2">
          <USelectMenu
            v-model="selectedPresets"
            :items="presetOptions"
            value-key="value"
            multiple
            :placeholder="t('materialImprovement.panel.presetsPlaceholder')"
            data-testid="material-feedback-presets"
          />
          <p class="text-xs text-dimmed">
            {{ t('materialImprovement.panel.presetsHint') }}
          </p>
        </div>

        <UTextarea
          v-model="noteValue"
          :rows="3"
          :placeholder="t('materialImprovement.panel.notePlaceholder')"
          data-testid="material-feedback-note"
        />
      </div>

      <div v-if="canShowDetails && props.engine.details.value" class="space-y-4" data-testid="material-feedback-details">
        <UCard>
          <template #header>
            <h4 class="text-sm font-medium">{{ t('materialImprovement.panel.missingSignalsTitle') }}</h4>
          </template>
          <ul v-if="props.engine.details.value.missingSignals.length" class="space-y-1">
            <li
              v-for="(signal, index) in props.engine.details.value.missingSignals"
              :key="`missing-${index}`"
              class="text-sm text-default"
            >
              • {{ signal }}
            </li>
          </ul>
          <p v-else class="text-sm text-dimmed">{{ t('materialImprovement.panel.noMissingSignals') }}</p>
        </UCard>

        <UCard>
          <template #header>
            <h4 class="text-sm font-medium">{{ t('materialImprovement.panel.topActionsTitle') }}</h4>
          </template>
          <ul class="space-y-2">
            <li
              v-for="(item, index) in props.engine.details.value.topImprovements"
              :key="`action-${index}`"
              class="rounded-lg border border-border/50 p-2"
            >
              <p class="text-sm font-medium text-highlighted">{{ item.title }}</p>
              <p class="text-sm text-default">{{ item.action }}</p>
            </li>
          </ul>
        </UCard>
      </div>
    </div>
  </UCard>
</template>
