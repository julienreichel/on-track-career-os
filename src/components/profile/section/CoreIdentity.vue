<template>
  <UCard v-if="isSectionEditing || hasCoreIdentity" class="mb-6">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">
          {{ t('profile.sections.coreIdentity') }}
        </h3>
        <UButton
          v-if="showEditAction"
          icon="i-heroicons-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          class="cursor-pointer"
          :aria-label="t('profile.actions.editSection')"
          @click="startSectionEditing('coreIdentity')"
        />
      </div>
    </template>

    <div
      class="mb-4 flex flex-col gap-4 border-b border-gray-200 pb-4 dark:border-gray-800 sm:flex-row sm:items-center"
    >
      <UAvatar
        size="xl"
        class="ring-2 ring-primary-100 dark:ring-primary-900"
        :src="photoPreviewUrl || undefined"
        :alt="form.fullName || t('profile.fields.fullName')"
        icon="i-heroicons-user-circle"
      />
      <div class="flex-1 space-y-2">
        <p v-if="!photoPreviewUrl" class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('profile.photo.empty') }}
        </p>
        <div v-if="isSectionEditing || !photoPreviewUrl" class="flex flex-wrap gap-2">
          <UButton
            :color="form.profilePhotoKey ? 'neutral' : 'primary'"
            :variant="form.profilePhotoKey ? 'subtle' : undefined"
            icon="i-heroicons-arrow-up-on-square"
            :loading="uploadingPhoto"
            :disabled="uploadingPhoto"
            @click="triggerPhotoPicker"
          >
            {{ t('profile.photo.upload') }}
          </UButton>
          <UButton
            v-if="isSectionEditing && form.profilePhotoKey"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-trash"
            :loading="uploadingPhoto"
            :disabled="uploadingPhoto"
            @click="handleRemovePhoto"
          >
            {{ t('profile.photo.remove') }}
          </UButton>
        </div>
        <p
          v-if="isSectionEditing || !photoPreviewUrl"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          {{ t('profile.photo.help') }}
        </p>
        <p v-if="photoError" class="text-sm text-red-500">
          {{ photoError }}
        </p>
      </div>
    </div>

    <input
      ref="photoInputRef"
      type="file"
      class="hidden"
      accept="image/png,image/jpeg,image/webp"
      @change="handlePhotoSelected"
    />

    <div v-if="!isSectionEditing" class="space-y-4">
      <div v-if="form.fullName">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.fullName') }}
          <span class="text-red-500">*</span>
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ form.fullName }}
        </p>
      </div>

      <div v-if="form.headline">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.headline') }}
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ form.headline }}
        </p>
      </div>

      <div v-if="form.location">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.location') }}
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ form.location }}
        </p>
      </div>

      <div v-if="form.seniorityLevel">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.seniorityLevel') }}
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ form.seniorityLevel }}
        </p>
      </div>
    </div>

    <div v-else class="space-y-4">
      <UFormField :label="t('profile.fields.fullName')" required>
        <UInput
          v-model="form.fullName"
          :placeholder="t('profile.fields.fullNamePlaceholder')"
          class="w-xs"
          required
        />
      </UFormField>

      <UFormField :label="t('profile.fields.headline')">
        <UInput
          v-model="form.headline"
          :placeholder="t('profile.fields.headlinePlaceholder')"
          class="w-xs"
        />
      </UFormField>

      <UFormField :label="t('profile.fields.location')">
        <UInput
          v-model="form.location"
          :placeholder="t('profile.fields.locationPlaceholder')"
          class="w-xs"
        />
      </UFormField>

      <UFormField :label="t('profile.fields.seniorityLevel')">
        <UInput
          v-model="form.seniorityLevel"
          :placeholder="t('profile.fields.seniorityLevelPlaceholder')"
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
import { profileFormContextKey } from '@/components/profile/profileFormContext';

defineOptions({
  name: 'ProfileSectionCoreIdentity',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileCoreIdentitySection used without provider');
}

const { t } = useI18n();
const {
  form,
  isEditing,
  editingSection,
  sectionEditingEnabled,
  loading,
  hasValidationErrors,
  hasCoreIdentity,
  photoPreviewUrl,
  uploadingPhoto,
  photoError,
  photoInputRef,
  triggerPhotoPicker,
  handlePhotoSelected,
  handleRemovePhoto,
  startSectionEditing,
  cancelSectionEditing,
  saveSectionEditing,
} = context;

const isSectionEditing = computed(() => isEditing.value || editingSection.value === 'coreIdentity');
const showEditAction = computed(() => sectionEditingEnabled.value && !isSectionEditing.value);
const showSectionActions = computed(
  () => !isEditing.value && editingSection.value === 'coreIdentity'
);
</script>
