<script setup lang="ts">
import { logError } from '@/utils/logError';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UnsavedChangesModal from '@/components/UnsavedChangesModal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useCoverLetter } from '@/application/cover-letter/useCoverLetter';
import { useAuthUser } from '@/composables/useAuthUser';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import TailoredJobBanner from '@/components/tailoring/TailoredJobBanner.vue';
import MarkdownContent from '@/components/MarkdownContent.vue';
import MaterialFeedbackPanel from '@/components/materials/MaterialFeedbackPanel.vue';
import ErrorStateCard from '@/components/common/ErrorStateCard.vue';
import { useErrorDisplay } from '@/composables/useErrorDisplay';
import { useMaterialImprovementEngine } from '@/composables/useMaterialImprovementEngine';
import { buildSpeechInput } from '@/composables/useSpeechEngine';
import { formatDetailDate } from '@/utils/formatDetailDate';
import type { PageHeaderLink } from '@/types/ui';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import { CompanyService } from '@/domain/company/CompanyService';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { Company } from '@/domain/company/Company';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type {
  JobDescription as JobDescriptionContext,
  MatchingSummaryContext,
  CompanyProfile,
} from '@amplify/data/ai-operations/types/schema-types';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const coverLetterId = computed(() => route.params.id as string);
const { item, loading, error, load, save, remove } = useCoverLetter(coverLetterId.value);
const auth = useAuthUser();
const tailoredMaterials = useTailoredMaterials({ auth });
const jobService = new JobDescriptionService();
const companyService = new CompanyService();
const userProfileService = new UserProfileService();
const materialImprovementErrorDisplay = useErrorDisplay();
const targetJob = ref<JobDescription | null>(null);
const matchingSummary = ref<MatchingSummary | null>(null);
const hasLoadedContext = ref(false);
const companyContext = ref<Company | null>(null);
const groundingProfile = ref<UserProfile | null>(null);
const groundingExperiences = ref<Experience[]>([]);
const groundingStories = ref<STARStory[]>([]);

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
const isInitializing = ref(true);

const hasChanges = computed(
  () => editTitle.value !== originalTitle.value || editContent.value !== originalContent.value
);
const hasJobContext = computed(() => Boolean(item.value?.jobId));
const targetJobTitle = computed(() => {
  const title = targetJob.value?.title?.trim();
  if (title) return title;
  return t('tailoredMaterials.unknownJobTitle');
});
const jobId = computed(() => targetJob.value?.id ?? item.value?.jobId ?? null);
const jobLink = computed(() => (jobId.value ? `/jobs/${jobId.value}` : null));
const matchLink = computed(() => (jobId.value ? `/jobs/${jobId.value}/match` : null));
const isRegenerating = computed(() => tailoredMaterials.isGenerating.value);
const contextLoading = computed(() => tailoredMaterials.contextLoading.value);
const contextErrorCode = computed(() => tailoredMaterials.contextError.value);
const contextErrorMessage = computed(() =>
  contextErrorCode.value ? t(`tailoredMaterials.errors.${contextErrorCode.value}`) : null
);
const canRegenerate = computed(() => Boolean(item.value?.id && item.value?.jobId));
const regenerateDisabled = computed(
  () => !canRegenerate.value || contextLoading.value || isRegenerating.value
);
const regenerateError = computed(() => tailoredMaterials.error.value);
const missingSummary = computed(
  () => hasLoadedContext.value && Boolean(item.value?.jobId && !matchingSummary.value)
);
const showMaterialImprovementError = computed(
  () =>
    Boolean(materialImprovementErrorDisplay.pageErrorMessageKey.value) ||
    Boolean(materialImprovementErrorDisplay.pageError.value)
);
const materialImprovementErrorMessage = computed(() => {
  if (materialImprovementErrorDisplay.pageErrorMessageKey.value) {
    return t(materialImprovementErrorDisplay.pageErrorMessageKey.value);
  }
  return (
    materialImprovementErrorDisplay.pageError.value ?? t('materialImprovement.errors.improveFailed')
  );
});

const headerLinks: PageHeaderLink[] = [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/applications/cover-letters',
  },
];
const displayTitle = computed(() => {
  const name = isEditing.value ? editTitle.value : (item.value?.name ?? '');
  return name.trim() || t('applications.coverLetters.display.untitled');
});
const formattedUpdatedAt = computed(() => formatDetailDate(item.value?.updatedAt));

const normalizeString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => normalizeString(entry))
    .filter((entry) => entry.length > 0);
};

const normalizeJobContext = (job: JobDescription): JobDescriptionContext => {
  return {
    title: normalizeString(job.title),
    seniorityLevel: normalizeString(job.seniorityLevel),
    roleSummary: normalizeString(job.roleSummary),
    responsibilities: normalizeStringArray(job.responsibilities),
    requiredSkills: normalizeStringArray(job.requiredSkills),
    behaviours: normalizeStringArray(job.behaviours),
    successCriteria: normalizeStringArray(job.successCriteria),
    explicitPains: normalizeStringArray(job.explicitPains),
    atsKeywords: normalizeStringArray(job.atsKeywords),
  };
};

const normalizeMatchingSummaryContext = (
  summary: MatchingSummary | null
): MatchingSummaryContext | undefined => {
  if (!summary) {
    return undefined;
  }

  const recommendation = summary.recommendation;
  const scoreBreakdownCandidate =
    summary.scoreBreakdown &&
    typeof summary.scoreBreakdown === 'object' &&
    !Array.isArray(summary.scoreBreakdown)
      ? (summary.scoreBreakdown as Partial<Record<'skillFit' | 'experienceFit' | 'interestFit' | 'edge', unknown>>)
      : {};

  return {
    overallScore: typeof summary.overallScore === 'number' ? summary.overallScore : 0,
    scoreBreakdown: {
      skillFit: typeof scoreBreakdownCandidate.skillFit === 'number' ? scoreBreakdownCandidate.skillFit : 0,
      experienceFit:
        typeof scoreBreakdownCandidate.experienceFit === 'number'
          ? scoreBreakdownCandidate.experienceFit
          : 0,
      interestFit:
        typeof scoreBreakdownCandidate.interestFit === 'number' ? scoreBreakdownCandidate.interestFit : 0,
      edge: typeof scoreBreakdownCandidate.edge === 'number' ? scoreBreakdownCandidate.edge : 0,
    },
    recommendation:
      recommendation === 'apply' || recommendation === 'maybe' || recommendation === 'skip'
        ? recommendation
        : 'maybe',
    reasoningHighlights: normalizeStringArray(summary.reasoningHighlights),
    strengthsForThisRole: normalizeStringArray(summary.strengthsForThisRole),
    skillMatch: normalizeStringArray(summary.skillMatch),
    riskyPoints: normalizeStringArray(summary.riskyPoints),
    impactOpportunities: normalizeStringArray(summary.impactOpportunities),
    tailoringTips: normalizeStringArray(summary.tailoringTips),
  };
};

const normalizeCompanyContext = (company: Company | null): CompanyProfile | undefined => {
  if (!company) {
    return undefined;
  }

  return {
    companyName: normalizeString(company.companyName),
    industry: normalizeString(company.industry),
    sizeRange: normalizeString(company.sizeRange),
    website: normalizeString(company.website),
    description: normalizeString(company.description),
    productsServices: normalizeStringArray(company.productsServices),
    targetMarkets: normalizeStringArray(company.targetMarkets),
    customerSegments: normalizeStringArray(company.customerSegments),
    rawNotes: normalizeString(company.rawNotes),
  };
};

const extractGroundingContext = (profile: UserProfile) => {
  const profileWithRelations = profile as UserProfile & {
    experiences?: (Experience & { stories?: (STARStory | null)[] | null } | null)[] | null;
  };

  const experiences = (profileWithRelations.experiences ?? []).filter(
    (entry): entry is Experience & { stories?: (STARStory | null)[] | null } => Boolean(entry)
  );
  const stories = experiences
    .flatMap((experience) => experience.stories ?? [])
    .filter((entry): entry is STARStory => Boolean(entry));

  groundingExperiences.value = experiences;
  groundingStories.value = stories;
};

const loadMaterialImprovementGrounding = async () => {
  const userId = item.value?.userId;
  if (!userId) {
    groundingProfile.value = null;
    groundingExperiences.value = [];
    groundingStories.value = [];
    companyContext.value = null;
    return;
  }

  const profile = await userProfileService.getProfileForTailoring(userId);
  groundingProfile.value = profile;
  if (profile) {
    extractGroundingContext(profile);
  } else {
    groundingExperiences.value = [];
    groundingStories.value = [];
  }

  const companyId = targetJob.value?.companyId;
  companyContext.value = companyId ? await companyService.getCompany(companyId) : null;
};

const getCurrentMarkdown = () => (isEditing.value ? editContent.value : (item.value?.content ?? ''));

const persistImprovedMarkdown = async (markdown: string) => {
  if (!item.value?.id) {
    throw new Error('Cover letter is missing');
  }

  const updated = await save({
    id: item.value.id,
    name: item.value.name ?? '',
    content: markdown,
  });

  if (!updated) {
    throw new Error('Failed to persist improved cover letter markdown');
  }

  item.value = updated;
  editContent.value = markdown;
  originalContent.value = markdown;
  isEditing.value = false;
  toast.add({
    title: t('applications.coverLetters.display.toast.saved'),
    color: 'primary',
  });
};

const materialImprovementEngine = useMaterialImprovementEngine({
  materialType: 'coverLetter',
  currentDocumentId: coverLetterId,
  jobId: computed(() => targetJob.value?.id ?? null),
  companyId: computed(() => targetJob.value?.companyId ?? null),
  getCurrentMarkdown,
  setCurrentMarkdown: persistImprovedMarkdown,
  getFeedbackInput: () => {
    if (!targetJob.value) {
      throw new Error('Job context is required for cover letter feedback');
    }

    return {
      job: normalizeJobContext(targetJob.value),
      cvText: '',
      coverLetterText: getCurrentMarkdown(),
      language: 'en',
    };
  },
  getGroundingContext: () => {
    if (!groundingProfile.value) {
      throw new Error('User profile is required for cover letter improvement');
    }

    const speechInput = buildSpeechInput({
      profile: groundingProfile.value,
      experiences: groundingExperiences.value,
      stories: groundingStories.value,
      tailoring: {
        jobDescription: targetJob.value ? normalizeJobContext(targetJob.value) : undefined,
        matchingSummary: normalizeMatchingSummaryContext(matchingSummary.value),
        company: normalizeCompanyContext(companyContext.value),
      },
    });

    return {
      language: 'en' as const,
      profile: speechInput.profile,
      experiences: speechInput.experiences,
      ...(speechInput.stories ? { stories: speechInput.stories } : {}),
      ...(speechInput.jobDescription ? { jobDescription: speechInput.jobDescription } : {}),
      ...(speechInput.matchingSummary ? { matchingSummary: speechInput.matchingSummary } : {}),
      ...(speechInput.company ? { company: speechInput.company } : {}),
    };
  },
  dependencies: {
    errorDisplay: materialImprovementErrorDisplay,
  },
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
      toast.add({ title: t('applications.coverLetters.display.toast.saved'), color: 'primary' });
      originalTitle.value = editTitle.value;
      originalContent.value = editContent.value;
      isEditing.value = false;
    } else {
      toast.add({ title: t('applications.coverLetters.display.toast.saveFailed'), color: 'error' });
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
  const printUrl = `/applications/cover-letters/${coverLetterId.value}/print`;
  window.open(printUrl, '_blank');
};

const handleDelete = async () => {
  if (!item.value?.id || deleting.value) return;
  deleting.value = true;
  try {
    const success = await remove();
    if (success) {
      toast.add({ title: t('applications.coverLetters.display.toast.deleted'), color: 'primary' });
      await router.push('/applications/cover-letters');
    } else {
      toast.add({
        title: t('applications.coverLetters.display.toast.deleteFailed'),
        color: 'error',
      });
    }
  } catch (err) {
    logError('[coverLetterDisplay] Delete failed', err);
    toast.add({ title: t('applications.coverLetters.display.toast.deleteFailed'), color: 'error' });
  } finally {
    deleting.value = false;
    deleteModalOpen.value = false;
  }
};

const loadJobSummary = async (jobId?: string | null) => {
  if (!jobId) {
    targetJob.value = null;
    return;
  }

  if (targetJob.value?.id === jobId) {
    return;
  }

  try {
    const job = await jobService.getJobSummary(jobId);
    targetJob.value = job;
  } catch (err) {
    logError('[coverLetterDisplay] Failed to load job summary', err);
  }
};

const loadTailoringContext = async (jobId?: string | null) => {
  const result = await tailoredMaterials.loadTailoringContext(jobId);
  hasLoadedContext.value = true;
  if (result.ok) {
    targetJob.value = result.job;
    matchingSummary.value = result.matchingSummary;
    const companyId = result.job.companyId;
    companyContext.value = companyId ? await companyService.getCompany(companyId) : null;
    return;
  }

  targetJob.value = null;
  matchingSummary.value = null;
  companyContext.value = null;
};

const handleRegenerateTailored = async () => {
  if (!item.value?.id || !item.value?.jobId) {
    return;
  }

  if (!targetJob.value || !matchingSummary.value) {
    await loadTailoringContext(item.value.jobId);
  }

  if (!targetJob.value || !matchingSummary.value) {
    toast.add({
      title: t('tailoredMaterials.toast.coverLetterRegenerateFailed'),
      color: 'error',
    });
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
      materialImprovementEngine.actions.reset();
      toast.add({ title: t('tailoredMaterials.toast.coverLetterRegenerated'), color: 'primary' });
    }
  } catch (err) {
    logError('[coverLetterDisplay] Failed to regenerate tailored cover letter', err);
    toast.add({ title: t('tailoredMaterials.toast.coverLetterRegenerateFailed'), color: 'error' });
  }
};

onMounted(async () => {
  isInitializing.value = true;
  try {
    await load();
    await loadTailoringContext(item.value?.jobId);
    await loadMaterialImprovementGrounding();
  } finally {
    isInitializing.value = false;
  }
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
    route.meta.breadcrumbLabel = newValue.name || t('applications.coverLetters.display.untitled');
    void loadJobSummary(newValue.jobId);
  }
});

watch(
  () => item.value?.jobId,
  (jobId) => {
    void loadTailoringContext(jobId);
  }
);

watch(
  () => [item.value?.userId, targetJob.value?.companyId],
  () => {
    void loadMaterialImprovementGrounding();
  }
);

const retryMaterialFeedback = async () => {
  materialImprovementErrorDisplay.clearPageError();
  try {
    await materialImprovementEngine.actions.runFeedback();
  } catch (err) {
    logError('[coverLetterDisplay] Failed to retry material feedback', err);
  }
};
</script>

<template>
  <div>
    <UPage>
      <UPageHeader
        :title="displayTitle"
        :description="t('applications.coverLetters.display.description')"
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
          v-if="error && !isInitializing"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('applications.coverLetters.display.states.errorTitle')"
          :description="error"
          class="mb-6"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          @close="error = null"
        />

        <UCard v-if="loading || isInitializing">
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="mt-4 h-96 w-full" />
        </UCard>

        <!-- Edit Mode -->
        <template v-else-if="item && isEditing">
          <UCard>
            <div class="space-y-4">
              <div>
                <h3 class="text-lg font-semibold mb-2">
                  {{ t('applications.coverLetters.display.editMode') }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t('applications.coverLetters.display.editModeDescription') }}
                </p>
              </div>

              <UFormField :label="t('applications.coverLetters.display.titleLabel')">
                <UInput
                  v-model="editTitle"
                  :placeholder="t('applications.coverLetters.display.titlePlaceholder')"
                  data-testid="cover-letter-title-input"
                  class="w-full"
                />
              </UFormField>

              <UFormField :label="t('applications.coverLetters.display.contentLabel')" required>
                <UTextarea
                  v-model="editContent"
                  :rows="25"
                  :placeholder="t('applications.coverLetters.display.contentPlaceholder')"
                  class="w-full"
                  data-testid="cover-letter-content-textarea"
                />
              </UFormField>
            </div>
            <template #footer>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p v-if="formattedUpdatedAt" class="text-xs text-gray-400">
                  {{ t('common.lastUpdated', { date: formattedUpdatedAt }) }}
                </p>
                <div class="flex justify-end gap-3">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    :label="t('common.actions.cancel')"
                    :disabled="loading || saving"
                    @click="handleCancel"
                  />
                  <UButton
                    color="primary"
                    :label="t('common.actions.save')"
                    :disabled="!hasChanges || loading || saving"
                    :loading="saving"
                    data-testid="save-cover-letter-button"
                    @click="handleSave"
                  />
                </div>
              </div>
            </template>
          </UCard>
        </template>

        <!-- View Mode -->
        <template v-else-if="item">
          <UCard>
            <div>
              <MarkdownContent v-if="item.content" :content="item.content" class="doc-markdown" />
              <div v-else class="text-gray-500 dark:text-gray-400 italic">
                {{ t('applications.coverLetters.display.emptyContent') }}
              </div>
            </div>
            <template #footer>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p v-if="formattedUpdatedAt" class="text-xs text-gray-400">
                  {{ t('common.lastUpdated', { date: formattedUpdatedAt }) }}
                </p>
                <div class="flex justify-end gap-3">
                  <UButton
                    :label="t('applications.coverLetters.display.actions.print')"
                    icon="i-heroicons-arrow-down-tray"
                    variant="outline"
                    @click="handlePrint"
                  />
                  <UButton
                    :label="t('applications.coverLetters.display.actions.edit')"
                    icon="i-heroicons-pencil"
                    variant="outline"
                    data-testid="edit-cover-letter-button"
                    @click="toggleEdit"
                  />
                </div>
              </div>
            </template>
          </UCard>
        </template>

        <UCard v-else-if="!loading && !item">
          <UAlert
            icon="i-heroicons-exclamation-circle"
            color="warning"
            variant="soft"
            :title="t('applications.coverLetters.display.states.notFound')"
            :description="t('applications.coverLetters.display.states.notFoundDescription')"
          />
        </UCard>

        <ErrorStateCard
          v-if="showMaterialImprovementError"
          class="mt-6"
          :title="$t('common.error')"
          :description="materialImprovementErrorMessage"
          :retry-label="$t('common.retry')"
          @retry="retryMaterialFeedback"
        />

        <MaterialFeedbackPanel
          v-if="item && hasJobContext"
          class="mt-6"
          :engine="materialImprovementEngine"
          material-type="coverLetter"
        />
      </UPageBody>
    </UPage>

    <UnsavedChangesModal
      v-model:open="cancelModalOpen"
      @discard="handleDiscard"
      @cancel="cancelModalOpen = false"
    />

    <ConfirmModal
      v-model:open="deleteModalOpen"
      :title="t('applications.coverLetters.display.delete.title')"
      :description="t('applications.coverLetters.display.delete.description')"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="deleteModalOpen = false"
    />
  </div>
</template>
