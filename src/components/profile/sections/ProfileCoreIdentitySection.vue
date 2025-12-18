<template>
  <UCard v-if="isEditing || hasCoreIdentity" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.coreIdentity') }}
      </h3>
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
        <div v-if="isEditing" class="flex flex-wrap gap-2">
          <UButton
            color="primary"
            variant="soft"
            icon="i-heroicons-arrow-up-on-square"
            :loading="uploadingPhoto"
            :disabled="uploadingPhoto"
            @click="triggerPhotoPicker"
          >
            {{ t('profile.photo.upload') }}
          </UButton>
          <UButton
            v-if="form.profilePhotoKey"
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
        <p class="text-xs text-gray-500 dark:text-gray-400">
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
    >

    <div v-if="!isEditing" class="space-y-4">
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
          required
        />
      </UFormField>

      <UFormField :label="t('profile.fields.headline')">
        <UInput v-model="form.headline" :placeholder="t('profile.fields.headlinePlaceholder')" />
      </UFormField>

      <UFormField :label="t('profile.fields.location')">
        <UInput v-model="form.location" :placeholder="t('profile.fields.locationPlaceholder')" />
      </UFormField>

      <UFormField :label="t('profile.fields.seniorityLevel')">
        <UInput
          v-model="form.seniorityLevel"
          :placeholder="t('profile.fields.seniorityLevelPlaceholder')"
        />
      </UFormField>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { profileFormContextKey } from '@/components/profile/profileFormContext';

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileCoreIdentitySection used without provider');
}

const { t } = useI18n();
const {
  form,
  isEditing,
  hasCoreIdentity,
  photoPreviewUrl,
  uploadingPhoto,
  photoError,
  photoInputRef,
  triggerPhotoPicker,
  handlePhotoSelected,
  handleRemovePhoto,
} = context;
</script>
