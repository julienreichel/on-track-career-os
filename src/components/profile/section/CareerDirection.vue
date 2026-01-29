<template>
  <UCard v-if="isSectionEditing || hasCareerDirection" class="mb-6">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">
          {{ t('profile.sections.careerDirection') }}
        </h3>
        <UButton
          v-if="showEditAction"
          icon="i-heroicons-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          class="cursor-pointer"
          :aria-label="t('profile.actions.editSection')"
          @click="startSectionEditing('careerDirection')"
        />
      </div>
    </template>

    <div class="space-y-4">
      <TagInput
        v-if="isSectionEditing || form.aspirations.length > 0"
        v-model="form.aspirations"
        :label="t('profile.fields.aspirations')"
        :placeholder="isSectionEditing ? t('profile.fields.aspirationsPlaceholder') : ''"
        :hint="isSectionEditing ? t('profile.fields.aspirationsHint') : ''"
        color="primary"
        :editable="isSectionEditing"
      />
    </div>
    <template v-if="showSectionActions" #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('profile.actions.cancel')"
          @click="cancelSectionEditing"
        />
        <UButton
          color="primary"
          :label="t('common.save')"
          :loading="loading"
          :disabled="loading || hasValidationErrors"
          @click="saveSectionEditing"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import TagInput from '@/components/TagInput.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';

defineOptions({
  name: 'ProfileSectionCareerDirection',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileCareerDirectionSection used without provider');
}

const { t } = useI18n();
const {
  form,
  isEditing,
  editingSection,
  sectionEditingEnabled,
  loading,
  hasValidationErrors,
  hasCareerDirection,
  startSectionEditing,
  cancelSectionEditing,
  saveSectionEditing,
} = context;

const isSectionEditing = computed(
  () => isEditing.value || editingSection.value === 'careerDirection'
);
const showEditAction = computed(() => sectionEditingEnabled.value && !isSectionEditing.value);
const showSectionActions = computed(
  () => !isEditing.value && editingSection.value === 'careerDirection'
);
</script>
