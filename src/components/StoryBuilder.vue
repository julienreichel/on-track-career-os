<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { STARStory } from '@/domain/starstory/STARStory';
import TagInput from '@/components/TagInput.vue';

export interface StoryBuilderProps {
  story?: STARStory | null;
  experienceId: string;
  mode: 'create' | 'edit';
  generatedAchievements?: {
    achievements: string[];
    kpiSuggestions: string[];
  } | null;
}

export interface StoryBuilderEmits {
  save: [
    story: {
      situation: string;
      task: string;
      action: string;
      result: string;
      achievements: string[];
      kpiSuggestions: string[];
    },
  ];
  cancel: [];
  generateAchievements: [];
}

const props = withDefaults(defineProps<StoryBuilderProps>(), {
  story: null,
  generatedAchievements: null,
});
const emit = defineEmits<StoryBuilderEmits>();

const { t } = useI18n();

// Form state
const situation = ref('');
const task = ref('');
const action = ref('');
const result = ref('');
const achievements = ref<string[]>([]);
const kpiSuggestions = ref<string[]>([]);

// Watch for story changes (edit mode)
watch(
  () => props.story,
  (newStory) => {
    if (newStory) {
      situation.value = newStory.situation || '';
      task.value = newStory.task || '';
      action.value = newStory.action || '';
      result.value = newStory.result || '';
      achievements.value =
        newStory.achievements?.filter((entry): entry is string => typeof entry === 'string') || [];
      kpiSuggestions.value =
        newStory.kpiSuggestions?.filter((entry): entry is string => typeof entry === 'string') || [];
    }
  },
  { immediate: true }
);

// Watch for generated achievements
watch(
  () => props.generatedAchievements,
  (newAchievements) => {
    if (newAchievements) {
      achievements.value = newAchievements.achievements || [];
      kpiSuggestions.value = newAchievements.kpiSuggestions || [];
    }
  }
);

// Handlers
const handleGenerateAchievements = () => {
  emit('generateAchievements');
};

const handleSave = () => {
  emit('save', {
    situation: situation.value,
    task: task.value,
    action: action.value,
    result: result.value,
    achievements: achievements.value,
    kpiSuggestions: kpiSuggestions.value,
  });
};

const handleCancel = () => {
  emit('cancel');
};

const isValid = () => {
  return (
    situation.value.trim() !== '' &&
    task.value.trim() !== '' &&
    action.value.trim() !== '' &&
    result.value.trim() !== ''
  );
};
</script>

<template>
  <UCard>
    <!-- STAR Form Fields -->
    <div class="space-y-6">
      <UFormField
        :label="t('stories.builder.situation')"
        :hint="t('stories.builder.situationHint')"
        required
      >
        <UTextarea
          v-model="situation"
          :placeholder="t('stories.builder.situationPlaceholder')"
          :rows="4"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="t('stories.builder.task')" :hint="t('stories.builder.taskHint')" required>
        <UTextarea
          v-model="task"
          :placeholder="t('stories.builder.taskPlaceholder')"
          :rows="4"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('stories.builder.action')"
        :hint="t('stories.builder.actionHint')"
        required
      >
        <UTextarea
          v-model="action"
          :placeholder="t('stories.builder.actionPlaceholder')"
          :rows="4"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('stories.builder.result')"
        :hint="t('stories.builder.resultHint')"
        required
      >
        <UTextarea
          v-model="result"
          :placeholder="t('stories.builder.resultPlaceholder')"
          :rows="4"
          class="w-full"
        />
      </UFormField>

      <!-- Achievements Section -->
      <div class="border-t pt-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">
            {{ t('stories.builder.achievements') }}
          </h3>
          <UButton
            :label="t('stories.builder.generateAchievements')"
            icon="i-heroicons-sparkles"
            variant="outline"
            size="sm"
            :disabled="!isValid()"
            @click="handleGenerateAchievements"
          />
        </div>

        <TagInput
          v-model="achievements"
          :label="t('stories.builder.achievementsList')"
          :hint="t('stories.builder.achievementsHint')"
          :placeholder="t('stories.builder.achievementsPlaceholder')"
        />

        <TagInput
          v-model="kpiSuggestions"
          :label="t('stories.builder.kpisList')"
          :hint="t('stories.builder.kpisHint')"
          :placeholder="t('stories.builder.kpisPlaceholder')"
        />
      </div>
    </div>

    <!-- Actions -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton :label="t('common.cancel')" variant="ghost" @click="handleCancel" />
        <UButton
          :label="t('common.save')"
          color="primary"
          :disabled="!isValid()"
          @click="handleSave"
        />
      </div>
    </template>
  </UCard>
</template>
