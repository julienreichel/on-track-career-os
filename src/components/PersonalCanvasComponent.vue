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

    <!-- Canvas Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Value Proposition -->
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
        <p v-else class="text-sm">
          {{ canvas.valueProposition || t('canvas.empty.field') }}
        </p>
      </UCard>

      <!-- Key Activities -->
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

      <!-- Strengths & Advantage -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-star" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.strengthsAdvantage') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.strengthsAdvantage"
          :rows="4"
          :placeholder="t('canvas.placeholders.strengthsAdvantage')"
        />
        <p v-else class="text-sm">
          {{ canvas.strengthsAdvantage || t('canvas.empty.field') }}
        </p>
      </UCard>

      <!-- Target Roles -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-briefcase" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.targetRoles') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.targetRoles"
          :rows="4"
          :placeholder="t('canvas.placeholders.targetRoles')"
        />
        <ul
          v-else-if="Array.isArray(canvas.targetRoles) && canvas.targetRoles.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.targetRoles" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- Channels -->
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

      <!-- Resources -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cube" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.resources') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.resources"
          :rows="4"
          :placeholder="t('canvas.placeholders.resources')"
        />
        <ul
          v-else-if="Array.isArray(canvas.resources) && canvas.resources.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.resources" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- Career Direction -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.careerDirection') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.careerDirection"
          :rows="4"
          :placeholder="t('canvas.placeholders.careerDirection')"
        />
        <p v-else class="text-sm">
          {{ canvas.careerDirection || t('canvas.empty.field') }}
        </p>
      </UCard>

      <!-- Pain Relievers -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.painRelievers') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.painRelievers"
          :rows="4"
          :placeholder="t('canvas.placeholders.painRelievers')"
        />
        <ul
          v-else-if="Array.isArray(canvas.painRelievers) && canvas.painRelievers.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.painRelievers" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ t('canvas.empty.field') }}</p>
      </UCard>

      <!-- Gain Creators -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-rocket-launch" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">{{ t('canvas.sections.gainCreators') }}</h3>
          </div>
        </template>
        <UTextarea
          v-if="isEditing"
          v-model="localCanvas.gainCreators"
          :rows="4"
          :placeholder="t('canvas.placeholders.gainCreators')"
        />
        <ul
          v-else-if="Array.isArray(canvas.gainCreators) && canvas.gainCreators.length > 0"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(item, idx) in canvas.gainCreators" :key="idx">{{ item }}</li>
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
  valueProposition: '',
  keyActivities: '',
  strengthsAdvantage: '',
  targetRoles: '',
  channels: '',
  resources: '',
  careerDirection: '',
  painRelievers: '',
  gainCreators: '',
});

// Helper to convert arrays to newline-separated strings for editing
const arrayToString = (arr: string[] | string | null | undefined): string => {
  if (Array.isArray(arr)) return arr.filter(s => s !== null && s !== undefined).join('\n');
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
    valueProposition: arrayToString(props.canvas.valueProposition),
    keyActivities: arrayToString(props.canvas.keyActivities),
    strengthsAdvantage: arrayToString(props.canvas.strengthsAdvantage),
    targetRoles: arrayToString(props.canvas.targetRoles),
    channels: arrayToString(props.canvas.channels),
    resources: arrayToString(props.canvas.resources),
    careerDirection: arrayToString(props.canvas.careerDirection),
    painRelievers: arrayToString(props.canvas.painRelievers),
    gainCreators: arrayToString(props.canvas.gainCreators),
  };

  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
};

const saveChanges = () => {
  const updated: Partial<PersonalCanvas> = {
    valueProposition: localCanvas.value.valueProposition,
    keyActivities: stringToArray(localCanvas.value.keyActivities),
    strengthsAdvantage: localCanvas.value.strengthsAdvantage,
    targetRoles: stringToArray(localCanvas.value.targetRoles),
    channels: stringToArray(localCanvas.value.channels),
    resources: stringToArray(localCanvas.value.resources),
    careerDirection: localCanvas.value.careerDirection,
    painRelievers: stringToArray(localCanvas.value.painRelievers),
    gainCreators: stringToArray(localCanvas.value.gainCreators),
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
