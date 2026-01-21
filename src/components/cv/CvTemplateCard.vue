<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemCard from '@/components/ItemCard.vue';

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
    description: '',
    updatedAt: null,
    source: null,
    isDefault: false,
    primaryActionLabel: '',
    secondaryActionLabel: '',
    showDelete: false,
    defaultBadgeLabel: '',
    deleteLabel: '',
    dataTestid: '',
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
  <div :data-testid="dataTestid">
    <ItemCard :title="name" :subtitle="description" :show-delete="false">
      <p v-if="updatedAt" class="text-xs text-dimmed">
        {{ updatedLabel }} {{ updatedAt }}
      </p>

      <template #badges>
        <UBadge v-if="isDefault" color="primary" variant="soft">
          {{ resolvedDefaultLabel }}
        </UBadge>
      </template>

      <template v-if="hasActions" #actions>
        <UButton
          v-if="primaryActionLabel"
          size="xs"
          :label="primaryActionLabel"
          color="primary"
          variant="soft"
          @click="emit('primary')"
        />
        <UButton
          v-if="secondaryActionLabel"
          size="xs"
          :label="secondaryActionLabel"
          color="neutral"
          variant="soft"
          @click="emit('secondary')"
        />
        <UButton
          v-if="showDelete"
          size="xs"
          :label="resolvedDeleteLabel"
          color="error"
          variant="ghost"
          @click="emit('delete')"
        />
      </template>
    </ItemCard>
  </div>
</template>
