<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCompanies } from '@/composables/useCompanies';
import { useCompanyUpload } from '@/composables/useCompanyUpload';
import CompanyForm, { type CompanyFormState } from '@/components/company/CompanyForm.vue';
import CompanyNotesInput from '@/components/company/CompanyNotesInput.vue';
import CompanyUploadStep from '@/components/company/CompanyUploadStep.vue';
import { CompanyService } from '@/domain/company/CompanyService';

const router = useRouter();
const { t } = useI18n();

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
const formError = ref<string | null>(null);

const disableActions = computed(() => saving.value || analyzing.value);

const headerLinks = computed(() => [
  {
    label: t('companies.list.actions.back'),
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
    formError.value = t('companies.form.errors.missingName');
    return;
  }
  if (analyze && !rawNotes.value.trim()) {
    formError.value = t('companies.form.errors.missingNotes');
    return;
  }

  formError.value = null;
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
    formError.value = error instanceof Error ? error.message : t('companies.form.errors.generic');
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
</script>

<template>
  <UContainer>
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

            <UAlert
              v-if="uploadError"
              icon="i-heroicons-exclamation-triangle"
              color="error"
              variant="soft"
              :title="t('companies.upload.errors.title')"
              :description="uploadError"
              class="mb-4"
              :close-button="{
                icon: 'i-heroicons-x-mark-20-solid',
                color: 'error',
                variant: 'link',
              }"
              @close="uploadReset()"
            />

            <CompanyUploadStep
              :selected-file="uploadSelectedFile"
              :is-processing="uploadProcessing"
              :status-message="uploadStatusMessage"
              @file-selected="handleUploadSelected"
            />
          </div>

          <USeparator :label="t('companies.upload.orManual')" />

          <div>
            <UAlert
              v-if="formError"
              icon="i-heroicons-exclamation-triangle"
              color="error"
              variant="soft"
              :title="t('companies.form.errors.title')"
              :description="formError"
              class="mb-6"
              :close-button="{
                icon: 'i-heroicons-x-mark-20-solid',
                color: 'error',
                variant: 'link',
              }"
              @close="formError = null"
            />

            <UCard>
              <CompanyForm
                :model-value="form"
                :disabled="disableActions"
                @update:model-value="updateForm"
              />
              <div class="mt-6">
                <CompanyNotesInput v-model="rawNotes" :disabled="disableActions" />
              </div>

              <template #footer>
                <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <UButton
                    color="secondary"
                    icon="i-heroicons-sparkles"
                    :label="t('companies.form.actions.analyze')"
                    :loading="analyzing"
                    :disabled="disableActions"
                    @click="handleSave(true)"
                  />
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
  </UContainer>
</template>
