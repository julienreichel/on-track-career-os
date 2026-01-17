<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { GuidanceEmptyState } from '@/domain/onboarding';

const props = defineProps<{
  emptyState: GuidanceEmptyState;
  onAction?: () => void;
}>();

const { t } = useI18n();
</script>

<template>
  <UCard data-testid="guidance-empty-state">
    <UEmpty
      :title="t(props.emptyState.titleKey)"
      :description="t(props.emptyState.descriptionKey)"
      :icon="props.emptyState.icon || 'i-heroicons-light-bulb'"
    >
      <template #actions>
        <UButton
          v-if="props.onAction"
          color="primary"
          icon="i-heroicons-plus"
          :label="t(props.emptyState.cta.labelKey)"
          @click="props.onAction"
        />
        <UButton
          v-else
          color="primary"
          icon="i-heroicons-plus"
          :label="t(props.emptyState.cta.labelKey)"
          :to="props.emptyState.cta.to"
        />
      </template>
    </UEmpty>
  </UCard>
</template>
