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

const gateRoutes: Record<ProgressGate, string> = {
  cvUploaded: '/onboarding',
  experienceCount: '/profile/experiences/new',
  profileBasics: '/profile/full?mode=edit',
  profileDepth: '/profile/full?mode=edit',
  stories: '/profile/stories/new',
  personalCanvas: '/profile/canvas',
  jobUploaded: '/jobs/new',
  matchingSummary: '/jobs',
  tailoredCv: '/applications/cv',
  tailoredCoverLetter: '/applications/cover-letters',
  tailoredSpeech: '/applications/speech',
};

function buildItems(result: ProgressCheckResult, gates: ProgressGate[]) {
  return gates.map((gate) => ({
    gate,
    label: t(gateLabels[gate]),
    complete: !result.missing.includes(gate),
    to: gateRoutes[gate],
  }));
}

const phase1Items = computed(() =>
  buildItems(props.state.phase1, ['cvUploaded', 'experienceCount', 'profileBasics'])
);

const phase2Items = computed(() =>
  buildItems(props.state.phase2, ['profileDepth', 'stories', 'personalCanvas'])
);

const phase3Items = computed(() =>
  buildItems(props.state.phase3, ['jobUploaded', 'matchingSummary'])
);

const phase4Items = computed(() =>
  buildItems(props.state.phase4, ['tailoredCv', 'tailoredCoverLetter', 'tailoredSpeech'])
);

const activePhaseTitle = computed(() => t(`progress.phaseChecklistTitles.${props.state.phase}`));
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="text-lg font-semibold">{{ activePhaseTitle }}</h3>
        <p class="text-sm text-gray-500">{{ t('progress.checklistHint') }}</p>
      </div>
    </template>

    <ProgressChecklistItems v-if="state.phase === 'phase1'" :items="phase1Items" />

    <ProgressChecklistItems v-else-if="state.phase === 'phase2'" :items="phase2Items" />

    <ProgressChecklistItems v-else-if="state.phase === 'phase3'" :items="phase3Items" />

    <ProgressChecklistItems v-else-if="state.phase === 'phase4'" :items="phase4Items" />

    <p v-else class="text-sm text-muted-foreground">
      {{ t('progress.bonusHint') }}
    </p>
  </UCard>
</template>
