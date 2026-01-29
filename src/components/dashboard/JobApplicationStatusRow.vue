<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemCard from '@/components/ItemCard.vue';
import type { JobApplicationState } from '@/composables/useActiveJobsDashboard';

const props = defineProps<{
  state: JobApplicationState;
}>();

const { t } = useI18n();

const companyLabel = computed(() => props.state.companyName || '-');

const matchTone = computed(() => (props.state.matchStatus === 'ready' ? 'secondary' : 'warning'));

const jobLink = computed(() => `/jobs/${props.state.jobId}`);

const materialItems = computed(() => [
  {
    key: 'cv',
    label: t('dashboard.activeJobs.materials.cv'),
    ready: props.state.materials.cv,
  },
  {
    key: 'coverLetter',
    label: t('dashboard.activeJobs.materials.coverLetter'),
    ready: props.state.materials.coverLetter,
  },
  {
    key: 'speech',
    label: t('dashboard.activeJobs.materials.speech'),
    ready: props.state.materials.speech,
  },
]);
</script>

<template>
  <ItemCard data-testid="active-job-row" :title="state.title" :subtitle="companyLabel">
    <template #badges>
      <UBadge :color="matchTone" variant="outline" size="xs">
        {{ t(state.matchLabelKey, state.matchLabelParams ?? {}) }}
      </UBadge>
    </template>

    <div class="space-y-2">
      <div
        v-for="item in materialItems"
        :key="item.key"
        class="flex flex-wrap items-center gap-4 text-sm text-default"
      >
        <UIcon
          :name="item.ready ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
          :class="item.ready ? 'text-success' : 'text-warning'"
        />
        <span>{{ item.label }}</span>
      </div>
    </div>

    <template #actions>
      <UButton
        size="xs"
        color="primary"
        variant="outline"
        :label="t(state.cta.labelKey)"
        :to="state.cta.to"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        :label="t('dashboard.activeJobs.cta.viewJob')"
        :to="jobLink"
      />
    </template>
  </ItemCard>
</template>
