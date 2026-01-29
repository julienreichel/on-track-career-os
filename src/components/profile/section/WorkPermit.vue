<template>
  <UCard v-if="isSectionEditing || hasWorkPermit" class="mb-6">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">
          {{ t('profile.sections.workPermit') }}
        </h3>
        <UButton
          v-if="showEditAction"
          icon="i-heroicons-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="startSectionEditing('workPermit')"
        />
      </div>
    </template>

    <div v-if="!isSectionEditing">
      <p v-if="form.workPermitInfo" class="text-base text-gray-900 dark:text-gray-100">
        {{ form.workPermitInfo }}
      </p>
      <p v-else class="text-sm text-gray-500">
        {{ t('profile.fields.workPermitEmpty') }}
      </p>
    </div>

    <div v-else>
      <UFormField :label="t('profile.fields.workPermitInfo')">
        <UInput
          v-model="form.workPermitInfo"
          :placeholder="t('profile.fields.workPermitPlaceholder')"
          class="w-xs"
        />
      </UFormField>
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
import { profileFormContextKey } from '@/components/profile/profileFormContext';

defineOptions({
  name: 'ProfileSectionWorkPermit',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileWorkPermitSection used without provider');
}

const { t } = useI18n();
const {
  form,
  isEditing,
  editingSection,
  sectionEditingEnabled,
  loading,
  hasValidationErrors,
  hasWorkPermit,
  startSectionEditing,
  cancelSectionEditing,
  saveSectionEditing,
} = context;

const isSectionEditing = computed(() => isEditing.value || editingSection.value === 'workPermit');
const showEditAction = computed(() => sectionEditingEnabled.value && !isSectionEditing.value);
const showSectionActions = computed(
  () => !isEditing.value && editingSection.value === 'workPermit'
);
</script>
