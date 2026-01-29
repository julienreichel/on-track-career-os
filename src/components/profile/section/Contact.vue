<template>
  <UCard v-if="isSectionEditing || hasContactInfo" class="mb-6">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">
          {{ t('profile.sections.contactInfo') }}
        </h3>
        <UButton
          v-if="showEditAction"
          icon="i-heroicons-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          class="cursor-pointer"
          :aria-label="t('profile.actions.editSection')"
          @click="startSectionEditing('contactInfo')"
        />
      </div>
    </template>

    <div v-if="!isSectionEditing" class="space-y-4">
      <div v-if="form.primaryEmail">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.primaryEmail') }}
        </label>
        <a class="text-primary-600 dark:text-primary-400" :href="`mailto:${form.primaryEmail}`">
          {{ form.primaryEmail }}
        </a>
      </div>
      <div v-if="form.primaryPhone">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.primaryPhone') }}
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ form.primaryPhone }}
        </p>
      </div>
    </div>

    <div v-else class="space-y-4">
      <UFormField :label="t('profile.fields.primaryEmail')" :error="emailError">
        <UInput
          v-model="form.primaryEmail"
          type="email"
          :placeholder="t('profile.fields.emailPlaceholder')"
          class="w-xs"
        />
      </UFormField>

      <UFormField :label="t('profile.fields.primaryPhone')" :error="phoneError">
        <UInput
          v-model="form.primaryPhone"
          :placeholder="t('profile.fields.phonePlaceholder')"
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
  name: 'ProfileSectionContact',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileContactSection used without provider');
}

const { t } = useI18n();
const {
  form,
  isEditing,
  editingSection,
  sectionEditingEnabled,
  loading,
  hasValidationErrors,
  hasContactInfo,
  emailError,
  phoneError,
  startSectionEditing,
  cancelSectionEditing,
  saveSectionEditing,
} = context;

const isSectionEditing = computed(() => isEditing.value || editingSection.value === 'contactInfo');
const showEditAction = computed(() => sectionEditingEnabled.value && !isSectionEditing.value);
const showSectionActions = computed(
  () => !isEditing.value && editingSection.value === 'contactInfo'
);
</script>
