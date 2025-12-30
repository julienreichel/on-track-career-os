<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Company } from '@/domain/company/Company';

interface Props {
  modelValue?: string | null;
  companies?: Company[];
  loading?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  companies: () => [],
  loading: false,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [string | null];
  create: [];
  clear: [];
}>();

const searchQuery = ref('');
const { t } = useI18n();

const filteredCompanies = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return props.companies;
  }
  return props.companies.filter((company) => {
    const fields = [
      company.companyName,
      company.industry,
      company.sizeRange,
      (company.productsServices ?? []).join(' '),
      (company.targetMarkets ?? []).join(' '),
    ];
    return fields.some((value) => value?.toLowerCase().includes(query));
  });
});
const handleSelect = (companyId: string) => {
  if (props.disabled) {
    return;
  }
  emit('update:modelValue', companyId);
};

const triggerCreate = () => {
  if (props.disabled) {
    return;
  }
  emit('create');
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <UInput
        v-model="searchQuery"
        :placeholder="t('jobDetail.companyLink.selectPlaceholder')"
        :disabled="disabled"
        icon="i-heroicons-magnifying-glass-20-solid"
        data-testid="company-selector-search"
      />
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        :label="t('jobDetail.companyLink.create')"
        :disabled="disabled"
        data-testid="company-selector-create"
        @click="triggerCreate"
      />
    </div>

    <div
      class="max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700"
      data-testid="company-selector-results"
    >
      <div v-if="loading" class="space-y-3 p-4">
        <USkeleton v-for="n in 3" :key="n" class="h-10 w-full" />
      </div>
      <template v-else>
        <div v-if="filteredCompanies.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <button
            v-for="company in filteredCompanies"
            :key="company.id"
            type="button"
            class="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500':
                company.id === modelValue,
            }"
            data-testid="company-selector-option"
            @click="handleSelect(company.id)"
          >
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ company.companyName || t('companies.card.noName') }}
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{
                company.industry ||
                company.sizeRange ||
                (company.productsServices?.[0] ?? t('jobDetail.companyLink.none'))
              }}
            </span>
          </button>
        </div>
        <div v-else class="p-4 text-sm text-gray-500 dark:text-gray-400">
          {{ t('jobDetail.companyLink.empty') }}
        </div>
      </template>
    </div>
  </div>
</template>
