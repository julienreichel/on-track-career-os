<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { JobApplicationState } from '@/composables/useActiveJobsDashboard';

const props = defineProps<{
  state: JobApplicationState;
}>();

const { t } = useI18n();
const router = useRouter();

const companyLabel = computed(() => props.state.companyName || '-');

const matchTone = computed(() => (props.state.matchStatus === 'ready' ? 'success' : 'warning'));
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

const handleView = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('[data-job-action]')) {
    return;
  }
  void router.push(jobLink.value);
};
</script>

<template>
  <UCard data-testid="active-job-row" class="cursor-pointer" @click="handleView">
    <template #header>
      <div>
        <h3 class="truncate">{{ state.title }}</h3>
        <UBadge :color="matchTone" variant="soft">
          {{ t(state.matchLabelKey, state.matchLabelParams ?? {}) }}
        </UBadge>
        <p class="truncate">{{ companyLabel }}</p>
      </div>
    </template>

    <div>
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

    <template #footer>
      <div class="flex items-center gap-2" data-job-action>
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        :label="t(state.cta.labelKey)"
        :to="state.cta.to"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :label="t('dashboard.activeJobs.cta.viewJob')"
        :to="jobLink"
      />
      </div>
    </template>
  </UCard>
</template>
