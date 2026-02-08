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
    isSystemTemplate?: boolean;
    primaryActionLabel?: string;
    primaryActionIcon?: string;
    secondaryActionLabel?: string;
    secondaryActionIcon?: string;
    showDelete?: boolean;
    defaultBadgeLabel?: string;
    deleteLabel?: string;
    deleteIcon?: string;
    dataTestid?: string;
  }>(),
  {
    description: '',
    updatedAt: null,
    source: null,
    isDefault: false,
    isSystemTemplate: false,
    primaryActionLabel: '',
    primaryActionIcon: '',
    secondaryActionLabel: '',
    secondaryActionIcon: '',
    showDelete: false,
    defaultBadgeLabel: '',
    deleteLabel: '',
    deleteIcon: 'i-heroicons-trash',
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

const resolvedDefaultLabel = computed(() => {
  const label = props.defaultBadgeLabel?.trim();
  return label || t('applications.cvs.templates.labels.default');
});
const updatedLabel = computed(() => t('applications.cvs.templates.labels.updated'));
const resolvedSubtitle = computed(() => (props.isSystemTemplate ? '' : props.description));
const bodyDescription = computed(() =>
  props.isSystemTemplate ? (props.description?.trim() ?? '') : ''
);
</script>

<template>
  <div :data-testid="dataTestid">
    <ItemCard
      :title="name"
      :subtitle="resolvedSubtitle"
      :show-delete="showDelete"
      @delete="emit('delete')"
    >
      <p v-if="bodyDescription" class="text-sm text-dimmed">{{ bodyDescription }}</p>
      <p v-else-if="updatedAt" class="text-xs text-dimmed">{{ updatedLabel }} {{ updatedAt }}</p>

      <template #badges>
        <UBadge
          v-if="isDefault"
          color="secondary"
          variant="outline"
          size="xs"
          icon="i-heroicons-star"
        >
          {{ resolvedDefaultLabel }}
        </UBadge>
      </template>

      <template v-if="hasActions" #actions>
        <div class="flex items-center gap-2">
          <UButton
            v-if="primaryActionLabel"
            size="xs"
            :label="primaryActionLabel"
            :icon="primaryActionIcon || undefined"
            color="primary"
            variant="outline"
            @click="emit('primary')"
          />
          <UButton
            v-if="secondaryActionLabel"
            size="xs"
            :label="secondaryActionLabel"
            :icon="secondaryActionIcon || undefined"
            color="neutral"
            variant="outline"
            @click="emit('secondary')"
          />
        </div>
      </template>
    </ItemCard>
  </div>
</template>
