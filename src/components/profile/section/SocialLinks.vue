<template>
  <UCard v-if="isSectionEditing || hasSocialLinks" class="mb-6">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold">
          {{ t('profile.sections.socialLinks') }}
        </h3>
        <UButton
          v-if="showEditAction"
          icon="i-heroicons-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="t('profile.actions.editSection')"
          @click="startSectionEditing('socialLinks')"
        />
      </div>
    </template>

    <div v-if="!isSectionEditing" class="space-y-2">
      <div v-if="form.socialLinks.length === 0" class="text-sm text-gray-500">
        {{ t('profile.fields.socialLinksEmpty') }}
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="(link, index) in form.socialLinks"
          :key="`social-display-${index}`"
          class="flex items-center gap-2"
        >
          <UIcon name="i-heroicons-link" class="text-primary-500" />
          <a
            class="text-primary-600 dark:text-primary-400 truncate"
            target="_blank"
            rel="noopener noreferrer"
            :href="formatSocialLink(link)"
          >
            {{ link }}
          </a>
        </li>
      </ul>
    </div>

    <div v-else>
      <TagInput
        v-model="form.socialLinks"
        :label="t('profile.fields.socialLinks')"
        :placeholder="t('profile.fields.socialUrlPlaceholder')"
        :hint="t('profile.fields.socialLinksHint')"
        color="primary"
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
  name: 'ProfileSectionSocialLinks',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileSocialLinksSection used without provider');
}

const { t } = useI18n();
const {
  form,
  isEditing,
  editingSection,
  sectionEditingEnabled,
  loading,
  hasValidationErrors,
  hasSocialLinks,
  formatSocialLink,
  startSectionEditing,
  cancelSectionEditing,
  saveSectionEditing,
} = context;

const isSectionEditing = computed(() => isEditing.value || editingSection.value === 'socialLinks');
const showEditAction = computed(() => sectionEditingEnabled.value && !isSectionEditing.value);
const showSectionActions = computed(
  () => !isEditing.value && editingSection.value === 'socialLinks'
);
</script>
