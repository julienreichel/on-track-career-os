<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import JobApplicationStatusRow from '@/components/dashboard/JobApplicationStatusRow.vue';
import type { JobApplicationState } from '@/composables/useActiveJobsDashboard';

const props = defineProps<{
  states: JobApplicationState[];
  loading?: boolean;
}>();

const { t } = useI18n();

const showEmpty = computed(() => !props.loading && props.states.length === 0);
</script>

<template>
  <UCard data-testid="active-jobs-card">
    <template #header>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold">{{ t('dashboard.activeJobs.title') }}</h2>
          <p class="text-sm text-dimmed">{{ t('dashboard.activeJobs.description') }}</p>
        </div>
        <UButton
          :label="t('jobList.actions.add')"
          icon="i-heroicons-plus"
          color="primary"
          variant="outline"
          to="/jobs/new"
        />
      </div>
    </template>

    <div v-if="loading">
      <USkeleton />
      <USkeleton />
      <USkeleton />
    </div>

    <div v-else-if="showEmpty">
      {{ t('dashboard.activeJobs.empty') }}
    </div>

    <UPageGrid v-else>
      <JobApplicationStatusRow v-for="state in states" :key="state.jobId" :state="state" />
    </UPageGrid>
  </UCard>
</template>
