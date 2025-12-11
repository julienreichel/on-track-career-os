<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
  achievements: string[];
  kpis: string[];
  generating?: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  'update:achievements': [achievements: string[]];
  'update:kpis': [kpis: string[]];
  regenerate: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">{{ t('enhancer.title') }}</h3>
      <UButton
        v-if="!readonly"
        :label="t('enhancer.regenerate')"
        icon="i-heroicons-arrow-path"
        variant="ghost"
        size="sm"
        :loading="generating"
        @click="emit('regenerate')"
      />
    </div>

    <!-- Achievements Section -->
    <TagInput
      :model-value="achievements"
      :label="t('stories.builder.achievementsList')"
      :hint="t('stories.builder.achievementsHint')"
      :placeholder="t('stories.builder.achievementsPlaceholder')"
      :disabled="readonly"
      color="primary"
      @update:model-value="emit('update:achievements', $event)"
    />

    <!-- KPIs Section -->
    <TagInput
      :model-value="kpis"
      :label="t('stories.builder.kpisList')"
      :hint="t('stories.builder.kpisHint')"
      :placeholder="t('stories.builder.kpisPlaceholder')"
      :disabled="readonly"
      color="success"
      @update:model-value="emit('update:kpis', $event)"
    />
  </div>
</template>
