<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="document?.name || $t('cvDisplay.untitled')"
        :links="[
          {
            label: $t('cvDisplay.backToCvs'),
            to: '/cv',
            icon: 'i-heroicons-arrow-left',
          },
        ]"
      />

      <UPageBody>
        <!-- Error Alert -->
        <UAlert
          v-if="error"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="$t('common.error')"
          :description="error"
          class="mb-6"
        />

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('cvDisplay.loading') }}
            </p>
          </div>
        </div>

        <!-- Saving State -->
        <div v-else-if="saving" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('cvDisplay.saving') }}
            </p>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else-if="document" class="space-y-6">
          <!-- Edit Mode: Markdown Editor -->
          <UCard v-if="isEditing">
            <div class="space-y-4">
              <div>
                <h3 class="text-lg font-semibold mb-2">
                  {{ $t('cvDisplay.editMode') }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('cvDisplay.markdownHelp') }}
                </p>
              </div>

              <UFormField :label="$t('cvDisplay.contentLabel')" required>
                <UTextarea
                  v-model="editContent"
                  :rows="25"
                  :placeholder="$t('cvDisplay.markdownPlaceholder')"
                  class="font-mono text-sm w-full"
                />
              </UFormField>

              <div class="border-t border-gray-200 pt-4 dark:border-gray-800">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ $t('cvDisplay.photoToggleLabel') }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ $t('cvDisplay.photoToggleDescription') }}
                    </p>
                  </div>
                  <USwitch
                    v-model="showProfilePhotoSetting"
                    :label="
                      showProfilePhotoSetting
                        ? $t('cvDisplay.photoToggleOn')
                        : $t('cvDisplay.photoToggleOff')
                    "
                  />
                </div>
                <div class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span v-if="profilePhotoLoading">{{ $t('cvDisplay.photoLoading') }}</span>
                  <span v-else-if="profilePhotoError">{{ profilePhotoError }}</span>
                  <span v-else-if="!profilePhotoUrl">{{ $t('cvDisplay.photoUnavailable') }}</span>
                </div>
                <div
                  v-if="profilePhotoUrl"
                  class="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <img
                    :src="profilePhotoUrl"
                    :alt="$t('cvDisplay.photoAlt')"
                    class="h-16 w-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ $t('cvDisplay.photoPreviewHelp') }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>

          <!-- View Mode: Rendered HTML -->
          <UCard v-else>
            <div class="relative">
              <div v-if="previewShowsPhoto" class="cv-photo-badge">
                <img
                  :src="profilePhotoUrl!"
                  :alt="$t('cvDisplay.photoAlt')"
                  class="cv-photo-image"
                />
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="prose prose-gray max-w-none" v-html="renderedHtml" />
            </div>
          </UCard>

          <!-- Action Buttons -->
          <div v-if="isEditing" class="flex justify-end gap-3">
            <UButton :label="$t('common.cancel')" variant="ghost" @click="handleCancel" />
            <UButton
              :label="$t('common.save')"
              icon="i-heroicons-check"
              :disabled="!hasChanges || saving"
              :loading="saving"
              @click="saveEdit"
            />
          </div>
          <div v-else class="flex justify-end gap-3">
            <UButton
              :label="$t('cvDisplay.actions.exportPdf')"
              icon="i-heroicons-arrow-down-tray"
              variant="outline"
              @click="handlePrint"
            />
            <UButton
              :label="$t('cvDisplay.actions.edit')"
              icon="i-heroicons-pencil"
              variant="outline"
              @click="toggleEdit"
            />
          </div>
        </div>

        <!-- Not Found -->
        <UAlert
          v-else-if="!loading"
          color="warning"
          icon="i-heroicons-exclamation-triangle"
          :title="$t('cvDisplay.notFound')"
          :description="$t('cvDisplay.notFoundDescription')"
        />
      </UPageBody>
    </UPage>

    <!-- Unsaved Changes Modal -->
    <UnsavedChangesModal v-model:open="showCancelConfirm" @discard="handleConfirmCancel" />
  </UContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

const { t } = useI18n();
const route = useRoute();
const toast = useToast();

const cvId = computed(() => route.params.id as string);

const service = new CVDocumentService();
const userProfileService = new UserProfileService();
const profilePhotoService = new ProfilePhotoService();
const document = ref<CVDocument | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editContent = ref('');
const originalContent = ref('');
const showProfilePhotoSetting = ref(true);
const originalShowProfilePhoto = ref(true);
const showCancelConfirm = ref(false);
const profilePhotoUrl = ref<string | null>(null);
const profilePhotoLoading = ref(false);
const profilePhotoError = ref<string | null>(null);

const renderedHtml = computed(() => {
  if (!document.value?.content) return '';
  return marked(document.value.content);
});

const previewShowsPhoto = computed(() => {
  const enabled = isEditing.value
    ? showProfilePhotoSetting.value
    : (document.value?.showProfilePhoto ?? true);
  return enabled && !!profilePhotoUrl.value;
});

const hasChanges = computed(() => {
  return (
    editContent.value !== originalContent.value ||
    showProfilePhotoSetting.value !== originalShowProfilePhoto.value
  );
});

const loadProfilePhoto = async (userId: string) => {
  profilePhotoLoading.value = true;
  profilePhotoError.value = null;

  try {
    const profile = await userProfileService.getFullUserProfile(userId);
    const key = profile?.profilePhotoKey;

    if (key) {
      profilePhotoUrl.value = await profilePhotoService.getSignedUrl(key);
    } else {
      profilePhotoUrl.value = null;
    }
  } catch (err) {
    profilePhotoUrl.value = null;
    profilePhotoError.value = err instanceof Error ? err.message : 'Failed to load profile photo';
    console.error('[cvDisplay] Error loading profile photo:', err);
  } finally {
    profilePhotoLoading.value = false;
  }
};

const load = async () => {
  loading.value = true;
  error.value = null;

  try {
    document.value = await service.getFullCVDocument(cvId.value);
    if (document.value) {
      editContent.value = document.value.content || '';
      originalContent.value = document.value.content || '';
      const shouldShow = document.value.showProfilePhoto ?? true;
      showProfilePhotoSetting.value = shouldShow;
      originalShowProfilePhoto.value = shouldShow;
      await loadProfilePhoto(document.value.userId);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load CV';
    console.error('[cvDisplay] Error loading CV:', err);
  } finally {
    loading.value = false;
  }
};

const toggleEdit = () => {
  isEditing.value = true;
  editContent.value = document.value?.content || '';
  originalContent.value = document.value?.content || '';
  const shouldShow = document.value?.showProfilePhoto ?? true;
  showProfilePhotoSetting.value = shouldShow;
  originalShowProfilePhoto.value = shouldShow;
};

const handleCancel = () => {
  if (hasChanges.value) {
    showCancelConfirm.value = true;
    return;
  }
  isEditing.value = false;
  editContent.value = originalContent.value;
  showProfilePhotoSetting.value = originalShowProfilePhoto.value;
};

const handleConfirmCancel = () => {
  showCancelConfirm.value = false;
  isEditing.value = false;
  editContent.value = originalContent.value;
  showProfilePhotoSetting.value = originalShowProfilePhoto.value;
};

const saveEdit = async () => {
  if (!document.value) return;

  saving.value = true;
  try {
    const updated = await service.updateCVDocument({
      id: document.value.id,
      content: editContent.value,
      showProfilePhoto: showProfilePhotoSetting.value,
    });

    if (updated) {
      document.value = updated;
      originalContent.value = editContent.value;
      originalShowProfilePhoto.value = showProfilePhotoSetting.value;
      isEditing.value = false;
      toast.add({
        title: t('cvDisplay.toast.saved'),
        color: 'primary',
      });
    }
  } catch (err) {
    console.error('[cvDisplay] Error saving CV:', err);
    toast.add({
      title: t('cvDisplay.toast.saveFailed'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const handlePrint = () => {
  // Open print view in new window
  const printUrl = `/cv/${cvId.value}/print`;
  window.open(printUrl, '_blank');
};

onMounted(() => {
  load();
});
</script>

<style scoped>
:deep(.prose) {
  /* Heading 1 - Main title */
  h1 {
    font-size: 2.25rem; /* 36px */
    line-height: 2.5rem; /* 40px */
    font-weight: 700;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgb(var(--color-primary-500));
  }

  /* Heading 2 - Section titles */
  h2 {
    font-size: 1.5rem; /* 24px */
    line-height: 2rem; /* 32px */
    font-weight: 600;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid;
  }

  /* Heading 3 - Subsection titles */
  h3 {
    font-size: 1.25rem; /* 20px */
    line-height: 1.75rem; /* 28px */
    font-weight: 500;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  /* Additional spacing and styling for better readability */
  p {
    margin-bottom: 0.75rem;
  }

  ul,
  ol {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }

  ul > li + li,
  ol > li + li {
    margin-top: 0.25rem;
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
    opacity: 0.8;
  }

  code {
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    opacity: 0.9;
  }

  a {
    color: rgb(var(--color-primary-500));
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
}

.cv-photo-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 7.5rem;
  height: 7.5rem;
  border-radius: 9999px;
  overflow: hidden;
  border: 3px solid rgba(59, 130, 246, 0.4);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  background: white;
}

.cv-photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
