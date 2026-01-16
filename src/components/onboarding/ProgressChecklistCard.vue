<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ProgressCheckResult, ProgressGate, UserProgressState } from '@/domain/onboarding';
import ProgressChecklistItems from '@/components/onboarding/ProgressChecklistItems.vue';

type Props = {
  state: UserProgressState;
};

const props = defineProps<Props>();
const { t } = useI18n();

const gateLabels: Record<ProgressGate, string> = {
  cvUploaded: 'progress.checklist.cvUploaded',
  experienceCount: 'progress.checklist.experienceCount',
  profileBasics: 'progress.checklist.profileBasics',
  profileDepth: 'progress.checklist.profileDepth',
  stories: 'progress.checklist.stories',
  personalCanvas: 'progress.checklist.personalCanvas',
  jobUploaded: 'progress.checklist.jobUploaded',
  matchingSummary: 'progress.checklist.matchingSummary',
  tailoredCv: 'progress.checklist.tailoredCv',
  tailoredCoverLetter: 'progress.checklist.tailoredCoverLetter',
  tailoredSpeech: 'progress.checklist.tailoredSpeech',
};

function buildItems(result: ProgressCheckResult, gates: ProgressGate[]) {
  return gates.map((gate) => ({
    gate,
    label: t(gateLabels[gate]),
    complete: !result.missing.includes(gate),
  }));
}

const phase1Items = computed(() =>
  buildItems(props.state.phase1, ['cvUploaded', 'experienceCount', 'profileBasics'])
);

const phase2BItems = computed(() =>
  buildItems(props.state.phase2B, ['profileDepth', 'stories', 'personalCanvas'])
);

const phase2AItems = computed(() =>
  buildItems(props.state.phase2A, ['jobUploaded', 'matchingSummary'])
);

const phase3Items = computed(() =>
  buildItems(props.state.phase3, ['tailoredCv', 'tailoredCoverLetter', 'tailoredSpeech'])
);

const activePhaseTitle = computed(() => t(`progress.phaseChecklistTitles.${props.state.phase}`));
</script>

<template>
  <UCard class="space-y-4">
    <div>
      <h3 class="text-base font-semibold text-highlighted">{{ activePhaseTitle }}</h3>
      <p class="text-sm text-dimmed">{{ t('progress.checklistHint') }}</p>
    </div>

    <ProgressChecklistItems v-if="state.phase === 'phase1'" :items="phase1Items" />

    <div v-else-if="state.phase === 'phase2'" class="space-y-4">
      <div>
        <p class="text-xs font-semibold uppercase text-dimmed">
          {{ t('progress.phaseLabels.phase2A') }}
        </p>
        <ProgressChecklistItems class="mt-2" :items="phase2AItems" />
      </div>
      <div>
        <p class="text-xs font-semibold uppercase text-dimmed">
          {{ t('progress.phaseLabels.phase2B') }}
        </p>
        <ProgressChecklistItems class="mt-2" :items="phase2BItems" />
      </div>
    </div>

    <ProgressChecklistItems v-else-if="state.phase === 'phase3'" :items="phase3Items" />

    <div v-else class="space-y-2">
      <p class="text-sm text-dimmed">
        {{ t('progress.bonusHint') }}
      </p>
    </div>
  </UCard>
</template>
