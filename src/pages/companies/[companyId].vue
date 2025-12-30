<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import CompanyForm, { type CompanyFormState } from '@/components/company/CompanyForm.vue';
import CompanyNotesInput from '@/components/company/CompanyNotesInput.vue';
import CompanyCanvasEditor from '@/components/company/CompanyCanvasEditor.vue';
import { useCompany } from '@/application/company/useCompany';
import { useCompanyCanvas } from '@/application/company/useCompanyCanvas';
import type { Company } from '@/domain/company/Company';

const route = useRoute();
const { t } = useI18n();

const companyId = computed(() => route.params.companyId as string);
const companyStore = useCompany(companyId.value);
const canvasStore = useCompanyCanvas(companyId.value);

const loading = ref(true);
const errorMessage = ref<string | null>(null);
const savingCompany = ref(false);

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

const toStringArray = (values?: (string | null)[] | null) =>
  (values ?? []).filter((entry): entry is string => typeof entry === 'string');

const headerLinks = computed(() => [
  {
    label: t('companies.detail.actions.back'),
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

const disableActions = computed(() => savingCompany.value);
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

watch(companyId, async () => {
  await loadCompany();
  await canvasStore.load();
});

onMounted(async () => {
  await loadCompany();
  await canvasStore.load();
});

async function loadCompany() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const result = await companyStore.load();
    if (!result) {
      throw new Error(t('companies.detail.errors.notFound'));
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('companies.detail.errors.generic');
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
  errorMessage.value = null;
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
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('companies.detail.errors.generic');
  } finally {
    savingCompany.value = false;
  }
}

function resetCompanyForm() {
  if (company.value) {
    hydrateCompany(company.value);
  }
}

async function saveCanvas() {
  canvasSaving.value = true;
  errorMessage.value = null;
  try {
    await canvasStore.save();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('companies.canvas.errors.save');
  } finally {
    canvasSaving.value = false;
  }
}

async function regenerateCanvas() {
  canvasRegenerating.value = true;
  errorMessage.value = null;
  try {
    const notes = rawNotes.value ? [rawNotes.value] : [];
    await canvasStore.regenerate(notes);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('companies.canvas.errors.generate');
  } finally {
    canvasRegenerating.value = false;
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="form.companyName || t('companies.detail.untitled')"
        :description="t('companies.detail.description')"
        :links="headerLinks"
      />

      <UPageBody>
        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('companies.detail.errors.title')"
          :description="errorMessage"
          class="mb-6"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          @close="errorMessage = null"
        />

        <UCard v-if="loading">
          <USkeleton class="h-8 w-full" />
          <USkeleton class="mt-4 h-32 w-full" />
        </UCard>

        <div v-else class="space-y-8">
          <UCard>
            <div class="mb-6">
              <h2 class="text-xl font-semibold">
                {{ t('companies.detail.sections.companyInfo') }}
              </h2>
              <p class="text-sm text-gray-500">
                {{ t('companies.detail.sections.companyInfoDescription') }}
              </p>
              <p v-if="formattedMeta" class="mt-2 text-xs text-gray-400">
                {{ t('companies.detail.lastUpdated', { date: formattedMeta }) }}
              </p>
            </div>

            <div class="space-y-6">
              <CompanyForm v-model="form" :disabled="disableActions" />
              <CompanyNotesInput v-model="rawNotes" :disabled="disableActions" />
            </div>

            <template #footer>
              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  :label="t('companies.detail.actions.reset')"
                  :disabled="!isDirty || disableActions"
                  @click="resetCompanyForm"
                />
                <UButton
                  color="primary"
                  icon="i-heroicons-check"
                  :label="t('companies.detail.actions.save')"
                  :loading="savingCompany"
                  :disabled="!canSaveCompany"
                  data-testid="company-save-button"
                  @click="saveCompany"
                />
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
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
