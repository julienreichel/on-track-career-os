<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';

type Props = {
  job: JobDescription | null;
  matchingSummary: MatchingSummary | null;
  existingMaterials?: {
    cv?: { id: string } | null;
    coverLetter?: { id: string } | null;
    speechBlock?: { id: string } | null;
  } | null;
  matchLink?: string | null;
  summaryLoading?: boolean;
  summaryError?: string | null;
};

const props = defineProps<Props>();
const router = useRouter();
const { t } = useI18n();
const tailoredMaterials = useTailoredMaterials();

const activeMaterial = ref<'cv' | 'cover-letter' | 'speech' | null>(null);
const existingCv = ref<{ id: string } | null>(null);
const existingCoverLetter = ref<{ id: string } | null>(null);
const existingSpeech = ref<{ id: string } | null>(null);

const hasSummary = computed(() => Boolean(props.matchingSummary));
const hasMatchingSummary = computed(() => hasSummary.value);
const hasExistingMaterials = computed(() =>
  Boolean(existingCv.value || existingCoverLetter.value || existingSpeech.value)
);
const shouldLoadExistingMaterials = computed(() => props.existingMaterials === undefined);

const materialsLoading = computed(() => tailoredMaterials.materialsLoading.value);
const materialsError = computed(() => tailoredMaterials.error.value);
const materialsErrorCode = computed(() => tailoredMaterials.materialsError.value);
const materialsErrorMessage = computed(() =>
  materialsErrorCode.value ? t(`tailoredMaterials.errors.${materialsErrorCode.value}`) : null
);

const canGenerateMaterials = computed(() => Boolean(props.job && props.matchingSummary));
const materialsDisabled = computed(
  () =>
    !canGenerateMaterials.value ||
    tailoredMaterials.isGenerating.value ||
    Boolean(props.summaryLoading)
);

const cvLink = computed(() =>
  existingCv.value?.id ? `/applications/cv/${existingCv.value.id}` : null
);
const coverLetterLink = computed(() =>
  existingCoverLetter.value?.id
    ? `/applications/cover-letters/${existingCoverLetter.value.id}`
    : null
);
const speechLink = computed(() =>
  existingSpeech.value?.id ? `/applications/speech/${existingSpeech.value.id}` : null
);

const headerDescription = computed(() => t(`tailoredMaterials.materials.description`));

watch(
  () => props.job?.id,
  async (jobId) => {
    if (!shouldLoadExistingMaterials.value) {
      return;
    }
    if (!jobId) {
      existingCv.value = null;
      existingCoverLetter.value = null;
      existingSpeech.value = null;
      return;
    }

    const result = await tailoredMaterials.loadExistingMaterialsForJob(jobId);
    if (result.ok) {
      existingCv.value = result.data.cv;
      existingCoverLetter.value = result.data.coverLetter;
      existingSpeech.value = result.data.speechBlock;
      return;
    }

    existingCv.value = null;
    existingCoverLetter.value = null;
    existingSpeech.value = null;
  },
  { immediate: true }
);

watch(
  () => props.existingMaterials,
  (materials) => {
    if (materials === undefined) {
      return;
    }
    existingCv.value = materials?.cv ?? null;
    existingCoverLetter.value = materials?.coverLetter ?? null;
    existingSpeech.value = materials?.speechBlock ?? null;
  },
  { immediate: true }
);

const handleGenerateCv = async () => {
  if (!props.job) {
    return;
  }

  activeMaterial.value = 'cv';
  try {
    await router.push(`/applications/cv/new?jobId=${props.job.id}`);
  } finally {
    activeMaterial.value = null;
  }
};

const handleGenerateCoverLetter = async () => {
  if (!props.job) {
    return;
  }

  activeMaterial.value = 'cover-letter';
  try {
    await router.push(`/applications/cover-letters/new?jobId=${props.job.id}`);
  } finally {
    activeMaterial.value = null;
  }
};

const handleGenerateSpeech = async () => {
  if (!props.job) {
    return;
  }

  activeMaterial.value = 'speech';
  try {
    await router.push(`/applications/speech?jobId=${props.job.id}`);
  } finally {
    activeMaterial.value = null;
  }
};
</script>

<template>
  <UCard class="mt-6">
    <template #header>
      <div>
        <h3 class="text-lg font-semibold">{{ t('tailoredMaterials.materials.title') }}</h3>
        <p class="text-sm text-gray-500">{{ headerDescription }}</p>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        v-if="props.summaryError"
        icon="i-heroicons-exclamation-triangle"
        color="warning"
        variant="soft"
        :title="t('tailoredMaterials.materials.summaryErrorTitle')"
        :description="props.summaryError"
      />

      <UAlert
        v-else-if="materialsError"
        icon="i-heroicons-exclamation-triangle"
        color="warning"
        variant="soft"
        :title="t('tailoredMaterials.materials.generateErrorTitle')"
        :description="materialsError"
      />

      <UAlert
        v-else-if="materialsErrorMessage"
        icon="i-heroicons-exclamation-triangle"
        color="warning"
        variant="soft"
        :title="t('tailoredMaterials.materials.loadErrorTitle')"
        :description="materialsErrorMessage"
      />

      <div
        v-else-if="!hasMatchingSummary && !props.summaryLoading && !hasExistingMaterials"
        class="space-y-3"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('tailoredMaterials.materials.missingSummaryHint') }}
        </p>
        <UButton
          v-if="props.matchLink"
          color="neutral"
          variant="outline"
          icon="i-heroicons-sparkles"
          :label="t('tailoredMaterials.materials.generateMatch')"
          :to="props.matchLink"
          :disabled="!props.matchLink"
        />
      </div>

      <USkeleton v-else-if="props.summaryLoading || materialsLoading" class="h-10 w-full" />

      <div v-else class="grid gap-3 sm:grid-cols-3">
        <UButton
          v-if="cvLink"
          color="neutral"
          variant="outline"
          icon="i-heroicons-document-text"
          :label="t('tailoredMaterials.materials.viewCv')"
          :to="cvLink"
        />
        <UButton
          v-else
          color="neutral"
          variant="outline"
          icon="i-heroicons-document-text"
          :label="t('tailoredMaterials.materials.generateCv')"
          :loading="activeMaterial === 'cv'"
          :disabled="materialsDisabled"
          @click="handleGenerateCv"
        />
        <UButton
          v-if="coverLetterLink"
          color="neutral"
          variant="outline"
          icon="i-heroicons-envelope"
          :label="t('tailoredMaterials.materials.viewCoverLetter')"
          :to="coverLetterLink"
        />
        <UButton
          v-else
          color="neutral"
          variant="outline"
          icon="i-heroicons-envelope"
          :label="t('tailoredMaterials.materials.generateCoverLetter')"
          :loading="activeMaterial === 'cover-letter'"
          :disabled="materialsDisabled"
          @click="handleGenerateCoverLetter"
        />
        <UButton
          v-if="speechLink"
          color="neutral"
          variant="outline"
          icon="i-heroicons-microphone"
          :label="t('tailoredMaterials.materials.viewSpeech')"
          :to="speechLink"
        />
        <UButton
          v-else
          color="neutral"
          variant="outline"
          icon="i-heroicons-microphone"
          :label="t('tailoredMaterials.materials.generateSpeech')"
          :loading="activeMaterial === 'speech'"
          :disabled="materialsDisabled"
          @click="handleGenerateSpeech"
        />
      </div>
    </div>
  </UCard>
</template>
