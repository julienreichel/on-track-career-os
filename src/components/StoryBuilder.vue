<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { STARStory } from '@/domain/starstory/STARStory';

export interface StoryBuilderProps {
  story?: STARStory | null;
  experienceId: string;
  mode: 'create' | 'edit';
  showGenerateButton?: boolean;
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
  generateFromText: [freeText: string];
  generateAchievements: [];
}

const props = withDefaults(defineProps<StoryBuilderProps>(), {
  story: null,
  showGenerateButton: true,
});
const emit = defineEmits<StoryBuilderEmits>();

const { t } = useI18n();

// Form state
const freeText = ref('');
const showFreeTextInput = ref(false);

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
      achievements.value = newStory.achievements || [];
      kpiSuggestions.value = newStory.kpiSuggestions || [];
    }
  },
  { immediate: true }
);

// Handlers
const handleGenerateFromText = () => {
  if (freeText.value.trim()) {
    emit('generateFromText', freeText.value);
  }
};

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
    <!-- Optional: Generate from free text -->
    <div v-if="mode === 'create' && showGenerateButton" class="mb-6">
      <UButton
        v-if="!showFreeTextInput"
        :label="t('stories.builder.generateFromText')"
        icon="i-heroicons-sparkles"
        variant="outline"
        @click="showFreeTextInput = true"
      />

      <div v-else class="space-y-3">
        <UFormField :label="t('stories.builder.freeTextLabel')">
          <UTextarea
            v-model="freeText"
            :placeholder="t('stories.builder.freeTextPlaceholder')"
            :rows="4"
            class="w-full"
          />
        </UFormField>
        <div class="flex gap-2">
          <UButton
            :label="t('stories.builder.generate')"
            icon="i-heroicons-sparkles"
            :disabled="!freeText.trim()"
            @click="handleGenerateFromText"
          />
          <UButton :label="t('common.cancel')" variant="ghost" @click="showFreeTextInput = false" />
        </div>
      </div>
    </div>

    <!-- STAR Form Fields -->
    <div class="space-y-6">
      <UFormField
        :label="t('stories.builder.situation')"
        :description="t('stories.builder.situationHint')"
        required
      >
        <UTextarea
          v-model="situation"
          :placeholder="t('stories.builder.situationPlaceholder')"
          :rows="4"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('stories.builder.task')"
        :description="t('stories.builder.taskHint')"
        required
      >
        <UTextarea
          v-model="task"
          :placeholder="t('stories.builder.taskPlaceholder')"
          :rows="4"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('stories.builder.action')"
        :description="t('stories.builder.actionHint')"
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
        :description="t('stories.builder.resultHint')"
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

        <UFormField
          :label="t('stories.builder.achievementsList')"
          :description="t('stories.builder.achievementsHint')"
        >
          <UInputTags
            v-model="achievements"
            :placeholder="t('stories.builder.achievementsPlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="t('stories.builder.kpisList')"
          :description="t('stories.builder.kpisHint')"
        >
          <UInputTags
            v-model="kpiSuggestions"
            :placeholder="t('stories.builder.kpisPlaceholder')"
            class="w-full"
          />
        </UFormField>
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
