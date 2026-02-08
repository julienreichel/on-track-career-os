<template>
  <div>
    <UPage>
      <UPageHeader
        :title="document?.name || `${$t('common.untitled')} ${$t('common.labels.cv')}`"
        :description="$t('applications.cvs.display.description')"
        :links="[
          {
            label: $t('common.backToList'),
            to: '/applications/cv',
            icon: 'i-heroicons-arrow-left',
          },
        ]"
      />

      <UPageBody>
        <TailoredJobBanner
          v-if="hasJobContext"
          class="mb-6"
          :job-title="targetJobTitle"
          :target-job-label="t('tailoredMaterials.targetJobLabel')"
          :view-job-label="t('tailoredMaterials.viewJob')"
          :view-match-label="t('tailoredMaterials.viewMatch')"
          :job-link="jobLink"
          :match-link="matchLink"
          :regenerate-label="t('tailoredMaterials.regenerateCv')"
          :regenerate-loading="isRegenerating"
          :regenerate-disabled="regenerateDisabled"
          :context-error-title="t('tailoredMaterials.contextErrorTitle')"
          :regenerate-error-title="t('tailoredMaterials.regenerateCvErrorTitle')"
          :missing-summary-title="t('tailoredMaterials.missingSummaryTitle')"
          :missing-summary-description="t('tailoredMaterials.missingSummaryCv')"
          :context-error="contextErrorMessage"
          :regenerate-error="regenerateError"
          :missing-summary="missingSummary"
          @regenerate="handleRegenerateTailored"
        />

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
              {{ $t('applications.cvs.display.loading') }}
            </p>
          </div>
        </div>

        <!-- Saving State -->
        <div v-else-if="saving" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('applications.cvs.display.saving') }}
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
                  {{ $t('applications.cvs.display.editMode') }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ $t('applications.cvs.display.markdownHelp') }}
                </p>
              </div>

              <UFormField :label="$t('applications.cvs.display.contentLabel')" required>
                <UTextarea
                  v-model="editContent"
                  :rows="25"
                  :placeholder="$t('applications.cvs.display.markdownPlaceholder')"
                  class="font-mono text-sm w-full"
                />
              </UFormField>

              <div class="border-t border-gray-200 pt-4 dark:border-gray-800">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ $t('applications.cvs.display.photoToggleLabel') }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ $t('applications.cvs.display.photoToggleDescription') }}
                    </p>
                  </div>
                  <USwitch
                    v-model="showProfilePhotoSetting"
                    :label="
                      showProfilePhotoSetting
                        ? $t('applications.cvs.display.photoToggleOn')
                        : $t('applications.cvs.display.photoToggleOff')
                    "
                  />
                </div>
                <div class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span v-if="profilePhotoLoading">{{
                    $t('applications.cvs.display.photoLoading')
                  }}</span>
                  <span v-else-if="profilePhotoError">{{ profilePhotoError }}</span>
                  <span v-else-if="!profilePhotoUrl">{{
                    $t('applications.cvs.display.photoUnavailable')
                  }}</span>
                </div>
                <div
                  v-if="profilePhotoUrl"
                  class="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <img
                    :src="profilePhotoUrl"
                    :alt="$t('applications.cvs.display.photoAlt')"
                    class="h-16 w-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ $t('applications.cvs.display.photoPreviewHelp') }}
                  </p>
                </div>
              </div>
            </div>
            <template #footer>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p v-if="formattedUpdatedAt" class="text-xs text-gray-400">
                  {{ $t('common.lastUpdated', { date: formattedUpdatedAt }) }}
                </p>
                <div class="flex justify-end gap-3">
                  <UButton
                    :label="$t('common.actions.cancel')"
                    variant="ghost"
                    @click="handleCancel"
                  />
                  <UButton
                    :label="$t('common.actions.save')"
                    icon="i-heroicons-check"
                    :disabled="!hasChanges || saving"
                    :loading="saving"
                    @click="saveEdit"
                  />
                </div>
              </div>
            </template>
          </UCard>

          <!-- View Mode: Rendered HTML -->
          <UCard v-else>
            <div class="relative">
              <div v-if="previewShowsPhoto" class="cv-photo-badge">
                <img
                  :src="profilePhotoUrl!"
                  :alt="$t('applications.cvs.display.photoAlt')"
                  class="cv-photo-image"
                />
              </div>
              <MarkdownContent :content="document.content" class="doc-markdown" />
            </div>
            <template #footer>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p v-if="formattedUpdatedAt" class="text-xs text-gray-400">
                  {{ $t('common.lastUpdated', { date: formattedUpdatedAt }) }}
                </p>
                <div class="flex justify-end gap-3">
                  <UButton
                    :label="$t('applications.cvs.display.actions.exportPdf')"
                    icon="i-heroicons-arrow-down-tray"
                    variant="outline"
                    @click="handlePrint"
                  />
                  <UButton
                    :label="$t('applications.cvs.display.actions.edit')"
                    icon="i-heroicons-pencil"
                    variant="outline"
                    @click="toggleEdit"
                  />
                </div>
              </div>
            </template>
          </UCard>
        </div>

        <!-- Not Found -->
        <UAlert
          v-else-if="!loading"
          color="warning"
          icon="i-heroicons-exclamation-triangle"
          :title="$t('applications.cvs.display.notFound')"
          :description="$t('applications.cvs.display.notFoundDescription')"
        />
      </UPageBody>
    </UPage>

    <!-- Unsaved Changes Modal -->
    <UnsavedChangesModal v-model:open="showCancelConfirm" @discard="handleConfirmCancel" />
  </div>
</template>

<script setup lang="ts">
import { logError } from '@/utils/logError';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import MarkdownContent from '@/components/MarkdownContent.vue';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import { useAuthUser } from '@/composables/useAuthUser';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import TailoredJobBanner from '@/components/tailoring/TailoredJobBanner.vue';
import { formatDetailDate } from '@/utils/formatDetailDate';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';

const { t } = useI18n();
const route = useRoute();
const toast = useToast();

const cvId = computed(() => route.params.id as string);

const service = new CVDocumentService();
const userProfileService = new UserProfileService();
const profilePhotoService = new ProfilePhotoService();
const auth = useAuthUser();
const tailoredMaterials = useTailoredMaterials({ auth });
const document = ref<CVDocument | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const targetJob = ref<JobDescription | null>(null);
const matchingSummary = ref<MatchingSummary | null>(null);

const isEditing = ref(false);
const editContent = ref('');
const originalContent = ref('');
const showProfilePhotoSetting = ref(true);
const originalShowProfilePhoto = ref(true);
const showCancelConfirm = ref(false);
const profilePhotoUrl = ref<string | null>(null);
const profilePhotoLoading = ref(false);
const profilePhotoError = ref<string | null>(null);

const hasJobContext = computed(() => Boolean(document.value?.jobId));
const targetJobTitle = computed(
  () => targetJob.value?.title?.trim() || t('tailoredMaterials.unknownJobTitle')
);
const jobLink = computed(() => (targetJob.value?.id ? `/jobs/${targetJob.value.id}` : null));
const matchLink = computed(() =>
  targetJob.value?.id ? `/jobs/${targetJob.value.id}/match` : null
);
const isRegenerating = computed(() => tailoredMaterials.isGenerating.value);
const contextLoading = computed(() => tailoredMaterials.contextLoading.value);
const contextErrorCode = computed(() => tailoredMaterials.contextError.value);
const contextErrorMessage = computed(() =>
  contextErrorCode.value ? t(`tailoredMaterials.errors.${contextErrorCode.value}`) : null
);
const canRegenerate = computed(() =>
  Boolean(document.value?.id && targetJob.value && matchingSummary.value)
);
const regenerateDisabled = computed(
  () => !canRegenerate.value || contextLoading.value || isRegenerating.value
);
const regenerateError = computed(() => tailoredMaterials.error.value);
const missingSummary = computed(() =>
  Boolean(document.value?.jobId && targetJob.value && !matchingSummary.value)
);

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

const formattedUpdatedAt = computed(() => formatDetailDate(document.value?.updatedAt));

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
    logError('[cvDisplay] Error loading profile photo:', err);
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
      await loadTailoringContext(document.value.jobId);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load CV';
    logError('[cvDisplay] Error loading CV:', err);
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
        title: t('applications.cvs.display.toast.saved'),
        color: 'primary',
      });
    }
  } catch (err) {
    logError('[cvDisplay] Error saving CV:', err);
    toast.add({
      title: t('applications.cvs.display.toast.saveFailed'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const handlePrint = () => {
  // Open print view in new window
  const printUrl = `/applications/cv/${cvId.value}/print`;
  window.open(printUrl, '_blank');
};

const loadTailoringContext = async (jobId?: string | null) => {
  const result = await tailoredMaterials.loadTailoringContext(jobId);
  if (result.ok) {
    targetJob.value = result.job;
    matchingSummary.value = result.matchingSummary;
    return;
  }

  targetJob.value = null;
  matchingSummary.value = null;
};

const handleRegenerateTailored = async () => {
  if (!document.value?.id || !targetJob.value || !matchingSummary.value) {
    return;
  }

  try {
    const updated = await tailoredMaterials.regenerateTailoredCvForJob({
      id: document.value.id,
      job: targetJob.value,
      matchingSummary: matchingSummary.value,
      options: {
        name: document.value.name ?? '',
        templateId: document.value.templateId ?? undefined,
        showProfilePhoto: document.value.showProfilePhoto ?? true,
      },
    });

    if (updated) {
      // Reload the full document to ensure all relationships are populated
      const reloadedDocument = await service.getFullCVDocument(updated.id);
      if (reloadedDocument) {
        document.value = reloadedDocument;
        editContent.value = reloadedDocument.content || '';
        originalContent.value = reloadedDocument.content || '';
        const shouldShow = reloadedDocument.showProfilePhoto ?? true;
        showProfilePhotoSetting.value = shouldShow;
        originalShowProfilePhoto.value = shouldShow;
        toast.add({ title: t('tailoredMaterials.toast.cvRegenerated'), color: 'primary' });
      }
    }
  } catch (err) {
    logError('[cvDisplay] Failed to regenerate tailored CV', err);
    toast.add({ title: t('tailoredMaterials.toast.cvRegenerateFailed'), color: 'error' });
  }
};

watch(
  () => document.value?.jobId,
  (jobId) => {
    void loadTailoringContext(jobId);
  }
);

onMounted(() => {
  void load();
});
</script>
