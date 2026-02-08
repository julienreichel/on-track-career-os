<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCompanies } from '@/composables/useCompanies';
import { useCompanyUpload } from '@/composables/useCompanyUpload';
import CompanyForm, { type CompanyFormState } from '@/components/company/CompanyForm.vue';
import CompanyUploadStep from '@/components/company/CompanyUploadStep.vue';
import { CompanyService } from '@/domain/company/CompanyService';
import { useErrorDisplay } from '@/composables/useErrorDisplay';

const router = useRouter();
const { t } = useI18n();
const { notifyActionError } = useErrorDisplay();

const companies = useCompanies();
const companyService = new CompanyService();
const companyUpload = useCompanyUpload();
const uploadSelectedFile = companyUpload.selectedFile;
const uploadError = companyUpload.errorMessage;
const uploadProcessing = companyUpload.isProcessing;
const uploadStatusMessage = companyUpload.statusMessage;
const uploadHandleFile = companyUpload.handleFileSelected;
const uploadReset = companyUpload.reset;

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
const saving = ref(false);
const analyzing = ref(false);

const disableActions = computed(() => saving.value || analyzing.value);

const headerLinks = computed(() => [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/companies',
  },
]);

const payload = () => ({
  companyName: form.companyName.trim(),
  industry: form.industry.trim() || undefined,
  sizeRange: form.sizeRange.trim() || undefined,
  website: form.website.trim() || undefined,
  productsServices: form.productsServices,
  targetMarkets: form.targetMarkets,
  customerSegments: form.customerSegments,
  description: form.description.trim() || undefined,
  rawNotes: rawNotes.value.trim() || undefined,
});

function updateForm(value: CompanyFormState) {
  Object.assign(form, value);
}

async function handleSave(analyze = false) {
  if (!form.companyName.trim()) {
    notifyActionError({
      title: t('companies.form.errors.title'),
      description: t('companies.form.errors.missingName'),
    });
    return;
  }
  if (analyze && !rawNotes.value.trim()) {
    notifyActionError({
      title: t('companies.form.errors.title'),
      description: t('companies.form.errors.missingNotes'),
    });
    return;
  }

  saving.value = !analyze;
  analyzing.value = analyze;

  try {
    const data = payload();
    const result = analyze
      ? await companyService.createCompany(data, {
          analyze: true,
          rawText: data.rawNotes ?? '',
        })
      : await companies.createCompany(data);

    if (!result) {
      throw new Error(t('companies.form.errors.generic'));
    }

    await router.push(`/companies/${result.id}`);
  } catch (error) {
    notifyActionError({
      title: t('companies.form.errors.title'),
      description: error instanceof Error ? error.message : t('companies.form.errors.generic'),
    });
  } finally {
    saving.value = false;
    analyzing.value = false;
  }
}

async function handleUploadSelected(file: File | null | undefined) {
  const created = await uploadHandleFile(file);
  if (created) {
    await router.push(`/companies/${created.id}`);
  }
}

watch(
  () => uploadError.value,
  (message) => {
    if (!message) return;
    notifyActionError({
      title: t('companies.upload.errors.title'),
      description: message,
    });
    uploadReset();
  }
);
</script>

<template>
  <UPage>
    <UPageHeader
      :title="t('companies.form.title')"
      :description="t('companies.form.description')"
      :links="headerLinks"
    />

    <UPageBody>
      <div class="space-y-6">
        <div>
          <p class="mb-4 text-sm text-gray-500">
            {{ t('companies.upload.helper') }}
          </p>

          <CompanyUploadStep
            :selected-file="uploadSelectedFile"
            :is-processing="uploadProcessing"
            :status-message="uploadStatusMessage"
            @file-selected="handleUploadSelected"
          />
        </div>

        <USeparator :label="t('companies.upload.orManual')" />

        <div>
          <UCard>
            <CompanyForm
              :model-value="form"
              :disabled="disableActions"
              @update:model-value="updateForm"
            />

            <template #footer>
              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <UButton
                  color="primary"
                  icon="i-heroicons-check"
                  :label="t('companies.form.actions.save')"
                  :loading="saving"
                  :disabled="disableActions"
                  @click="handleSave(false)"
                />
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>
