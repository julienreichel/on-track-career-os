<template>
  <div class="space-y-6">
    <!-- Canvas Section Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">{{ t('canvas.title') }}</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ t('canvas.description') }}
        </p>
      </div>
      <UBadge v-if="canvas?.needsUpdate" color="warning" variant="soft">
        {{ t('canvas.needsUpdate') }}
      </UBadge>
    </div>

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
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.customerSegments') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.customerSegments"
          :rows="4"
          :placeholder="t('canvas.placeholders.customerSegments')"
        />
        <ul
          v-else-if="Array.isArray(canvas.customerSegments) && canvas.customerSegments.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.customerSegments" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- 2. Value Proposition -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.valueProposition') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.valueProposition"
          :rows="4"
          :placeholder="t('canvas.placeholders.valueProposition')"
        />
        <ul
          v-else-if="Array.isArray(canvas.valueProposition) && canvas.valueProposition.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.valueProposition" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- 3. Channels -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-megaphone" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.channels') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.channels"
          :rows="4"
          :placeholder="t('canvas.placeholders.channels')"
        />
        <ul
          v-else-if="Array.isArray(canvas.channels) && canvas.channels.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.channels" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- 4. Customer Relationships -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-heart" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.customerRelationships') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.customerRelationships"
          :rows="4"
          :placeholder="t('canvas.placeholders.customerRelationships')"
        />
        <ul
          v-else-if="
            Array.isArray(canvas.customerRelationships) && canvas.customerRelationships.length > 0
          "
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.customerRelationships" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- 5. Key Activities -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.keyActivities') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.keyActivities"
          :rows="4"
          :placeholder="t('canvas.placeholders.keyActivities')"
        />
        <ul
          v-else-if="Array.isArray(canvas.keyActivities) && canvas.keyActivities.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.keyActivities" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- 6. Key Resources -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cube" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.keyResources') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.keyResources"
          :rows="4"
          :placeholder="t('canvas.placeholders.keyResources')"
        />
        <ul
          v-else-if="Array.isArray(canvas.keyResources) && canvas.keyResources.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.keyResources" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- 7. Key Partners -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.keyPartners') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.keyPartners"
          :rows="4"
          :placeholder="t('canvas.placeholders.keyPartners')"
        />
        <ul
          v-else-if="Array.isArray(canvas.keyPartners) && canvas.keyPartners.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.keyPartners" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- 8. Cost Structure -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-currency-dollar" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.costStructure') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.costStructure"
          :rows="4"
          :placeholder="t('canvas.placeholders.costStructure')"
        />
        <ul
          v-else-if="Array.isArray(canvas.costStructure) && canvas.costStructure.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.costStructure" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- 9. Revenue Streams -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.revenueStreams') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.revenueStreams"
          :rows="4"
          :placeholder="t('canvas.placeholders.revenueStreams')"
        />
        <ul
          v-else-if="Array.isArray(canvas.revenueStreams) && canvas.revenueStreams.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.revenueStreams" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>
    </div>

    <!-- Action Buttons -->
    <div v-if="canvas && !loading" class="flex justify-end gap-3 pt-4 border-t">
      <UButton v-if="!isEditing" variant="outline" icon="i-heroicons-pencil" @click="startEditing">
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
