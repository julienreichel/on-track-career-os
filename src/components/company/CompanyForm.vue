<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import TagInput from '@/components/TagInput.vue';

export interface CompanyFormState {
  companyName: string;
  industry: string;
  sizeRange: string;
  website: string;
  productsServices: string[];
  targetMarkets: string[];
  customerSegments: string[];
  description: string;
}

interface Props {
  modelValue: CompanyFormState;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [CompanyFormState];
}>();

const { t } = useI18n();

const form = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const updateField = <K extends keyof CompanyFormState>(key: K, value: CompanyFormState[K]) => {
  form.value = { ...form.value, [key]: value };
};
</script>

<template>
  <div class="space-y-4">
    <UFormField
      :label="t('companies.form.companyName')"
      :hint="t('companies.form.companyNameHint')"
      required
    >
      <UInput
        :value="form.companyName"
        :placeholder="t('companies.form.companyNamePlaceholder')"
        :disabled="disabled"
        @input="updateField('companyName', ($event.target as HTMLInputElement).value)"
      />
    </UFormField>

    <div class="grid gap-4 md:grid-cols-2">
      <UFormField :label="t('companies.form.industry')" :hint="t('companies.form.industryHint')">
        <UInput
          :value="form.industry"
          :placeholder="t('companies.form.industryPlaceholder')"
          :disabled="disabled"
          @input="updateField('industry', ($event.target as HTMLInputElement).value)"
        />
      </UFormField>

      <UFormField :label="t('companies.form.sizeRange')" :hint="t('companies.form.sizeRangeHint')">
        <UInput
          :value="form.sizeRange"
          :placeholder="t('companies.form.sizeRangePlaceholder')"
          :disabled="disabled"
          @input="updateField('sizeRange', ($event.target as HTMLInputElement).value)"
        />
      </UFormField>
    </div>

    <UFormField :label="t('companies.form.website')">
      <UInput
        :value="form.website"
        :placeholder="t('companies.form.websitePlaceholder')"
        :disabled="disabled"
        type="url"
        @input="updateField('website', ($event.target as HTMLInputElement).value)"
      />
    </UFormField>

    <div class="grid gap-4 md:grid-cols-2">
      <TagInput
        :label="t('companies.form.productsServices')"
        :hint="t('companies.form.productsServicesHint')"
        :placeholder="t('companies.form.productsServicesPlaceholder')"
        :model-value="form.productsServices"
        :disabled="disabled"
        test-id="company-productsServices"
        @update:model-value="updateField('productsServices', $event)"
      />

      <TagInput
        :label="t('companies.form.targetMarkets')"
        :hint="t('companies.form.targetMarketsHint')"
        :placeholder="t('companies.form.targetMarketsPlaceholder')"
        :model-value="form.targetMarkets"
        :disabled="disabled"
        test-id="company-targetMarkets"
        @update:model-value="updateField('targetMarkets', $event)"
      />
    </div>

    <TagInput
      :label="t('companies.form.customerSegments')"
      :hint="t('companies.form.customerSegmentsHint')"
      :placeholder="t('companies.form.customerSegmentsPlaceholder')"
      :model-value="form.customerSegments"
      :disabled="disabled"
      test-id="company-customerSegments"
      @update:model-value="updateField('customerSegments', $event)"
    />

    <UFormField :label="t('companies.form.description')" :hint="t('companies.form.descriptionHint')">
      <UTextarea
        :value="form.description"
        :placeholder="t('companies.form.descriptionPlaceholder')"
        :rows="4"
        :disabled="disabled"
        class="w-full"
        @input="updateField('description', ($event.target as HTMLTextAreaElement).value)"
      />
    </UFormField>
  </div>
</template>
