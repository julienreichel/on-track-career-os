<template>
  <UCard>
    <template #header>
      <div class="flex flex-col gap-1">
        <p class="text-sm text-dimmed uppercase tracking-wide">
          {{ t('matching.summaryCard.title') }}
        </p>
        <p class="text-lg font-semibold text-highlighted">
          {{ t('matching.summaryCard.summaryHeading') }}
        </p>
      </div>
    </template>

    <div class="space-y-6">
      <section aria-live="polite">
        <p v-if="summaryText" class="text-base text-default leading-relaxed">
          {{ summaryText }}
        </p>
        <p v-else class="text-sm text-dimmed">
          {{ t('matching.summaryCard.emptySummary') }}
        </p>
      </section>

      <div class="grid gap-4 md:grid-cols-3">
        <section
          v-for="section in sections"
          :key="section.key"
          class="flex flex-col gap-2 rounded-lg border border-border/50 p-4"
        >
          <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
            {{ section.title }}
          </p>

          <ul v-if="section.items.length" class="space-y-2">
            <li
              v-for="(item, idx) in section.items"
              :key="`${section.key}-${idx}`"
              class="flex items-start gap-2 text-sm text-default"
            >
              <UBadge color="primary" variant="solid" class="mt-0.5 shrink-0">
                {{ idx + 1 }}
              </UBadge>
              <span class="leading-snug">{{ item }}</span>
            </li>
          </ul>
          <p v-else class="text-sm text-dimmed">
            {{ section.empty }}
          </p>
        </section>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    summaryParagraph?: string | null;
    impactAreas?: string[];
    contributionMap?: string[];
    riskMitigationPoints?: string[];
  }>(),
  {
    summaryParagraph: '',
    impactAreas: () => [],
    contributionMap: () => [],
    riskMitigationPoints: () => [],
  }
);

const { t } = useI18n();

const summaryText = computed(() => props.summaryParagraph?.trim() ?? '');

interface SectionConfig {
  key: string;
  title: string;
  items: string[];
  empty: string;
}

const sections: ComputedRef<SectionConfig[]> = computed(() => [
  {
    key: 'impact',
    title: t('matching.summaryCard.impactAreas'),
    items: props.impactAreas ?? [],
    empty: t('matching.summaryCard.emptyImpactAreas'),
  },
  {
    key: 'contribution',
    title: t('matching.summaryCard.contributionMap'),
    items: props.contributionMap ?? [],
    empty: t('matching.summaryCard.emptyContributionMap'),
  },
  {
    key: 'risks',
    title: t('matching.summaryCard.risks'),
    items: props.riskMitigationPoints ?? [],
    empty: t('matching.summaryCard.emptyRisks'),
  },
]);
</script>
