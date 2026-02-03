<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Company } from '@/domain/company/Company';

interface Props {
  company?: Company | null;
}

const props = withDefaults(defineProps<Props>(), {
  company: null,
});

const { t } = useI18n();

const hasCompany = computed(() => !!props.company);
const label = computed(() => props.company?.companyName || t('companies.card.noName'));
const companyLink = computed(() => (props.company ? `/companies/${props.company.id}` : '#'));
</script>

<template>
  <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
    <template v-if="hasCompany">
      <UBadge color="neutral" variant="outline">
        {{ label }}
      </UBadge>
      <UButton
        size="xs"
        color="primary"
        variant="ghost"
        icon="i-heroicons-arrow-top-right-on-square"
        :label="t('jobs.detail.companyLink.view')"
        :to="companyLink"
      />
    </template>
    <p v-else class="text-sm text-gray-500 dark:text-gray-400">
      {{ t('jobs.detail.companyLink.none') }}
    </p>
  </div>
</template>
