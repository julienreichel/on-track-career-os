<template>
  <div class="space-y-6">
    <!-- Score Card -->
    <UCard>
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex-1">
          <p class="text-sm text-dimmed uppercase tracking-wide">
            {{ t('matching.summaryCard.overallScore') }}
          </p>
          <div class="mt-2 flex items-baseline gap-3">
            <p class="text-4xl font-bold text-highlighted">{{ overallScore }}</p>
            <p class="text-sm text-dimmed">/100</p>
          </div>
          <UBadge :color="recommendationColor" variant="outline" class="mt-2" size="lg">
            {{ recommendationLabel }}
          </UBadge>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div
            v-for="item in scoreBreakdownItems"
            :key="item.key"
            class="flex flex-col gap-1 rounded-lg border border-border/50 p-3"
          >
            <p class="text-xs text-dimmed uppercase tracking-wide">{{ item.label }}</p>
            <p class="text-xl font-semibold text-highlighted">
              {{ item.value }}<span class="text-sm text-dimmed">/{{ item.max }}</span>
            </p>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Reasoning Highlights -->
    <UCard>
      <template #header>
        <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
          {{ t('matching.summaryCard.reasoning') }}
        </p>
      </template>
      <ul class="space-y-2">
        <li
          v-for="(item, idx) in reasoningHighlights"
          :key="`reasoning-${idx}`"
          class="flex items-start gap-2 text-sm text-default"
        >
          <UIcon name="i-heroicons-light-bulb" class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <span class="leading-snug">{{ item }}</span>
        </li>
      </ul>
    </UCard>

    <!-- Strengths -->
    <UCard>
      <template #header>
        <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
          {{ t('matching.summaryCard.strengths') }}
        </p>
      </template>
      <ul class="space-y-2">
        <li
          v-for="(item, idx) in strengthsForThisRole"
          :key="`strength-${idx}`"
          class="flex items-start gap-2 text-sm text-default"
        >
          <UIcon name="i-heroicons-check-circle" class="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <span class="leading-snug">{{ item }}</span>
        </li>
      </ul>
    </UCard>

    <!-- Skill Match -->
    <UCard>
      <template #header>
        <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
          {{ t('matching.summaryCard.skillMatch') }}
        </p>
      </template>
      <ul class="space-y-2">
        <li
          v-for="(item, idx) in skillMatch"
          :key="`skill-${idx}`"
          class="flex items-start gap-2 text-sm"
        >
          <UBadge
            :color="getSkillTagColor(item)"
            variant="outline"
            size="xs"
            icon="i-heroicons-tag"
            class="mt-0.5 shrink-0"
          >
            {{ getSkillTag(item) }}
          </UBadge>
          <span class="leading-snug text-default">{{ getSkillText(item) }}</span>
        </li>
      </ul>
    </UCard>

    <!-- Risks & Mitigation -->
    <UCard>
      <template #header>
        <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
          {{ t('matching.summaryCard.risks') }}
        </p>
      </template>
      <ul class="space-y-3">
        <li
          v-for="(item, idx) in riskyPoints"
          :key="`risk-${idx}`"
          class="flex flex-col gap-1 rounded-lg bg-warning/5 p-3 text-sm"
        >
          <p class="font-medium text-warning">{{ getRiskPart(item) }}</p>
          <p class="text-default">{{ getMitigationPart(item) }}</p>
        </li>
      </ul>
    </UCard>

    <!-- Impact & Tailoring in 2 columns -->
    <div class="grid gap-6 md:grid-cols-2">
      <UCard>
        <template #header>
          <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
            {{ t('matching.summaryCard.impact') }}
          </p>
        </template>
        <ul class="space-y-2">
          <li
            v-for="(item, idx) in impactOpportunities"
            :key="`impact-${idx}`"
            class="flex items-start gap-2 text-sm text-default"
          >
            <UBadge
              color="neutral"
              variant="outline"
              icon="i-heroicons-hashtag"
              class="mt-0.5 shrink-0"
            >
              {{ idx + 1 }}
            </UBadge>
            <span class="leading-snug">{{ item }}</span>
          </li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
            {{ t('matching.summaryCard.tailoring') }}
          </p>
        </template>
        <ul class="space-y-2">
          <li
            v-for="(item, idx) in tailoringTips"
            :key="`tip-${idx}`"
            class="flex items-start gap-2 text-sm text-default"
          >
            <UIcon name="i-heroicons-sparkles" class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span class="leading-snug">{{ item }}</span>
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    overallScore?: number;
    scoreBreakdown?: {
      skillFit: number;
      experienceFit: number;
      interestFit: number;
      edge: number;
    };
    recommendation?: 'apply' | 'maybe' | 'skip';
    reasoningHighlights?: string[];
    strengthsForThisRole?: string[];
    skillMatch?: string[];
    riskyPoints?: string[];
    impactOpportunities?: string[];
    tailoringTips?: string[];
  }>(),
  {
    overallScore: 0,
    scoreBreakdown: () => ({ skillFit: 0, experienceFit: 0, interestFit: 0, edge: 0 }),
    recommendation: 'maybe',
    reasoningHighlights: () => [],
    strengthsForThisRole: () => [],
    skillMatch: () => [],
    riskyPoints: () => [],
    impactOpportunities: () => [],
    tailoringTips: () => [],
  }
);

const { t } = useI18n();

const scoreBreakdownItems = computed(() => [
  {
    key: 'skill',
    label: t('matching.summaryCard.skillFit'),
    value: props.scoreBreakdown?.skillFit || 0,
    max: 50,
  },
  {
    key: 'experience',
    label: t('matching.summaryCard.experienceFit'),
    value: props.scoreBreakdown?.experienceFit || 0,
    max: 30,
  },
  {
    key: 'interest',
    label: t('matching.summaryCard.interestFit'),
    value: props.scoreBreakdown?.interestFit || 0,
    max: 10,
  },
  {
    key: 'edge',
    label: t('matching.summaryCard.edge'),
    value: props.scoreBreakdown?.edge || 0,
    max: 10,
  },
]);

const recommendationColor = computed(() => {
  switch (props.recommendation) {
    case 'apply':
      return 'secondary';
    case 'maybe':
      return 'warning';
    case 'skip':
      return 'error';
    default:
      return 'neutral';
  }
});

const recommendationLabel = computed(() => {
  return t(`matching.summaryCard.recommendation.${props.recommendation || 'maybe'}`);
});

function getSkillTag(item: string): string {
  const match = item.match(/^\[(\w+)\]/);
  return match?.[1] ?? '';
}

function getSkillText(item: string): string {
  return item.replace(/^\[\w+\]\s*/, '');
}

function getSkillTagColor(item: string): 'secondary' | 'warning' | 'error' | 'neutral' {
  if (item.startsWith('[MATCH]')) return 'secondary';
  if (item.startsWith('[PARTIAL]')) return 'warning';
  if (item.startsWith('[MISSING]')) return 'error';
  if (item.startsWith('[OVER]')) return 'neutral';
  return 'neutral';
}

function getRiskPart(item: string): string {
  const match = item.match(/^Risk:\s*([^.]+)/i);
  return match?.[1] ? `⚠️ ${match[1].trim()}` : item;
}

function getMitigationPart(item: string): string {
  const match = item.match(/Mitigation:\s*(.+)/i);
  return match?.[1] ? `💡 ${match[1].trim()}` : '';
}
</script>
