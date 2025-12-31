<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import JobCard from '@/components/job/JobCard.vue';

const router = useRouter();
const { t } = useI18n();
const jobAnalysis = useJobAnalysis();

const loading = ref(true);
const errorMessage = ref<string | null>(null);
const showDeleteModal = ref(false);
const jobToDelete = ref<string | null>(null);
const searchQuery = ref('');

const headerLinks = computed(() => [
  {
    label: t('jobList.actions.viewCompanies'),
    icon: 'i-heroicons-building-office-2',
    to: '/companies',
    variant: 'ghost',
  },
  {
    label: t('jobList.actions.add'),
    icon: 'i-heroicons-plus',
    to: '/jobs/new',
  },
]);

const jobs = jobAnalysis.jobs;
const filteredJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return jobs.value;
  }

  return jobs.value.filter((job) => {
    const fields = [job.title, job.seniorityLevel, job.roleSummary, job.status];
    return fields.some((field) => field?.toLowerCase().includes(query));
  });
});

async function loadJobs() {
  loading.value = true;
  errorMessage.value = null;
  try {
    await jobAnalysis.listJobs();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('jobUpload.errors.generic');
  } finally {
    loading.value = false;
  }
}

onMounted(loadJobs);

function handleOpen(jobId: string) {
  router.push(`/jobs/${jobId}`);
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
        <div v-if="!loading && jobs.length > 0" class="mb-6">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            :placeholder="t('jobList.search.placeholder')"
            size="lg"
          />
        </div>

        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('jobUpload.errors.generic')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          class="mb-6"
          @close="errorMessage = null"
        />

        <UCard v-if="loading">
          <USkeleton class="h-8 w-full" />
        </UCard>

        <UCard v-else-if="jobs.length === 0">
          <UEmpty :title="t('jobList.empty.title')" icon="i-heroicons-briefcase">
            <p class="text-sm text-gray-500">{{ t('jobList.empty.description') }}</p>
            <template #actions>
              <UButton
                :label="t('jobList.empty.cta')"
                icon="i-heroicons-plus"
                @click="router.push('/jobs/new')"
              />
            </template>
          </UEmpty>
        </UCard>

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

    <UModal v-model:open="showDeleteModal" :title="t('jobList.delete.title')">
      <template #body>
        <p>{{ t('jobList.delete.message') }}</p>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('jobList.delete.cancel')"
          @click="cancelDelete"
        />
        <UButton color="error" :label="t('jobList.delete.confirm')" @click="confirmDelete" />
      </template>
    </UModal>
  </UContainer>
</template>
