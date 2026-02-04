<template>
  <UCard v-if="isSectionEditing || hasProfessionalAttributes" class="mb-6">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">
          {{ t('profile.sections.professionalAttributes') }}
        </h3>
        <UButton
          v-if="showEditAction"
          icon="i-heroicons-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          class="cursor-pointer"
          :aria-label="t('profile.actions.editSection')"
          @click="startSectionEditing('professionalAttributes')"
        />
      </div>
    </template>

    <div class="space-y-4">
      <TagInput
        v-if="isSectionEditing || form.skills.length > 0"
        v-model="form.skills"
        :label="t('profile.fields.skills')"
        :placeholder="isSectionEditing ? t('profile.fields.skillsPlaceholder') : ''"
        :hint="isSectionEditing ? t('profile.fields.skillsHint') : ''"
        color="success"
        :editable="isSectionEditing"
      />

      <TagInput
        v-if="isSectionEditing || form.certifications.length > 0"
        v-model="form.certifications"
        :label="t('profile.fields.certifications')"
        :placeholder="isSectionEditing ? t('profile.fields.certificationsPlaceholder') : ''"
        :hint="isSectionEditing ? t('profile.fields.certificationsHint') : ''"
        color="success"
        :editable="isSectionEditing"
      />

      <TagInput
        v-if="isSectionEditing || form.languages.length > 0"
        v-model="form.languages"
        :label="t('profile.fields.languages')"
        :placeholder="isSectionEditing ? t('profile.fields.languagesPlaceholder') : ''"
        :hint="isSectionEditing ? t('profile.fields.languagesHint') : ''"
        color="success"
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
          :label="t('common.actions.save')"
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
  name: 'ProfileSectionProfessionalAttributes',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileProfessionalAttributesSection used without provider');
}

const { t } = useI18n();
const {
  form,
  isEditing,
  editingSection,
  sectionEditingEnabled,
  loading,
  hasValidationErrors,
  hasProfessionalAttributes,
  startSectionEditing,
  cancelSectionEditing,
  saveSectionEditing,
} = context;

const isSectionEditing = computed(
  () => isEditing.value || editingSection.value === 'professionalAttributes'
);
const showEditAction = computed(() => sectionEditingEnabled.value && !isSectionEditing.value);
const showSectionActions = computed(
  () => !isEditing.value && editingSection.value === 'professionalAttributes'
);
</script>
