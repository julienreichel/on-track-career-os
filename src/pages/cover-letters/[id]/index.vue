<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UnsavedChangesModal from '@/components/UnsavedChangesModal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useCoverLetter } from '@/application/cover-letter/useCoverLetter';
import { useCoverLetterEngine } from '@/composables/useCoverLetterEngine';
import { useAuthUser } from '@/composables/useAuthUser';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import TailoredJobBanner from '@/components/tailoring/TailoredJobBanner.vue';
import type { PageHeaderLink } from '@/types/ui';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const coverLetterId = computed(() => route.params.id as string);
const { item, loading, error, load, save, remove } = useCoverLetter(coverLetterId.value);
const engine = useCoverLetterEngine();
const auth = useAuthUser();
const tailoredMaterials = useTailoredMaterials({ auth });
const targetJob = ref<JobDescription | null>(null);
const matchingSummary = ref<MatchingSummary | null>(null);

// View/Edit state
const isEditing = ref(false);
const editTitle = ref('');
const originalTitle = ref('');
const editContent = ref('');
const originalContent = ref('');
const saving = ref(false);
const cancelModalOpen = ref(false);
const deleteModalOpen = ref(false);
const deleting = ref(false);

const hasChanges = computed(
  () => editTitle.value !== originalTitle.value || editContent.value !== originalContent.value
);
const hasJobContext = computed(() => Boolean(item.value?.jobId));
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
const canRegenerate = computed(
  () => Boolean(item.value?.id && targetJob.value && matchingSummary.value)
);
const regenerateDisabled = computed(
  () => !canRegenerate.value || contextLoading.value || isRegenerating.value
);
const regenerateError = computed(() => tailoredMaterials.error.value);
const missingSummary = computed(
  () => Boolean(item.value?.jobId && targetJob.value && !matchingSummary.value)
);

const headerLinks: PageHeaderLink[] = [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/cover-letters',
  },
];
const displayTitle = computed(() => {
  const name = isEditing.value ? editTitle.value : item.value?.name ?? '';
  return name.trim() || t('coverLetter.display.untitled');
});

const toggleEdit = () => {
  if (isEditing.value) {
    if (hasChanges.value) {
      cancelModalOpen.value = true;
    } else {
      isEditing.value = false;
    }
  } else {
    editTitle.value = item.value?.name || '';
    originalTitle.value = editTitle.value;
    editContent.value = item.value?.content || '';
    originalContent.value = editContent.value;
    isEditing.value = true;
  }
};

const handleSave = async () => {
  if (!item.value?.id || saving.value || !hasChanges.value) return;
  saving.value = true;
  try {
    const updated = await save({
      id: item.value.id,
      name: editTitle.value,
      content: editContent.value,
    });
    if (updated) {
      toast.add({ title: t('coverLetter.display.toast.saved'), color: 'primary' });
      originalTitle.value = editTitle.value;
      originalContent.value = editContent.value;
      isEditing.value = false;
    } else {
      toast.add({ title: t('coverLetter.display.toast.saveFailed'), color: 'error' });
    }
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  if (hasChanges.value) {
    cancelModalOpen.value = true;
  } else {
    isEditing.value = false;
  }
};

const handleDiscard = () => {
  editTitle.value = originalTitle.value;
  editContent.value = originalContent.value;
  isEditing.value = false;
  cancelModalOpen.value = false;
};

const handlePrint = () => {
  // Open print view in new window
  const printUrl = `/cover-letters/${coverLetterId.value}/print`;
  window.open(printUrl, '_blank');
};

const handleDelete = async () => {
  if (!item.value?.id || deleting.value) return;
  deleting.value = true;
  try {
    const success = await remove();
    if (success) {
      toast.add({ title: t('coverLetter.display.toast.deleted'), color: 'primary' });
      await router.push('/cover-letters');
    } else {
      toast.add({ title: t('coverLetter.display.toast.deleteFailed'), color: 'error' });
    }
  } catch (err) {
    console.error('[coverLetterDisplay] Delete failed', err);
    toast.add({ title: t('coverLetter.display.toast.deleteFailed'), color: 'error' });
  } finally {
    deleting.value = false;
    deleteModalOpen.value = false;
  }
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
  if (!item.value?.id || !targetJob.value || !matchingSummary.value) {
    return;
  }

  try {
    const updated = await tailoredMaterials.regenerateTailoredCoverLetterForJob({
      id: item.value.id,
      job: targetJob.value,
      matchingSummary: matchingSummary.value,
      options: {
        name: item.value.name ?? undefined,
        tone: item.value.tone ?? undefined,
      },
    });

    if (updated) {
      item.value = updated;
      editContent.value = updated.content || '';
      originalContent.value = editContent.value;
      isEditing.value = false;
      toast.add({ title: t('tailoredMaterials.toast.coverLetterRegenerated'), color: 'primary' });
    }
  } catch (err) {
    console.error('[coverLetterDisplay] Failed to regenerate tailored cover letter', err);
    toast.add({ title: t('tailoredMaterials.toast.coverLetterRegenerateFailed'), color: 'error' });
  }
};

onMounted(async () => {
  await engine.load();
  await load();
});

watch(item, (newValue) => {
  if (newValue && !isEditing.value) {
    const name = newValue.name;
    editTitle.value = name ? name : '';
    originalTitle.value = editTitle.value;
    const content = newValue.content;
    editContent.value = content ? content : '';
    originalContent.value = editContent.value;
    // Update breadcrumb with cover letter name
    route.meta.breadcrumbLabel = newValue.name || t('coverLetter.display.untitled');
    void loadTailoringContext(newValue.jobId);
  }
});
</script>

<template>
  <div>
    <UContainer>
      <UPage>
        <UPageHeader
          :title="displayTitle"
          :description="t('coverLetter.display.description')"
          :links="headerLinks"
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
            :regenerate-label="t('tailoredMaterials.regenerateCoverLetter')"
            :regenerate-loading="isRegenerating"
            :regenerate-disabled="regenerateDisabled"
            :context-error-title="t('tailoredMaterials.contextErrorTitle')"
            :regenerate-error-title="t('tailoredMaterials.regenerateCoverLetterErrorTitle')"
            :missing-summary-title="t('tailoredMaterials.missingSummaryTitle')"
            :missing-summary-description="t('tailoredMaterials.missingSummaryCoverLetter')"
            :context-error="contextErrorMessage"
            :regenerate-error="regenerateError"
            :missing-summary="missingSummary"
            @regenerate="handleRegenerateTailored"
          />

          <UAlert
            v-if="error"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            :title="t('coverLetter.display.states.errorTitle')"
            :description="error"
            class="mb-6"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
            @close="error = null"
          />

          <UAlert
            v-if="engine.error.value"
            icon="i-heroicons-exclamation-triangle"
            color="warning"
            variant="soft"
            :title="t('coverLetter.display.states.generateErrorTitle')"
            :description="engine.error.value"
            class="mb-6"
            :close-button="{
              icon: 'i-heroicons-x-mark-20-solid',
              color: 'warning',
              variant: 'link',
            }"
            @close="engine.error.value = null"
          />

          <UAlert
            v-if="!engine.hasProfile.value && !engine.isLoading.value"
            icon="i-heroicons-information-circle"
            color="info"
            variant="soft"
            :title="t('coverLetter.display.profileRequiredTitle')"
            :description="t('coverLetter.display.profileRequiredDescription')"
            class="mb-6"
          />

          <UCard v-if="loading">
            <USkeleton class="h-6 w-1/3" />
            <USkeleton class="mt-4 h-96 w-full" />
          </UCard>

          <!-- Edit Mode -->
          <template v-else-if="item && isEditing">
            <UCard>
              <div class="space-y-4">
                <div>
                  <h3 class="text-lg font-semibold mb-2">
                    {{ t('coverLetter.display.editMode') }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('coverLetter.display.editModeDescription') }}
                  </p>
                </div>

                <UFormField :label="t('coverLetter.display.titleLabel')">
                  <UInput
                    v-model="editTitle"
                    :placeholder="t('coverLetter.display.titlePlaceholder')"
                    data-testid="cover-letter-title-input"
                  />
                </UFormField>

                <UFormField :label="t('coverLetter.display.contentLabel')" required>
                  <UTextarea
                    v-model="editContent"
                    :rows="25"
                    :placeholder="t('coverLetter.display.contentPlaceholder')"
                    class="w-full"
                    data-testid="cover-letter-content-textarea"
                  />
                </UFormField>
              </div>
            </UCard>

            <!-- Edit Mode Actions -->
            <div class="mt-6 flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :label="t('common.cancel')"
                :disabled="loading || saving"
                @click="handleCancel"
              />
              <UButton
                color="primary"
                :label="t('common.save')"
                :disabled="!hasChanges || loading || saving"
                :loading="saving"
                data-testid="save-cover-letter-button"
                @click="handleSave"
              />
            </div>
          </template>

          <!-- View Mode -->
          <template v-else-if="item">
            <UCard>
              <div class="prose prose-gray max-w-none dark:prose-invert">
                <div v-if="item.content" class="whitespace-pre-wrap">{{ item.content }}</div>
                <div v-else class="text-gray-500 dark:text-gray-400 italic">
                  {{ t('coverLetter.display.emptyContent') }}
                </div>
              </div>
            </UCard>

            <!-- View Mode Actions -->
            <div class="mt-6 flex justify-end gap-3">
              <UButton
                :label="t('coverLetter.display.actions.print')"
                icon="i-heroicons-arrow-down-tray"
                variant="outline"
                @click="handlePrint"
              />
              <UButton
                :label="t('coverLetter.display.actions.edit')"
                icon="i-heroicons-pencil"
                variant="outline"
                data-testid="edit-cover-letter-button"
                @click="toggleEdit"
              />
            </div>
          </template>

          <UCard v-else-if="!loading && !item">
            <UAlert
              icon="i-heroicons-exclamation-circle"
              color="warning"
              variant="soft"
              :title="t('coverLetter.display.states.notFound')"
              :description="t('coverLetter.display.states.notFoundDescription')"
            />
          </UCard>
        </UPageBody>
      </UPage>
    </UContainer>

    <UnsavedChangesModal
      v-model:open="cancelModalOpen"
      @discard="handleDiscard"
      @cancel="cancelModalOpen = false"
    />

    <ConfirmModal
      v-model:open="deleteModalOpen"
      :title="t('coverLetter.display.delete.title')"
      :description="t('coverLetter.display.delete.description')"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="deleteModalOpen = false"
    />
  </div>
</template>
