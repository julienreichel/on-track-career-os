<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import TagInput from '@/components/TagInput.vue';
import LinkedCompanyBadge from '@/components/company/LinkedCompanyBadge.vue';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useCompanies } from '@/composables/useCompanies';
import { useGuidance } from '@/composables/useGuidance';
import TailoredMaterialsCard from '@/components/tailoring/TailoredMaterialsCard.vue';
import GuidanceBanner from '@/components/guidance/GuidanceBanner.vue';
import { formatDetailDate } from '@/utils/formatDetailDate';
import type {
  JobDescription,
  JobDescriptionUpdateInput,
} from '@/domain/job-description/JobDescription';
import type { Company } from '@/domain/company/Company';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import type { PageHeaderLink } from '@/types/ui';

type ScalarField = 'title' | 'seniorityLevel' | 'roleSummary';
type ListField =
  | 'responsibilities'
  | 'requiredSkills'
  | 'behaviours'
  | 'successCriteria'
  | 'explicitPains'
  | 'atsKeywords';

const scalarFields: ScalarField[] = ['title', 'seniorityLevel', 'roleSummary'];
const listFields: ListField[] = [
  'responsibilities',
  'requiredSkills',
  'behaviours',
  'successCriteria',
  'explicitPains',
  'atsKeywords',
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

const jobId = computed(() => route.params.jobId as string | undefined);
const job = jobAnalysis.selectedJob;

type JobWithRelations = JobDescription & {
  company?: Company | null;
  matchingSummaries?: MatchingSummary[] | null;
  cvs?: CVDocument[] | null;
  coverLetters?: CoverLetter[] | null;
  speechBlocks?: SpeechBlock[] | null;
};

const jobWithRelations = computed(() => job.value as JobWithRelations | null);

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const saving = ref(false);
const isEditing = ref(false);
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
  atsKeywords: [],
});

const listSections = computed(
  () =>
    [
      {
        key: 'responsibilities',
        label: t('jobs.form.fields.responsibilities.label'),
        placeholder: t('jobs.form.fields.responsibilities.placeholder'),
        hint: t('jobs.form.fields.responsibilities.hint'),
      },
      {
        key: 'requiredSkills',
        label: t('jobs.form.fields.requiredSkills.label'),
        placeholder: t('jobs.form.fields.requiredSkills.placeholder'),
        hint: t('jobs.form.fields.requiredSkills.hint'),
      },
      {
        key: 'behaviours',
        label: t('jobs.form.fields.behaviours.label'),
        placeholder: t('jobs.form.fields.behaviours.placeholder'),
        hint: t('jobs.form.fields.behaviours.hint'),
      },
      {
        key: 'successCriteria',
        label: t('jobs.form.fields.successCriteria.label'),
        placeholder: t('jobs.form.fields.successCriteria.placeholder'),
        hint: t('jobs.form.fields.successCriteria.hint'),
      },
      {
        key: 'explicitPains',
        label: t('jobs.form.fields.explicitPains.label'),
        placeholder: t('jobs.form.fields.explicitPains.placeholder'),
        hint: t('jobs.form.fields.explicitPains.hint'),
      },
      {
        key: 'atsKeywords',
        label: t('jobs.form.fields.atsKeywords.label'),
        placeholder: t('jobs.form.fields.atsKeywords.placeholder'),
        hint: t('jobs.form.fields.atsKeywords.hint'),
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

const matchLink = computed(() => (jobId.value ? `/jobs/${jobId.value}/match` : undefined));

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/jobs',
  },
  {
    label: t('jobs.detail.actions.viewMatch'),
    icon: 'i-heroicons-sparkles',
    to: matchLink.value,
  },
]);

const statusLabel = computed(() => {
  const status = job.value?.status ?? 'draft';
  return t(`jobs.detail.status.${status}`);
});

const viewListSections = computed(() =>
  listSections.value.map((section) => ({
    ...section,
    items: form[section.key],
  }))
);

const formattedCreatedAt = computed(() => formatDetailDate(job.value?.createdAt));
const formattedUpdatedAt = computed(() => formatDetailDate(job.value?.updatedAt));
const displayTitle = computed(() => form.title.trim() || t('jobs.detail.untitled'));
const matchingSummary = computed(() => selectMatchingSummary(jobWithRelations.value));
const { guidance } = useGuidance('job-detail', () => ({
  jobId: jobId.value,
  hasMatchingSummary: Boolean(matchingSummary.value),
}));
const existingMaterials = computed(() => ({
  cv: pickMostRecent((jobWithRelations.value?.cvs as CVDocument[]) ?? []),
  coverLetter: pickMostRecent((jobWithRelations.value?.coverLetters as CoverLetter[]) ?? []),
  speechBlock: pickMostRecent((jobWithRelations.value?.speechBlocks as SpeechBlock[]) ?? []),
}));

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

watch(
  jobId,
  (nextJobId, previousJobId) => {
    if (!nextJobId) {
      return;
    }
    if (nextJobId !== previousJobId) {
      job.value = null;
      resetForm();
      updateBreadcrumb(null);
    }
    void loadJob();
  },
  { immediate: true }
);

watch(
  () => isEditing.value,
  async (editing) => {
    if (!editing || companyStore.rawCompanies.value.length > 0) {
      return;
    }
    void loadCompanies();
  }
);

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

const disableActions = computed(() => saving.value);
const companySelectorDisabled = computed(
  () => loading.value || companyStore.loading.value || linkingCompany.value
);
const availableCompanies = computed(() => companyStore.rawCompanies.value);
const linkedCompany = computed(() => {
  // Use job.value.companyId as source of truth
  const companyId = job.value?.companyId;
  if (!companyId) {
    return null;
  }

  // Try to get from relationships first (populated after reload)
  const relationCompany = jobWithRelations.value?.company;
  if (relationCompany && relationCompany.id === companyId) {
    return relationCompany;
  }

  // Fallback to availableCompanies if relationship is stale or not loaded yet
  const company = availableCompanies.value.find((c) => c.id === companyId);
  return company ?? null;
});

function hydrateForm(data: JobDescription) {
  form.title = data.title ?? '';
  form.seniorityLevel = data.seniorityLevel ?? '';
  form.roleSummary = data.roleSummary ?? '';
  form.responsibilities = toStringList(data.responsibilities);
  form.requiredSkills = toStringList(data.requiredSkills);
  form.behaviours = toStringList(data.behaviours);
  form.successCriteria = toStringList(data.successCriteria);
  form.explicitPains = toStringList(data.explicitPains);
  form.atsKeywords = toStringList(data.atsKeywords);
  selectedCompanyId.value = data.companyId ?? null;
}

function resetForm() {
  form.title = '';
  form.seniorityLevel = '';
  form.roleSummary = '';
  form.responsibilities = [];
  form.requiredSkills = [];
  form.behaviours = [];
  form.successCriteria = [];
  form.explicitPains = [];
  form.atsKeywords = [];
  selectedCompanyId.value = null;
}

async function loadJob() {
  const id = jobId.value;
  if (!id) {
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    const result = await jobAnalysis.loadJobWithRelations(id);
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

function updateListField(field: ListField, value: string[]) {
  form[field] = [...value];
}

function updateBreadcrumb(title?: string | null) {
  route.meta.breadcrumbLabel = title?.trim() || t('jobList.card.noTitle');
}

type DatedItem = {
  updatedAt?: string | null;
  createdAt?: string | null;
  generatedAt?: string | null;
};

function pickMostRecent<T extends DatedItem>(items: T[] | null | undefined): T | null {
  if (!Array.isArray(items)) {
    return null;
  }

  if (!items.length) {
    return null;
  }

  return [...items].sort((a, b) => {
    const dateA = new Date(a.updatedAt ?? a.generatedAt ?? a.createdAt ?? 0).getTime();
    const dateB = new Date(b.updatedAt ?? b.generatedAt ?? b.createdAt ?? 0).getTime();
    return dateB - dateA;
  })[0]!;
}

function selectMatchingSummary(data: JobWithRelations | null) {
  if (!data) {
    return null;
  }
  if (!Array.isArray(data.matchingSummaries)) {
    return null;
  }

  const summaries = data.matchingSummaries.filter((summary): summary is MatchingSummary =>
    Boolean(summary)
  );
  if (!summaries.length) {
    return null;
  }

  const companyId = data.companyId ?? null;
  const companyMatches = companyId
    ? summaries.filter((summary) => summary.companyId === companyId)
    : [];
  const jobMatches = summaries.filter((summary) => !summary.companyId);
  let candidates = summaries;
  if (companyMatches.length) {
    candidates = companyMatches;
  } else if (jobMatches.length) {
    candidates = jobMatches;
  }
  return pickMostRecent(candidates);
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
    atsKeywords: [...form.atsKeywords],
  };
}

async function handleSave() {
  const id = jobId.value;
  if (!id) {
    return;
  }
  if (!isDirty.value) {
    isEditing.value = false;
    return;
  }

  saving.value = true;
  errorMessage.value = null;

  try {
    const payload = buildUpdatePayload();
    const updated = await jobAnalysis.updateJob(id, payload);
    hydrateForm(updated);
    isEditing.value = false;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('jobDetail.errors.generic');
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  if (!isDirty.value) {
    isEditing.value = false;
    return;
  }
  if (job.value) {
    hydrateForm(job.value);
  }
  isEditing.value = false;
}

function handleEdit() {
  if (!job.value) {
    return;
  }
  hydrateForm(job.value);
  isEditing.value = true;
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
  return handleCompanyLinkChange(null);
}

function redirectToCompanyCreate() {
  void router.push({
    path: '/companies/new',
    query: { returnTo: route.fullPath },
  });
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="displayTitle"
        :description="t('jobDetail.description')"
        :links="headerLinks"
      />

      <UPageBody>
        <GuidanceBanner v-if="guidance.banner" :banner="guidance.banner" class="mb-6" />

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
          <template v-if="isEditing">
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
                    <UBadge color="neutral" variant="outline" class="mt-1">
                      {{ statusLabel }}
                    </UBadge>
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
              <template #footer>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p v-if="formattedUpdatedAt" class="text-xs text-gray-400">
                    {{ t('common.lastUpdated', { date: formattedUpdatedAt }) }}
                  </p>
                  <div class="flex flex-wrap justify-end gap-3">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      :label="t('common.cancel')"
                      :disabled="disableActions"
                      data-testid="job-cancel-button"
                      @click="handleCancel"
                    />
                    <UButton
                      color="primary"
                      :label="t('common.save')"
                      icon="i-heroicons-check"
                      :disabled="disableActions"
                      :loading="saving"
                      data-testid="job-save-button"
                      @click="handleSave"
                    />
                  </div>
                </div>
              </template>
            </UCard>
          </template>

          <template v-else>
            <TailoredMaterialsCard
              :job="job"
              :matching-summary="matchingSummary"
              :existing-materials="existingMaterials"
              :match-link="matchLink"
              :summary-loading="loading"
              :summary-error="null"
              description-key="description"
            />
            <UCard class="mb-6">
              <div class="flex flex-col gap-6">
                <div class="grid gap-4 md:grid-cols-2">
                  <UFormField :label="t('jobDetail.fields.title')">
                    <p>{{ form.title || t('jobDetail.meta.notAvailable') }}</p>
                  </UFormField>
                  <UFormField :label="t('jobDetail.fields.seniorityLevel')">
                    <p>{{ form.seniorityLevel || t('jobDetail.meta.notAvailable') }}</p>
                  </UFormField>
                </div>
                <UFormField :label="t('jobDetail.fields.roleSummary')">
                  <p>{{ form.roleSummary || t('jobDetail.meta.notAvailable') }}</p>
                </UFormField>
                <div class="grid gap-4 sm:grid-cols-2">
                  <UFormField :label="t('jobDetail.meta.status')">
                    <UBadge color="neutral" variant="outline" icon="i-heroicons-briefcase">
                      {{ statusLabel }}
                    </UBadge>
                  </UFormField>
                  <UFormField :label="t('jobDetail.meta.createdAt')">
                    <p>{{ formattedCreatedAt || t('jobDetail.meta.notAvailable') }}</p>
                  </UFormField>
                  <UFormField :label="t('jobDetail.meta.companyId')">
                    <LinkedCompanyBadge v-if="linkedCompany" :company="linkedCompany" />
                    <p v-else>{{ t('jobDetail.meta.notAvailable') }}</p>
                  </UFormField>
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
                <template v-for="section in viewListSections" :key="section.key" #[section.key]>
                  <ul v-if="section.items.length" class="list-disc space-y-1 pl-4">
                    <li v-for="item in section.items" :key="item">
                      {{ item }}
                    </li>
                  </ul>
                  <p v-else>{{ t('jobDetail.meta.notAvailable') }}</p>
                </template>
              </UTabs>

              <template #footer>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p v-if="formattedUpdatedAt" class="text-xs text-gray-400">
                    {{ t('common.lastUpdated', { date: formattedUpdatedAt }) }}
                  </p>
                  <div class="flex justify-end">
                    <UButton
                      color="primary"
                      variant="outline"
                      :label="t('common.edit')"
                      icon="i-heroicons-pencil"
                      @click="handleEdit"
                    />
                  </div>
                </div>
              </template>
            </UCard>
          </template>
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
  </UContainer>
</template>
