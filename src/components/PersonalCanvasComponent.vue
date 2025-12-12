<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <UCard v-else-if="!canvas" class="text-center py-12">
      <template #header>
        <h3 class="text-lg font-semibold">{{ t('canvas.empty.title') }}</h3>
      </template>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ t('canvas.empty.description') }}
      </p>
      <UButton icon="i-heroicons-sparkles" size="lg" @click="$emit('generate')">
        {{ t('canvas.actions.generate') }}
      </UButton>
    </UCard>

    <!-- Canvas Grid - Official Business Model Canvas 9 Blocks -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 1. Customer Segments -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.customerSegments"
        icon="i-heroicons-user-group"
        :title="t('canvas.sections.customerSegments')"
        :items="canvas.customerSegments"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.customerSegments')"
        :empty-text="t('canvas.empty.field')"
      />

      <!-- 2. Value Proposition -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.valueProposition"
        icon="i-heroicons-light-bulb"
        :title="t('canvas.sections.valueProposition')"
        :items="canvas.valueProposition"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.valueProposition')"
        :empty-text="t('canvas.empty.field')"
      />

      <!-- 3. Channels -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.channels"
        icon="i-heroicons-megaphone"
        :title="t('canvas.sections.channels')"
        :items="canvas.channels"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.channels')"
        :empty-text="t('canvas.empty.field')"
      />

      <!-- 4. Customer Relationships -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.customerRelationships"
        icon="i-heroicons-heart"
        :title="t('canvas.sections.customerRelationships')"
        :items="canvas.customerRelationships"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.customerRelationships')"
        :empty-text="t('canvas.empty.field')"
      />

      <!-- 5. Key Activities -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.keyActivities"
        icon="i-heroicons-cog-6-tooth"
        :title="t('canvas.sections.keyActivities')"
        :items="canvas.keyActivities"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.keyActivities')"
        :empty-text="t('canvas.empty.field')"
      />

      <!-- 6. Key Resources -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.keyResources"
        icon="i-heroicons-cube"
        :title="t('canvas.sections.keyResources')"
        :items="canvas.keyResources"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.keyResources')"
        :empty-text="t('canvas.empty.field')"
      />

      <!-- 7. Key Partners -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.keyPartners"
        icon="i-heroicons-users"
        :title="t('canvas.sections.keyPartners')"
        :items="canvas.keyPartners"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.keyPartners')"
        :empty-text="t('canvas.empty.field')"
      />

      <!-- 8. Cost Structure -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.costStructure"
        icon="i-heroicons-currency-dollar"
        :title="t('canvas.sections.costStructure')"
        :items="canvas.costStructure"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.costStructure')"
        :empty-text="t('canvas.empty.field')"
      />

      <!-- 9. Revenue Streams -->
      <CanvasSectionCard
        v-model:edit-value="localCanvas.revenueStreams"
        icon="i-heroicons-banknotes"
        :title="t('canvas.sections.revenueStreams')"
        :items="canvas.revenueStreams"
        :is-editing="isEditing"
        :placeholder="t('canvas.placeholders.revenueStreams')"
        :empty-text="t('canvas.empty.field')"
      />
    </div>

    <!-- Action Buttons -->
    <div v-if="canvas && !loading" class="flex items-center justify-between pt-4 border-t">
      <UBadge v-if="canvas.needsUpdate" color="warning" variant="soft">
        {{ t('canvas.needsUpdate') }}
      </UBadge>
      <div v-else />

      <div class="flex gap-3">
        <UButton
          v-if="!isEditing"
          variant="outline"
          icon="i-heroicons-pencil"
          @click="startEditing"
        >
          {{ t('canvas.actions.edit') }}
        </UButton>

        <UButton
          v-if="!isEditing"
          variant="outline"
          icon="i-heroicons-arrow-path"
          @click="$emit('regenerate')"
        >
          {{ t('canvas.actions.regenerate') }}
        </UButton>

        <UButton v-if="isEditing" variant="outline" @click="cancelEditing">
          {{ t('canvas.actions.cancel') }}
        </UButton>

        <UButton v-if="isEditing" icon="i-heroicons-check" :loading="loading" @click="saveChanges">
          {{ t('canvas.actions.save') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';

const { t } = useI18n();

interface Props {
  canvas: PersonalCanvas | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  save: [canvas: Partial<PersonalCanvas>];
  generate: [];
  regenerate: [];
}>();

const isEditing = ref(false);
const localCanvas = ref({
  customerSegments: '',
  valueProposition: '',
  channels: '',
  customerRelationships: '',
  keyActivities: '',
  keyResources: '',
  keyPartners: '',
  costStructure: '',
  revenueStreams: '',
});

// Helper to convert arrays to newline-separated strings for editing
// Handles Amplify Nullable<string>[] types from GraphQL schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arrayToString = (arr: any): string => {
  if (Array.isArray(arr)) {
    return arr
      .filter((s): s is string => s !== null && s !== undefined && typeof s === 'string')
      .join('\n');
  }
  if (typeof arr === 'string') return arr;
  return '';
};

// Helper to convert newline-separated strings to arrays
const stringToArray = (str: string): string[] => {
  return str
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const startEditing = () => {
  if (!props.canvas) return;

  localCanvas.value = {
    customerSegments: arrayToString(props.canvas.customerSegments),
    valueProposition: arrayToString(props.canvas.valueProposition),
    channels: arrayToString(props.canvas.channels),
    customerRelationships: arrayToString(props.canvas.customerRelationships),
    keyActivities: arrayToString(props.canvas.keyActivities),
    keyResources: arrayToString(props.canvas.keyResources),
    keyPartners: arrayToString(props.canvas.keyPartners),
    costStructure: arrayToString(props.canvas.costStructure),
    revenueStreams: arrayToString(props.canvas.revenueStreams),
  };

  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
};

const saveChanges = () => {
  const updated: Partial<PersonalCanvas> = {
    customerSegments: stringToArray(localCanvas.value.customerSegments),
    valueProposition: stringToArray(localCanvas.value.valueProposition),
    channels: stringToArray(localCanvas.value.channels),
    customerRelationships: stringToArray(localCanvas.value.customerRelationships),
    keyActivities: stringToArray(localCanvas.value.keyActivities),
    keyResources: stringToArray(localCanvas.value.keyResources),
    keyPartners: stringToArray(localCanvas.value.keyPartners),
    costStructure: stringToArray(localCanvas.value.costStructure),
    revenueStreams: stringToArray(localCanvas.value.revenueStreams),
  };

  emit('save', updated);
  isEditing.value = false;
};

// Reset editing state when canvas changes
watch(
  () => props.canvas,
  () => {
    if (isEditing.value) {
      isEditing.value = false;
    }
  }
);
</script>
