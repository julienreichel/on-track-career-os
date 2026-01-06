<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import TagInput from '@/components/TagInput.vue';
import LinkedCompanyBadge from '@/components/company/LinkedCompanyBadge.vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useCompanies } from '@/composables/useCompanies';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';
import type {
  JobDescription,
  JobDescriptionUpdateInput,
} from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import type { PageHeaderLink } from '@/types/ui';

type ScalarField = 'title' | 'seniorityLevel' | 'roleSummary';
type ListField =
  | 'responsibilities'
  | 'requiredSkills'
  | 'behaviours'
  | 'successCriteria'
  | 'explicitPains';

const scalarFields: ScalarField[] = ['title', 'seniorityLevel', 'roleSummary'];
const listFields: ListField[] = [
  'responsibilities',
  'requiredSkills',
  'behaviours',
  'successCriteria',
  'explicitPains',
];

type JobFormState = {
  [K in ScalarField]: string;
} & {
  [K in ListField]: string[];
};

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const jobAnalysis = useJobAnalysis();
const companyStore = useCompanies();
const auth = useAuthUser();
const tailoredMaterials = useTailoredMaterials({ auth });
const matchingSummaryService = new MatchingSummaryService();

const jobId = computed(() => route.params.jobId as string | undefined);
const job = jobAnalysis.selectedJob;

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const matchingSummary = ref<MatchingSummary | null>(null);
const matchingSummaryLoading = ref(false);
const matchingSummaryError = ref<string | null>(null);
const activeMaterial = ref<'cv' | 'cover-letter' | 'speech' | null>(null);
const existingCv = ref<CVDocument | null>(null);
const existingCoverLetter = ref<CoverLetter | null>(null);
const existingSpeech = ref<SpeechBlock | null>(null);
const showReanalyseModal = ref(false);
const reanalysing = ref(false);
const saving = ref(false);
const selectedCompanyId = ref<string | null>(null);
const linkingCompany = ref(false);

const form = reactive<JobFormState>({
  title: '',
  seniorityLevel: '',
  roleSummary: '',
  responsibilities: [],
  requiredSkills: [],
  behaviours: [],
  successCriteria: [],
  explicitPains: [],
});

const listSections = computed(
  () =>
    [
      {
        key: 'responsibilities',
        label: t('jobDetail.tabs.responsibilities'),
        placeholder: t('jobDetail.placeholders.responsibilities'),
        hint: t('jobDetail.hints.responsibilities'),
      },
      {
        key: 'requiredSkills',
        label: t('jobDetail.tabs.requiredSkills'),
        placeholder: t('jobDetail.placeholders.requiredSkills'),
        hint: t('jobDetail.hints.requiredSkills'),
      },
      {
        key: 'behaviours',
        label: t('jobDetail.tabs.behaviours'),
        placeholder: t('jobDetail.placeholders.behaviours'),
        hint: t('jobDetail.hints.behaviours'),
      },
      {
        key: 'successCriteria',
        label: t('jobDetail.tabs.successCriteria'),
        placeholder: t('jobDetail.placeholders.successCriteria'),
        hint: t('jobDetail.hints.successCriteria'),
      },
      {
        key: 'explicitPains',
        label: t('jobDetail.tabs.explicitPains'),
        placeholder: t('jobDetail.placeholders.explicitPains'),
        hint: t('jobDetail.hints.explicitPains'),
      },
    ] satisfies Array<{
      key: ListField;
      label: string;
      placeholder: string;
      hint: string;
    }>
);

const tabItems = computed(() =>
  listSections.value.map((section) => ({
    label: section.label,
    slot: section.key,
  }))
);

const canViewMatch = computed(() => job.value?.status === 'analyzed');
const matchLink = computed(() => (jobId.value ? `/jobs/${jobId.value}/match` : undefined));

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/jobs',
  },
  {
    label: t('jobDetail.actions.reanalyse'),
    icon: 'i-heroicons-arrow-path',
    onClick: () => (showReanalyseModal.value = true),
    disabled: loading.value || reanalysing.value,
  },
  {
    label: t('jobDetail.match.view'),
    icon: 'i-heroicons-sparkles',
    to: matchLink.value,
    disabled: !canViewMatch.value,
    ariaLabel: !canViewMatch.value ? t('jobDetail.match.disabledTooltip') : undefined,
  },
]);

const statusLabel = computed(() => {
  const status = job.value?.status ?? 'draft';
  return t(`jobList.status.${status}`);
});

const hasMatchingSummary = computed(() => Boolean(matchingSummary.value));
const isGeneratingMaterials = computed(() => tailoredMaterials.isGenerating.value);
const materialsError = computed(() => tailoredMaterials.error.value);
const materialsLoading = computed(() => tailoredMaterials.materialsLoading.value);
const materialsErrorCode = computed(() => tailoredMaterials.materialsError.value);
const materialsErrorMessage = computed(() =>
  materialsErrorCode.value ? t(`tailoredMaterials.errors.${materialsErrorCode.value}`) : null
);
const canGenerateMaterials = computed(() => Boolean(job.value && matchingSummary.value));
const materialsDisabled = computed(
  () => !canGenerateMaterials.value || isGeneratingMaterials.value || matchingSummaryLoading.value
);
const cvLink = computed(() => (existingCv.value?.id ? `/cv/${existingCv.value.id}` : null));
const coverLetterLink = computed(() =>
  existingCoverLetter.value?.id ? `/cover-letters/${existingCoverLetter.value.id}` : null
);
const speechLink = computed(() =>
  existingSpeech.value?.id ? `/speech/${existingSpeech.value.id}` : null
);
const hasExistingMaterials = computed(() =>
  Boolean(cvLink.value || coverLetterLink.value || speechLink.value)
);

const formattedCreatedAt = computed(() => formatDate(job.value?.createdAt));
const formattedUpdatedAt = computed(() => formatDate(job.value?.updatedAt));

watch(
  job,
  (value) => {
    if (value) {
      hydrateForm(value);
      updateBreadcrumb(value.title);
    }
  },
  { immediate: true }
);

watch(jobId, () => {
  loadJob();
});

watch(
  [jobId, () => job.value?.companyId, () => auth.userId.value],
  () => {
    void loadMatchingSummary();
  },
  { immediate: true }
);

watch(
  jobId,
  () => {
    void loadExistingMaterials();
  },
  { immediate: true }
);

onMounted(async () => {
  if (!job.value) {
    await loadJob();
  }
  await loadCompanies();
});

const isDirty = computed(() => {
  if (!job.value) {
    return false;
  }

  const hasScalarChanges = scalarFields.some((field) => {
    const original = job.value?.[field] ?? '';
    return original !== form[field];
  });

  if (hasScalarChanges) {
    return true;
  }

  return listFields.some((field) => {
    const original = toStringList(job.value?.[field]);
    return !arraysEqual(original, form[field]);
  });
});

const disableActions = computed(() => saving.value || reanalysing.value);
const canSave = computed(() => isDirty.value && !disableActions.value);
const canCancel = computed(() => isDirty.value && !disableActions.value);
const companySelectorDisabled = computed(
  () => loading.value || companyStore.loading.value || linkingCompany.value
);
const availableCompanies = computed(() => companyStore.rawCompanies.value);
const linkedCompany = computed(
  () =>
    availableCompanies.value.find((company) => company.id === (job.value?.companyId ?? '')) ?? null
);

function hydrateForm(data: JobDescription) {
  form.title = data.title ?? '';
  form.seniorityLevel = data.seniorityLevel ?? '';
  form.roleSummary = data.roleSummary ?? '';
  form.responsibilities = toStringList(data.responsibilities);
  form.requiredSkills = toStringList(data.requiredSkills);
  form.behaviours = toStringList(data.behaviours);
  form.successCriteria = toStringList(data.successCriteria);
  form.explicitPains = toStringList(data.explicitPains);
  selectedCompanyId.value = data.companyId ?? null;
}

async function loadJob() {
  const id = jobId.value;
  if (!id) {
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    const result = await jobAnalysis.loadJob(id);
    if (!result) {
      throw new Error(t('jobDetail.errors.notFound'));
    }
    hydrateForm(result);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('jobDetail.errors.generic');
  } finally {
    loading.value = false;
  }
}

async function loadCompanies() {
  try {
    await companyStore.listCompanies();
  } catch (error) {
    console.error('[jobDetail] Failed to load companies', error);
    if (!errorMessage.value) {
      errorMessage.value =
        error instanceof Error ? error.message : t('companies.list.errors.generic');
    }
  }
}

async function loadMatchingSummary() {
  const id = jobId.value;
  if (!id) {
    return;
  }

  if (!auth.userId.value) {
    await auth.loadUserId();
  }

  const userId = auth.userId.value;
  if (!userId) {
    return;
  }

  matchingSummaryLoading.value = true;
  matchingSummaryError.value = null;

  try {
    const companyId = job.value?.companyId ?? null;
    let summary = await matchingSummaryService.getByContext({
      userId,
      jobId: id,
      companyId,
    });

    if (!summary && companyId) {
      summary = await matchingSummaryService.getByContext({ userId, jobId: id, companyId: null });
    }

    matchingSummary.value = summary;
  } catch (error) {
    console.error('[jobDetail] Failed to load matching summary', error);
    matchingSummaryError.value =
      error instanceof Error ? error.message : t('jobDetail.errors.generic');
    matchingSummary.value = null;
  } finally {
    matchingSummaryLoading.value = false;
  }
}

async function loadExistingMaterials() {
  const id = jobId.value;
  if (!id) {
    return;
  }

  const result = await tailoredMaterials.loadExistingMaterialsForJob(id);
  if (result.ok) {
    existingCv.value = result.data.cv;
    existingCoverLetter.value = result.data.coverLetter;
    existingSpeech.value = result.data.speechBlock;
    return;
  }

  existingCv.value = null;
  existingCoverLetter.value = null;
  existingSpeech.value = null;
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function toStringList(list?: Array<string | null | undefined> | null): string[] {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((value): value is string => typeof value === 'string');
}

function formatDate(value?: string | null) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function closeReanalyseModal() {
  showReanalyseModal.value = false;
}

function updateListField(field: ListField, value: string[]) {
  form[field] = [...value];
}

function updateBreadcrumb(title?: string | null) {
  route.meta.breadcrumbLabel = title?.trim() || t('jobList.card.noTitle');
}

function buildUpdatePayload(): Partial<JobDescriptionUpdateInput> {
  return {
    title: form.title,
    seniorityLevel: form.seniorityLevel,
    roleSummary: form.roleSummary,
    responsibilities: [...form.responsibilities],
    requiredSkills: [...form.requiredSkills],
    behaviours: [...form.behaviours],
    successCriteria: [...form.successCriteria],
    explicitPains: [...form.explicitPains],
  };
}

async function handleSave() {
  const id = jobId.value;
  if (!id || !isDirty.value) {
    return;
  }

  saving.value = true;
  errorMessage.value = null;

  try {
    const payload = buildUpdatePayload();
    const updated = await jobAnalysis.updateJob(id, payload);
    hydrateForm(updated);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('jobDetail.errors.generic');
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  if (job.value) {
    hydrateForm(job.value);
  }
}

async function handleCompanyLinkChange(nextCompanyId: string | null) {
  if (!job.value?.id) {
    selectedCompanyId.value = null;
    return;
  }

  const previousCompanyId = job.value.companyId ?? null;
  if (nextCompanyId === previousCompanyId) {
    selectedCompanyId.value = previousCompanyId;
    return;
  }

  selectedCompanyId.value = nextCompanyId;
  linkingCompany.value = true;
  errorMessage.value = null;

  try {
    const updated = await jobAnalysis.updateJob(job.value.id, { companyId: nextCompanyId });
    hydrateForm(updated);
  } catch (error) {
    selectedCompanyId.value = previousCompanyId;
    errorMessage.value = error instanceof Error ? error.message : t('jobDetail.errors.generic');
  } finally {
    linkingCompany.value = false;
  }
}

function handleCompanyLinkClear() {
  handleCompanyLinkChange(null);
}

function redirectToCompanyCreate() {
  router.push({
    path: '/companies/new',
    query: { returnTo: route.fullPath },
  });
}

async function confirmReanalyse() {
  const id = jobId.value;
  if (!id) {
    return;
  }

  reanalysing.value = true;
  errorMessage.value = null;

  try {
    const updated = await jobAnalysis.reanalyseJob(id);
    hydrateForm(updated);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('jobDetail.errors.generic');
  } finally {
    reanalysing.value = false;
    closeReanalyseModal();
  }
}

async function handleGenerateCv() {
  if (!job.value || !matchingSummary.value) {
    return;
  }

  activeMaterial.value = 'cv';
  try {
    const created = await tailoredMaterials.generateTailoredCvForJob({
      job: job.value,
      matchingSummary: matchingSummary.value,
    });
    if (created?.id) {
      await router.push(`/cv/${created.id}`);
    }
  } finally {
    activeMaterial.value = null;
  }
}

async function handleGenerateCoverLetter() {
  if (!job.value || !matchingSummary.value) {
    return;
  }

  activeMaterial.value = 'cover-letter';
  try {
    const created = await tailoredMaterials.generateTailoredCoverLetterForJob({
      job: job.value,
      matchingSummary: matchingSummary.value,
    });
    if (created?.id) {
      await router.push(`/cover-letters/${created.id}`);
    }
  } finally {
    activeMaterial.value = null;
  }
}

async function handleGenerateSpeech() {
  if (!job.value || !matchingSummary.value) {
    return;
  }

  activeMaterial.value = 'speech';
  try {
    const created = await tailoredMaterials.generateTailoredSpeechForJob({
      job: job.value,
      matchingSummary: matchingSummary.value,
    });
    if (created?.id) {
      await router.push(`/speech/${created.id}`);
    }
  } finally {
    activeMaterial.value = null;
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('jobDetail.title')"
        :description="t('jobDetail.description')"
        :links="headerLinks"
      />

      <UPageBody>
        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('jobDetail.errors.title')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          class="mb-6"
          @close="errorMessage = null"
        />

        <UCard v-if="loading">
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="mt-4 h-10 w-full" />
          <USkeleton class="mt-4 h-24 w-full" />
        </UCard>

        <template v-else-if="job">
          <UCard class="mb-6">
            <div class="flex flex-col gap-6">
              <div class="grid gap-4 md:grid-cols-2">
                <UFormField :label="t('jobDetail.fields.title')">
                  <UInput
                    v-model="form.title"
                    :placeholder="t('jobDetail.placeholders.title')"
                    :disabled="disableActions"
                    class="w-full"
                    data-testid="job-title-input"
                  />
                </UFormField>

                <UFormField :label="t('jobDetail.fields.seniorityLevel')">
                  <UInput
                    v-model="form.seniorityLevel"
                    :placeholder="t('jobDetail.placeholders.seniorityLevel')"
                    :disabled="disableActions"
                    data-testid="job-seniority-input"
                  />
                </UFormField>
              </div>

              <UFormField :label="t('jobDetail.fields.roleSummary')">
                <UTextarea
                  v-model="form.roleSummary"
                  :placeholder="t('jobDetail.placeholders.roleSummary')"
                  :disabled="disableActions"
                  :rows="4"
                  class="w-full"
                  data-testid="job-summary-input"
                />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="text-sm text-gray-500">
                    {{ t('jobDetail.meta.status') }}
                  </p>
                  <UBadge color="primary" variant="soft" class="mt-1">
                    {{ statusLabel }}
                  </UBadge>
                </div>
                <div>
                  <p class="text-sm text-gray-500">
                    {{ t('jobDetail.meta.updatedAt') }}
                  </p>
                  <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {{ formattedUpdatedAt || t('jobDetail.meta.notAvailable') }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">
                    {{ t('jobDetail.meta.createdAt') }}
                  </p>
                  <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {{ formattedCreatedAt || t('jobDetail.meta.notAvailable') }}
                  </p>
                </div>
                <div v-if="linkedCompany">
                  <p class="text-sm text-gray-500">
                    {{ t('jobDetail.meta.companyId') }}
                  </p>
                  <div class="mt-1 flex items-center gap-2">
                    <LinkedCompanyBadge :company="linkedCompany" />
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      icon="i-heroicons-x-mark-20-solid"
                      :aria-label="t('jobDetail.companyLink.clear')"
                      data-testid="job-company-clear"
                      :disabled="linkingCompany"
                      @click="handleCompanyLinkClear"
                    />
                  </div>
                </div>
              </div>

              <div v-if="!selectedCompanyId || !linkedCompany" class="mt-6">
                <div class="mt-3">
                  <CompanySelector
                    :model-value="selectedCompanyId"
                    :companies="availableCompanies"
                    :loading="companyStore.loading.value || linkingCompany"
                    :disabled="companySelectorDisabled"
                    @update:model-value="handleCompanyLinkChange"
                    @clear="handleCompanyLinkClear"
                    @create="redirectToCompanyCreate"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h3 class="text-lg font-semibold">{{ t('jobDetail.sections.parsedData') }}</h3>
                <p class="text-sm text-gray-500">
                  {{ t('jobDetail.sections.description') }}
                </p>
              </div>
            </template>

            <UTabs :items="tabItems" class="mt-4">
              <template v-for="section in listSections" :key="section.key" #[section.key]>
                <TagInput
                  :model-value="form[section.key] as string[]"
                  :label="section.label"
                  color="primary"
                  :placeholder="section.placeholder"
                  :hint="section.hint"
                  :disabled="disableActions"
                  :data-testid="`job-tag-${section.key}`"
                  @update:model-value="updateListField(section.key as ListField, $event)"
                />
              </template>
            </UTabs>

            <div class="mt-6 flex flex-wrap justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :label="t('common.cancel')"
                :disabled="!canCancel"
                data-testid="job-cancel-button"
                @click="handleCancel"
              />
              <UButton
                color="primary"
                :label="t('common.save')"
                :disabled="!canSave"
                :loading="saving"
                data-testid="job-save-button"
                @click="handleSave"
              />
            </div>
          </UCard>

          <UCard class="mt-6">
            <template #header>
              <div>
                <h3 class="text-lg font-semibold">
                  {{ t('tailoredMaterials.materials.title') }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ t('tailoredMaterials.materials.description') }}
                </p>
              </div>
            </template>

            <div class="space-y-4">
              <UAlert
                v-if="matchingSummaryError"
                icon="i-heroicons-exclamation-triangle"
                color="warning"
                variant="soft"
                :title="t('tailoredMaterials.materials.summaryErrorTitle')"
                :description="matchingSummaryError"
              />

              <UAlert
                v-else-if="materialsError"
                icon="i-heroicons-exclamation-triangle"
                color="warning"
                variant="soft"
                :title="t('tailoredMaterials.materials.generateErrorTitle')"
                :description="materialsError"
              />

              <UAlert
                v-else-if="materialsErrorMessage"
                icon="i-heroicons-exclamation-triangle"
                color="warning"
                variant="soft"
                :title="t('tailoredMaterials.materials.loadErrorTitle')"
                :description="materialsErrorMessage"
              />

              <div
                v-else-if="!hasMatchingSummary && !matchingSummaryLoading && !hasExistingMaterials"
                class="space-y-3"
              >
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t('tailoredMaterials.materials.missingSummaryHint') }}
                </p>
                <UButton
                  v-if="matchLink"
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-sparkles"
                  :label="t('tailoredMaterials.materials.generateMatch')"
                  :to="matchLink"
                  :disabled="!matchLink"
                />
              </div>

              <USkeleton
                v-else-if="matchingSummaryLoading || materialsLoading"
                class="h-10 w-full"
              />

              <div class="grid gap-3 sm:grid-cols-3">
                <UButton
                  v-if="cvLink"
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-document-text"
                  :label="t('tailoredMaterials.materials.viewCv')"
                  :to="cvLink"
                />
                <UButton
                  v-else
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-document-text"
                  :label="t('tailoredMaterials.materials.generateCv')"
                  :loading="isGeneratingMaterials && activeMaterial === 'cv'"
                  :disabled="materialsDisabled"
                  @click="handleGenerateCv"
                />
                <UButton
                  v-if="coverLetterLink"
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-envelope"
                  :label="t('tailoredMaterials.materials.viewCoverLetter')"
                  :to="coverLetterLink"
                />
                <UButton
                  v-else
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-envelope"
                  :label="t('tailoredMaterials.materials.generateCoverLetter')"
                  :loading="isGeneratingMaterials && activeMaterial === 'cover-letter'"
                  :disabled="materialsDisabled"
                  @click="handleGenerateCoverLetter"
                />
                <UButton
                  v-if="speechLink"
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-microphone"
                  :label="t('tailoredMaterials.materials.viewSpeech')"
                  :to="speechLink"
                />
                <UButton
                  v-else
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-microphone"
                  :label="t('tailoredMaterials.materials.generateSpeech')"
                  :loading="isGeneratingMaterials && activeMaterial === 'speech'"
                  :disabled="materialsDisabled"
                  @click="handleGenerateSpeech"
                />
              </div>
            </div>
          </UCard>
        </template>

        <UCard v-else>
          <UEmpty :title="t('jobDetail.errors.notFound')" icon="i-heroicons-briefcase">
            <template #actions>
              <UButton :label="t('common.backToList')" @click="router.push('/jobs')" />
            </template>
          </UEmpty>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal v-model:open="showReanalyseModal" :title="t('jobDetail.reanalyse.title')">
      <template #body>
        <p>{{ t('jobDetail.reanalyse.message') }}</p>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('jobDetail.reanalyse.cancel')"
          @click="closeReanalyseModal"
        />
        <UButton
          color="primary"
          :label="t('jobDetail.reanalyse.confirm')"
          :loading="reanalysing"
          data-testid="job-reanalyse-confirm"
          @click="confirmReanalyse"
        />
      </template>
    </UModal>
  </UContainer>
</template>
