<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import CompanyForm, { type CompanyFormState } from '@/components/company/CompanyForm.vue';
import CompanyNotesInput from '@/components/company/CompanyNotesInput.vue';
import CompanyCanvasEditor from '@/components/company/CompanyCanvasEditor.vue';
import JobCard from '@/components/job/JobCard.vue';
import { useCompany } from '@/application/company/useCompany';
import { useCompanyCanvas } from '@/application/company/useCompanyCanvas';
import { useCompanyJobs } from '@/application/company/useCompanyJobs';
import { useErrorDisplay } from '@/composables/useErrorDisplay';
import type { Company } from '@/domain/company/Company';
import type { CompanyCanvas } from '@/domain/company-canvas/CompanyCanvas';
import type { JobDescription } from '@/domain/job-description/JobDescription';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { pageError, setPageError, clearPageError, notifyActionError } = useErrorDisplay();

const companyId = computed(() => route.params.companyId as string);
const companyStore = useCompany(companyId.value);
const canvasStore = useCompanyCanvas(companyId.value);
const jobsStore = useCompanyJobs(companyId.value);

const loading = ref(true);
const savingCompany = ref(false);
const analyzingCompany = ref(false);
const isEditing = ref(false);

const form = reactive<CompanyFormState>({
  companyName: '',
  industry: '',
  sizeRange: '',
  website: '',
  productsServices: [],
  targetMarkets: [],
  customerSegments: [],
  description: '',
});

const rawNotes = ref('');

const company = companyStore.company;
const relatedJobs = jobsStore.jobs;
const jobsLoading = jobsStore.loading;
const jobsError = jobsStore.error;

const toStringArray = (values?: (string | null)[] | null) =>
  (values ?? []).filter((entry): entry is string => typeof entry === 'string');

type CompanyWithRelations = Company & {
  canvas?: CompanyCanvas | null;
  jobs?: JobDescription[] | null;
};

const headerLinks = computed(() => [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/companies',
  },
]);

const formattedMeta = computed(() => {
  if (!company.value?.updatedAt) return '';
  const date = new Date(company.value.updatedAt);
  if (Number.isNaN(date.getTime())) {
    return company.value.updatedAt;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
});

const hasScalarChanges = () => {
  if (!company.value) return false;
  return (
    form.companyName !== (company.value.companyName ?? '') ||
    form.industry !== (company.value.industry ?? '') ||
    form.sizeRange !== (company.value.sizeRange ?? '') ||
    form.website !== (company.value.website ?? '') ||
    form.description !== (company.value.description ?? '')
  );
};

const hasListChanges = () => {
  if (!company.value) return false;
  return (
    !arraysEqual(form.productsServices, toStringArray(company.value.productsServices)) ||
    !arraysEqual(form.targetMarkets, toStringArray(company.value.targetMarkets)) ||
    !arraysEqual(form.customerSegments, toStringArray(company.value.customerSegments))
  );
};

const hasNotesChange = () => {
  if (!company.value) return false;
  return rawNotes.value !== (company.value.rawNotes ?? '');
};

const isDirty = computed(
  () => !!company.value && (hasScalarChanges() || hasListChanges() || hasNotesChange())
);

const disableActions = computed(() => savingCompany.value || analyzingCompany.value);
const canSaveCompany = computed(() => isDirty.value && !disableActions.value);

const canvasSaving = ref(false);
const canvasRegenerating = ref(false);

watch(
  company,
  (value) => {
    if (value) {
      hydrateCompany(value);
    }
  },
  { immediate: true }
);

watch(
  companyId,
  async () => {
    await loadCompany();
  },
  { immediate: true }
);

async function loadCompany() {
  loading.value = true;
  clearPageError();
  try {
    const result = await companyStore.loadWithRelations();
    if (!result) {
      throw new Error(t('companies.detail.errors.notFound'));
    }
    const hydrated = result as CompanyWithRelations;
    canvasStore.hydrate(hydrated.canvas ?? null);
    jobsStore.hydrate(hydrated.jobs ?? []);
    isEditing.value = false;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('companies.detail.errors.generic');
    setPageError(message);
  } finally {
    loading.value = false;
  }
}

function hydrateCompany(value: Company) {
  form.companyName = value.companyName ?? '';
  form.industry = value.industry ?? '';
  form.sizeRange = value.sizeRange ?? '';
  form.website = value.website ?? '';
  form.description = value.description ?? '';
  form.productsServices = toStringArray(value.productsServices);
  form.targetMarkets = toStringArray(value.targetMarkets);
  form.customerSegments = toStringArray(value.customerSegments);
  rawNotes.value = value.rawNotes ?? '';
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

async function saveCompany() {
  if (!company.value) return;
  savingCompany.value = true;
  try {
    const payload = {
      companyName: form.companyName,
      industry: form.industry || null,
      sizeRange: form.sizeRange || null,
      website: form.website || null,
      description: form.description || null,
      productsServices: form.productsServices,
      targetMarkets: form.targetMarkets,
      customerSegments: form.customerSegments,
      rawNotes: rawNotes.value || null,
    };
    const updated = await companyStore.save(payload);
    if (updated) {
      hydrateCompany(updated);
      isEditing.value = false;
    }
  } catch (error) {
    notifyActionError({
      title: t('companies.detail.errors.title'),
      description: error instanceof Error ? error.message : t('companies.detail.errors.generic'),
    });
  } finally {
    savingCompany.value = false;
  }
}

function handleEdit() {
  if (!company.value) return;
  hydrateCompany(company.value);
  isEditing.value = true;
}

function handleCancel() {
  if (company.value) {
    hydrateCompany(company.value);
  }
  isEditing.value = false;
}

async function saveCanvas() {
  canvasSaving.value = true;
  try {
    await canvasStore.save();
  } catch (error) {
    notifyActionError({
      title: t('companies.canvas.errors.save'),
      description: error instanceof Error ? error.message : undefined,
    });
  } finally {
    canvasSaving.value = false;
  }
}

async function regenerateCanvas() {
  canvasRegenerating.value = true;
  try {
    const notes = rawNotes.value ? [rawNotes.value] : [];
    await canvasStore.regenerate(notes);
  } catch (error) {
    notifyActionError({
      title: t('companies.canvas.errors.generate'),
      description: error instanceof Error ? error.message : undefined,
    });
  } finally {
    canvasRegenerating.value = false;
  }
}

function openJob(jobId: string) {
  void router.push(`/jobs/${jobId}`);
}

function clearJobsError() {
  jobsError.value = null;
}
</script>

<template>
  <UPage>
    <UPageHeader
      :title="form.companyName || t('companies.detail.untitled')"
      :description="t('companies.detail.description')"
      :links="headerLinks"
    />

    <UPageBody>
      <UAlert
        v-if="pageError"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="t('companies.detail.errors.title')"
        :description="pageError"
        class="mb-6"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
        @close="clearPageError"
      />

      <UCard v-if="loading">
        <USkeleton class="h-8 w-full" />
        <USkeleton class="mt-4 h-32 w-full" />
      </UCard>

      <div v-else class="space-y-8">
        <UCard>
          <template v-if="isEditing">
            <div class="space-y-6">
              <CompanyForm v-model="form" :disabled="disableActions" />
              <CompanyNotesInput v-model="rawNotes" :disabled="disableActions" />
            </div>
          </template>

          <template v-else>
            <div class="grid gap-4 md:grid-cols-2">
              <UFormField :label="t('companies.form.companyName')">
                <p>{{ form.companyName || t('common.notAvailable') }}</p>
              </UFormField>
              <UFormField :label="t('companies.form.industry')">
                <p>{{ form.industry || t('common.notAvailable') }}</p>
              </UFormField>
              <UFormField :label="t('companies.form.sizeRange')">
                <p>{{ form.sizeRange || t('common.notAvailable') }}</p>
              </UFormField>
              <UFormField :label="t('companies.form.website')">
                <NuxtLink
                  v-if="form.website"
                  :to="form.website"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ form.website }}
                </NuxtLink>
                <p v-else>{{ t('common.notAvailable') }}</p>
              </UFormField>
            </div>

            <UFormField :label="t('companies.form.description')" class="mt-4">
              <p>{{ form.description || t('common.notAvailable') }}</p>
            </UFormField>

            <div class="mt-4 grid gap-4 md:grid-cols-3">
              <UFormField :label="t('companies.form.productsServices')">
                <ul v-if="form.productsServices.length" class="list-disc space-y-1 pl-4">
                  <li v-for="item in form.productsServices" :key="item">
                    {{ item }}
                  </li>
                </ul>
                <p v-else>{{ t('common.notAvailable') }}</p>
              </UFormField>
              <UFormField :label="t('companies.form.targetMarkets')">
                <ul v-if="form.targetMarkets.length" class="list-disc space-y-1 pl-4">
                  <li v-for="item in form.targetMarkets" :key="item">
                    {{ item }}
                  </li>
                </ul>
                <p v-else>{{ t('common.notAvailable') }}</p>
              </UFormField>
              <UFormField :label="t('companies.form.customerSegments')">
                <ul v-if="form.customerSegments.length" class="list-disc space-y-1 pl-4">
                  <li v-for="item in form.customerSegments" :key="item">
                    {{ item }}
                  </li>
                </ul>
                <p v-else>{{ t('common.notAvailable') }}</p>
              </UFormField>
            </div>
          </template>

          <template #footer>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p v-if="formattedMeta" class="text-xs text-gray-400">
                {{ t('common.lastUpdated', { date: formattedMeta }) }}
              </p>
              <div v-if="isEditing" class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  :label="t('common.actions.cancel')"
                  :disabled="disableActions"
                  data-testid="company-cancel-button"
                  @click="handleCancel"
                />
                <UButton
                  color="primary"
                  icon="i-heroicons-check"
                  :label="t('common.actions.save')"
                  :loading="savingCompany"
                  :disabled="!canSaveCompany"
                  data-testid="company-save-button"
                  @click="saveCompany"
                />
              </div>
              <div v-else class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <UButton
                  color="primary"
                  variant="outline"
                  icon="i-heroicons-pencil"
                  :label="t('common.actions.edit')"
                  data-testid="company-edit-button"
                  @click="handleEdit"
                />
              </div>
            </div>
          </template>
        </UCard>

        <CompanyCanvasEditor
          :blocks="canvasStore.draftBlocks.value"
          :needs-update="canvasStore.canvas.value?.needsUpdate ?? true"
          :last-generated-at="canvasStore.canvas.value?.lastGeneratedAt ?? null"
          :saving="canvasSaving"
          :regenerating="canvasRegenerating"
          :disabled="canvasStore.loading.value"
          @update:block="canvasStore.updateBlock"
          @save="saveCanvas"
          @regenerate="regenerateCanvas"
        />

        <UCard>
          <div class="mb-6">
            <h2 class="text-xl font-semibold">
              {{ t('companies.detail.sections.linkedJobs') }}
            </h2>
            <p class="text-sm text-gray-500">
              {{ t('companies.detail.sections.linkedJobsDescription') }}
            </p>
          </div>

          <UAlert
            v-if="jobsError"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            :title="t('companies.detail.errors.title')"
            :description="jobsError"
            class="mb-4"
            :close-button="{
              icon: 'i-heroicons-x-mark-20-solid',
              color: 'error',
              variant: 'link',
            }"
            @close="clearJobsError"
          />

          <div v-if="jobsLoading" class="grid gap-4 md:grid-cols-2">
            <USkeleton class="h-32 w-full" />
            <USkeleton class="h-32 w-full" />
          </div>
          <div
            v-else-if="relatedJobs.length === 0"
            class="rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-800"
          >
            <p class="text-sm text-gray-500">
              {{ t('companies.detail.sections.linkedJobsEmpty') }}
            </p>
            <UButton
              class="mt-4"
              color="primary"
              variant="outline"
              :label="t('companies.list.actions.viewJobs')"
              icon="i-heroicons-arrow-top-right-on-square"
              to="/jobs"
            />
          </div>
          <div v-else class="grid gap-4 md:grid-cols-2">
            <JobCard
              v-for="job in relatedJobs"
              :key="job.id"
              :job="job"
              :show-delete="false"
              @open="openJob"
            />
          </div>
        </UCard>
      </div>
    </UPageBody>
  </UPage>
</template>
