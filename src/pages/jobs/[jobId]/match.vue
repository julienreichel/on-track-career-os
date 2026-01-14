<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { formatDetailDate } from '@/utils/formatDetailDate';
import MatchingSummaryCard from '@/components/matching/MatchingSummaryCard.vue';
import LinkedCompanyBadge from '@/components/company/LinkedCompanyBadge.vue';
import TailoredMaterialsCard from '@/components/tailoring/TailoredMaterialsCard.vue';
import { useMatchingEngine } from '@/composables/useMatchingEngine';
import { useCompanies } from '@/composables/useCompanies';
import type { PageHeaderLink } from '@/types/ui';
import type { JobDescription } from '@/domain/job-description/JobDescription';

definePageMeta({
  breadcrumbLabel: 'Match',
});

const route = useRoute();
const { t } = useI18n();
const companyStore = useCompanies();

const jobId = computed(() => route.params.jobId as string | undefined);

if (!jobId.value) {
  throw new Error('Job ID is required');
}

const engine = useMatchingEngine(jobId.value);
const job = engine.job ?? ref<JobDescription | null>(null);
const summary = engine.matchingSummary ?? ref(null);

const hasLoadedCompanies = ref(false);

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToList'),
    icon: 'i-heroicons-arrow-left',
    to: '/jobs',
  },
  {
    label: t('jobList.actions.view'),
    icon: 'i-heroicons-briefcase',
    to: jobId.value ? `/jobs/${jobId.value}` : undefined,
  },
  {
    label: isGenerating.value
      ? t('matching.page.actions.generating')
      : hasSummary.value
        ? t('matching.page.actions.regenerate')
        : t('matching.page.actions.generate'),
    icon: 'i-heroicons-sparkles',
    color: 'primary',
    disabled: isGenerating.value || isLoading.value,
    onClick: () => {
      void handleGenerate();
    },
  },
]);

const jobTitle = computed(() => job.value?.title?.trim() || t('jobList.card.noTitle'));
const jobStatus = computed(() => t(`jobList.status.${job.value?.status ?? 'draft'}`));
const formattedUpdatedAt = computed(() => formatDetailDate(job.value?.updatedAt));
const isLoading = computed(() => engine.isLoading.value);
const isGenerating = computed(() => engine.isGenerating.value);
const hasSummary = computed(() => engine.hasSummary.value);
const errorMessage = engine.error;

function parseScoreBreakdown(scoreBreakdown: unknown) {
  if (!scoreBreakdown) {
    return { skillFit: 0, experienceFit: 0, interestFit: 0, edge: 0 };
  }
  if (typeof scoreBreakdown === 'string') {
    return JSON.parse(scoreBreakdown);
  }
  return scoreBreakdown;
}

function safeStringArray(value: unknown): string[] {
  return (value ?? []) as string[];
}

const summaryProps = computed(() => ({
  overallScore: summary.value?.overallScore ?? 0,
  scoreBreakdown: parseScoreBreakdown(summary.value?.scoreBreakdown),
  recommendation: (summary.value?.recommendation as 'apply' | 'maybe' | 'skip') ?? 'maybe',
  reasoningHighlights: safeStringArray(summary.value?.reasoningHighlights),
  strengthsForThisRole: safeStringArray(summary.value?.strengthsForThisRole),
  skillMatch: safeStringArray(summary.value?.skillMatch),
  riskyPoints: safeStringArray(summary.value?.riskyPoints),
  impactOpportunities: safeStringArray(summary.value?.impactOpportunities),
  tailoringTips: safeStringArray(summary.value?.tailoringTips),
}));

const linkedCompany = computed(() => {
  if (!job.value?.companyId) {
    return null;
  }
  return (
    companyStore.rawCompanies.value.find((company) => company.id === job.value?.companyId) ?? null
  );
});

const companyLink = computed(() =>
  job.value?.companyId ? `/companies/${job.value.companyId}` : null
);

const hasCompanySummary = computed(
  () => Boolean(job.value?.roleSummary?.trim()) || Boolean(linkedCompany.value)
);

watch(
  () => job.value?.companyId,
  async (companyId) => {
    if (companyId && !hasLoadedCompanies.value) {
      try {
        await companyStore.listCompanies();
        hasLoadedCompanies.value = true;
      } catch (error) {
        console.error('[matching] Failed to load companies', error);
      }
    }
  }
);

const handleGenerate = async () => {
  try {
    await engine.regenerate();
  } catch (error) {
    console.error('[matching] Failed to regenerate match', error);
  }
};

onMounted(async () => {
  try {
    await engine.load();
  } catch (error) {
    console.error('[matching] Failed to load matching data', error);
  }
});
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="jobTitle"
        :description="t('matching.page.description')"
        :links="headerLinks"
      />

      <UPageBody>
        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('matching.page.states.errorTitle')"
          :description="errorMessage"
          class="mb-6"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          @close="errorMessage = null"
        />

        <UCard v-if="isLoading">
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="mt-4 h-20 w-full" />
          <USkeleton class="mt-4 h-32 w-full" />
        </UCard>

        <template v-else>
          <UCard class="mb-6 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <p class="text-sm text-dimmed">{{ t('jobDetail.meta.status') }}</p>
                <UBadge color="primary" variant="soft" class="mt-1">
                  {{ jobStatus }}
                </UBadge>
              </div>
              <div>
                <p class="text-sm text-dimmed">{{ t('jobDetail.meta.updatedAt') }}</p>
                <p class="mt-1 text-sm text-default">
                  {{ formattedUpdatedAt || t('jobDetail.meta.notAvailable') }}
                </p>
              </div>
              <div v-if="linkedCompany">
                <p class="text-sm text-dimmed">{{ t('jobDetail.meta.companyId') }}</p>
                <div class="mt-1">
                  <LinkedCompanyBadge :company="linkedCompany" />
                </div>
              </div>
              <div v-else-if="companyLink">
                <p class="text-sm text-dimmed">{{ t('jobDetail.meta.companyId') }}</p>
                <UButton
                  class="mt-1"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-arrow-top-right-on-square"
                  :label="t('jobDetail.companyLink.view')"
                  :to="companyLink"
                />
              </div>
            </div>

            <div v-if="job?.roleSummary" class="rounded-lg bg-muted/30 p-4">
              <p class="text-sm font-medium text-highlighted">
                {{ t('jobDetail.fields.roleSummary') }}
              </p>
              <p class="mt-2 text-sm text-default">
                {{ job.roleSummary }}
              </p>
            </div>
            <p v-else-if="!hasCompanySummary" class="text-sm text-dimmed">
              {{ t('matching.page.description') }}
            </p>
          </UCard>

          <UCard v-if="!hasSummary">
            <UEmpty :title="t('matching.page.states.emptyTitle')" icon="i-heroicons-sparkles">
              <p class="text-sm text-dimmed">
                {{ t('matching.page.states.emptyDescription') }}
              </p>
              <template #actions>
                <UButton
                  color="primary"
                  icon="i-heroicons-sparkles"
                  :label="t('matching.page.actions.generate')"
                  :loading="isGenerating"
                  :disabled="isGenerating"
                  data-testid="matching-empty-generate"
                  @click="handleGenerate"
                />
              </template>
            </UEmpty>
          </UCard>

          <TailoredMaterialsCard
            :job="job"
            :matching-summary="summary"
            :existing-materials="engine.existingMaterials.value"
            :summary-loading="isLoading"
            :summary-error="errorMessage"
            description-key="matchDescription"
          />

          <MatchingSummaryCard
            v-if="hasSummary"
            class="mt-6"
            :overall-score="summaryProps.overallScore"
            :score-breakdown="summaryProps.scoreBreakdown"
            :recommendation="summaryProps.recommendation"
            :reasoning-highlights="summaryProps.reasoningHighlights"
            :strengths-for-this-role="summaryProps.strengthsForThisRole"
            :skill-match="summaryProps.skillMatch"
            :risky-points="summaryProps.riskyPoints"
            :impact-opportunities="summaryProps.impactOpportunities"
            :tailoring-tips="summaryProps.tailoringTips"
          />
        </template>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
