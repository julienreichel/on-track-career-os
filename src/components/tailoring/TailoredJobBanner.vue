<script setup lang="ts">
type Props = {
  jobTitle: string;
  targetJobLabel: string;
  viewJobLabel: string;
  viewMatchLabel: string;
  jobLink?: string | null;
  matchLink?: string | null;
  regenerateLabel: string;
  regenerateDisabled: boolean;
  regenerateLoading: boolean;
  contextErrorTitle: string;
  regenerateErrorTitle: string;
  missingSummaryTitle: string;
  missingSummaryDescription: string;
  contextError?: string | null;
  regenerateError?: string | null;
  missingSummary?: boolean;
};

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'regenerate'): void }>();
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-500">{{ props.targetJobLabel }}</p>
        <p class="text-lg font-semibold">{{ props.jobTitle }}</p>
        <UButton
          v-if="props.jobLink"
          class="mt-2"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-top-right-on-square"
          :label="props.viewJobLabel"
          :to="props.jobLink"
        />
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          color="primary"
          icon="i-heroicons-sparkles"
          :label="props.regenerateLabel"
          :loading="props.regenerateLoading"
          :disabled="props.regenerateDisabled"
          @click="emit('regenerate')"
        />
        <UButton
          v-if="props.matchLink"
          color="neutral"
          variant="outline"
          icon="i-heroicons-sparkles"
          :label="props.viewMatchLabel"
          :to="props.matchLink"
        />
      </div>
    </div>

    <UAlert
      v-if="props.contextError"
      class="mt-4"
      icon="i-heroicons-exclamation-triangle"
      color="warning"
      variant="soft"
      :title="props.contextErrorTitle"
      :description="props.contextError"
    />
    <UAlert
      v-else-if="props.regenerateError"
      class="mt-4"
      icon="i-heroicons-exclamation-triangle"
      color="warning"
      variant="soft"
      :title="props.regenerateErrorTitle"
      :description="props.regenerateError"
    />
    <UAlert
      v-else-if="props.missingSummary"
      class="mt-4"
      icon="i-heroicons-information-circle"
      color="info"
      variant="soft"
      :title="props.missingSummaryTitle"
      :description="props.missingSummaryDescription"
    />
  </UCard>
</template>
