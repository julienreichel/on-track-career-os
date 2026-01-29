<template>
  <UCard v-if="isSectionEditing || hasIdentityValues" class="mb-6">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">
          {{ t('profile.sections.identityValues') }}
        </h3>
        <UButton
          v-if="showEditAction"
          icon="i-heroicons-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="startSectionEditing('identityValues')"
        />
      </div>
    </template>

    <div class="space-y-4">
      <TagInput
        v-if="isSectionEditing || form.personalValues.length > 0"
        v-model="form.personalValues"
        :label="t('profile.fields.personalValues')"
        :placeholder="isSectionEditing ? t('profile.fields.personalValuesPlaceholder') : ''"
        :hint="isSectionEditing ? t('profile.fields.personalValuesHint') : ''"
        color="info"
        :editable="isSectionEditing"
      />

      <TagInput
        v-if="isSectionEditing || form.strengths.length > 0"
        v-model="form.strengths"
        :label="t('profile.fields.strengths')"
        :placeholder="isSectionEditing ? t('profile.fields.strengthsPlaceholder') : ''"
        :hint="isSectionEditing ? t('profile.fields.strengthsHint') : ''"
        color="info"
        :editable="isSectionEditing"
      />

      <TagInput
        v-if="isSectionEditing || form.interests.length > 0"
        v-model="form.interests"
        :label="t('profile.fields.interests')"
        :placeholder="isSectionEditing ? t('profile.fields.interestsPlaceholder') : ''"
        :hint="isSectionEditing ? t('profile.fields.interestsHint') : ''"
        color="info"
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
  name: 'ProfileSectionIdentityValues',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileIdentityValuesSection used without provider');
}

const { t } = useI18n();
const {
  form,
  isEditing,
  editingSection,
  sectionEditingEnabled,
  loading,
  hasValidationErrors,
  hasIdentityValues,
  startSectionEditing,
  cancelSectionEditing,
  saveSectionEditing,
} = context;

const isSectionEditing = computed(
  () => isEditing.value || editingSection.value === 'identityValues'
);
const showEditAction = computed(() => sectionEditingEnabled.value && !isSectionEditing.value);
const showSectionActions = computed(
  () => !isEditing.value && editingSection.value === 'identityValues'
);
</script>
