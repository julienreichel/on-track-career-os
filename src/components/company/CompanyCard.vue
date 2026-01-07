<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemCard from '@/components/ItemCard.vue';
import type { Company } from '@/domain/company/Company';
import { formatListDate } from '@/utils/formatListDate';

const PRODUCT_PREVIEW_COUNT = 3;

const props = defineProps<{
  company: Company;
}>();

const emit = defineEmits<{
  open: [companyId: string];
  delete: [companyId: string];
}>();

const { t } = useI18n();

const title = computed(() => props.company.companyName || t('companies.card.noName'));
const subtitle = computed(() => {
  const parts = [props.company.industry, props.company.sizeRange].filter(Boolean);
  return parts.join(' • ') || t('companies.card.noIndustry');
});

const description = computed(() => {
  if (props.company.description?.trim()) {
    return props.company.description;
  }
  if (props.company.productsServices?.length) {
    return props.company.productsServices.slice(0, PRODUCT_PREVIEW_COUNT).join(', ');
  }
  return t('companies.card.emptyDescription');
});

const lastUpdated = computed(() =>
  formatListDate(props.company.updatedAt ?? props.company.createdAt)
);

function handleOpen() {
  emit('open', props.company.id);
}

function handleDelete() {
  emit('delete', props.company.id);
}
</script>

<template>
  <ItemCard
    data-testid="company-card"
    :title="title"
    :subtitle="subtitle"
    @edit="handleOpen"
    @delete="handleDelete"
  >
    <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
      <p class="line-clamp-3">
        {{ description }}
      </p>
      <div v-if="lastUpdated" class="text-xs text-gray-500">
        {{ lastUpdated }}
      </div>
    </div>

    <template #badges>
      <UBadge v-if="company.productsServices?.length" color="primary" variant="soft" size="xs">
        {{ t('companies.card.products', { count: company.productsServices.length }) }}
      </UBadge>
      <UBadge v-if="company.targetMarkets?.length" color="neutral" variant="soft" size="xs">
        {{ t('companies.card.markets', { count: company.targetMarkets.length }) }}
      </UBadge>
    </template>

    <template #actions>
      <UButton
        :label="t('companies.card.view')"
        icon="i-heroicons-eye"
        size="xs"
        color="primary"
        variant="soft"
        @click.stop="handleOpen"
      />
    </template>
  </ItemCard>
</template>
