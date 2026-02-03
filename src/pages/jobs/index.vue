<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import JobCard from '@/components/job/JobCard.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import { useGuidance } from '@/composables/useGuidance';
import EmptyStateActionCard from '@/components/guidance/EmptyStateActionCard.vue';
import GuidanceBanner from '@/components/guidance/GuidanceBanner.vue';

const router = useRouter();
const { t } = useI18n();
const jobAnalysis = useJobAnalysis();
const jobs = jobAnalysis.jobs;
const jobNeedingMatch = computed(() => jobs.value.find((job) => job.status !== 'analyzed'));
const matchPromptJobId = computed(() => jobNeedingMatch.value?.id);

const { guidance } = useGuidance('jobs', () => ({
  jobsCount: jobs.value.length,
  jobId: matchPromptJobId.value,
  hasMatchingSummary: matchPromptJobId.value ? false : undefined,
}));

const loading = ref(true);
const hasLoaded = ref(false);
const errorMessage = ref<string | null>(null);
const showDeleteModal = ref(false);
const jobToDelete = ref<string | null>(null);
const searchQuery = ref('');

const headerLinks = computed(() => [
  {
    label: t('jobs.list.actions.viewCompanies'),
    icon: 'i-heroicons-building-office-2',
    to: '/companies',
    variant: 'ghost' as const,
  },
  {
    label: t('common.actions.add'),
    icon: 'i-heroicons-plus',
    to: '/jobs/new',
  },
]);

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};
const sortedJobs = computed(() =>
  [...jobs.value].sort((a, b) => {
    const aTime = toTimestamp(a.updatedAt ?? a.createdAt);
    const bTime = toTimestamp(b.updatedAt ?? b.createdAt);
    return bTime - aTime;
  })
);
const filteredJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const list = sortedJobs.value;
  if (!query) return list;

  return list.filter((job) => {
    const fields = [job.title, job.seniorityLevel, job.roleSummary, job.status];
    return fields.some((field) => field?.toLowerCase().includes(query));
  });
});

async function loadJobs() {
  loading.value = true;
  hasLoaded.value = false;
  errorMessage.value = null;
  try {
    await jobAnalysis.listJobs();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('jobUpload.errors.generic');
  } finally {
    loading.value = false;
    hasLoaded.value = true;
  }
}

onMounted(() => void loadJobs());

function handleOpen(jobId: string) {
  void router.push(`/jobs/${jobId}`);
}

function requestDelete(jobId: string) {
  jobToDelete.value = jobId;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!jobToDelete.value) return;
  try {
    await jobAnalysis.deleteJob(jobToDelete.value);
    showDeleteModal.value = false;
    jobToDelete.value = null;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('jobUpload.errors.generic');
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
  jobToDelete.value = null;
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('features.jobs.title')"
        :description="t('features.jobs.description')"
        :links="headerLinks"
      />

      <UPageBody>
        <GuidanceBanner v-if="guidance.banner" :banner="guidance.banner" class="mb-6" />

        <div v-if="hasLoaded && !loading && jobs.length > 0" class="mb-6">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            :placeholder="t('jobs.list.search.placeholder')"
            size="lg"
            class="w-1/3"
          />
        </div>

        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('jobs.list.errors.generic')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          class="mb-6"
          @close="errorMessage = null"
        />

        <ListSkeletonCards v-if="loading || !hasLoaded" />

        <EmptyStateActionCard v-else-if="guidance.emptyState" :empty-state="guidance.emptyState" />

        <UCard v-else-if="filteredJobs.length === 0">
          <UEmpty :title="t('jobList.search.noResults')" icon="i-heroicons-magnifying-glass">
            <p class="text-sm text-gray-500">
              {{ t('jobList.search.placeholder') }}
            </p>
          </UEmpty>
        </UCard>

        <UPageGrid v-else>
          <JobCard
            v-for="job in filteredJobs"
            :key="job.id"
            :job="job"
            :show-delete="true"
            @open="handleOpen"
            @delete="requestDelete"
          />
        </UPageGrid>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="showDeleteModal"
      :title="t('jobs.delete.title')"
      :description="t('jobs.delete.message')"
    >
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('common.cancel')"
          @click="cancelDelete"
        />
        <UButton color="error" :label="t('common.actions.delete')" @click="confirmDelete" />
      </template>
    </UModal>
  </UContainer>
</template>
