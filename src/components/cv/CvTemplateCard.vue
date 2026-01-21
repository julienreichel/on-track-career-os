<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import TemplateSourceBadge from '@/components/cv/TemplateSourceBadge.vue';

const props = withDefaults(
  defineProps<{
  name: string;
  description?: string;
  updatedAt?: string | null;
  source?: string | null;
  isDefault?: boolean;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  showDelete?: boolean;
  defaultBadgeLabel?: string;
  deleteLabel?: string;
  dataTestid?: string;
  }>(),
  {
    showDelete: false,
  }
);

const emit = defineEmits<{
  primary: [];
  secondary: [];
  delete: [];
}>();

const { t } = useI18n();
const hasActions = computed(
  () => props.primaryActionLabel || props.secondaryActionLabel || props.showDelete
);

const resolvedDefaultLabel = computed(
  () => props.defaultBadgeLabel ?? t('cvTemplates.labels.default')
);
const resolvedDeleteLabel = computed(() => props.deleteLabel ?? t('common.delete'));
const updatedLabel = computed(() => t('cvTemplates.labels.updated'));
</script>

<template>
  <UCard :data-testid="dataTestid" class="space-y-3">
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-default">{{ name }}</h3>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <TemplateSourceBadge :source="source" />
            <UBadge v-if="isDefault" color="primary" variant="soft">
              {{ resolvedDefaultLabel }}
            </UBadge>
          </div>
        </div>
        <div v-if="updatedAt" class="text-xs text-dimmed">
          {{ updatedLabel }} {{ updatedAt }}
        </div>
      </div>
    </template>

    <p v-if="description" class="text-sm text-dimmed">{{ description }}</p>

    <div v-if="hasActions" class="flex flex-wrap gap-2">
      <UButton
        v-if="primaryActionLabel"
        size="sm"
        :label="primaryActionLabel"
        @click="emit('primary')"
      />
      <UButton
        v-if="secondaryActionLabel"
        size="sm"
        variant="ghost"
        :label="secondaryActionLabel"
        @click="emit('secondary')"
      />
      <UButton
        v-if="showDelete"
        size="sm"
        color="error"
        variant="ghost"
        :label="resolvedDeleteLabel"
        @click="emit('delete')"
      />
    </div>
  </UCard>
</template>
