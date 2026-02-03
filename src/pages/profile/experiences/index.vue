<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { Experience } from '@/domain/experience/Experience';
import { useAuthUser } from '@/composables/useAuthUser';
import { useGuidance } from '@/composables/useGuidance';
import type { PageHeaderLink } from '@/types/ui';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import GuidanceBanner from '@/components/guidance/GuidanceBanner.vue';
import EmptyStateActionCard from '@/components/guidance/EmptyStateActionCard.vue';

const { t } = useI18n();
const router = useRouter();
const { userId } = useAuthUser();
const experienceRepo = new ExperienceRepository();
const storyService = new STARStoryService();

function toTimestamp(dateString: string | null | undefined): number {
  if (!dateString) {
    return 0;
  }
  const timestamp = new Date(dateString).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

const experiences = ref<Experience[]>([]);
const storyCounts = ref<Record<string, number>>({});
const loading = ref(false);
const hasLoaded = ref(false);
const errorMessage = ref<string | null>(null);
const showDeleteModal = ref(false);
const experienceToDelete = ref<string | null>(null);
const searchQuery = ref('');
const selectedFilter = ref<string>('all');
const { guidance } = useGuidance('profile-experiences', () => ({
  experiencesCount: experiences.value.length,
}));

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToProfile'),
    icon: 'i-heroicons-arrow-left',
    to: '/profile',
  },
  {
    label: t('ingestion.cv.upload.title'),
    icon: 'i-heroicons-arrow-up-tray',
    to: '/profile/cv-upload',
  },
  {
    label: t('common.actions.add'),
    icon: 'i-heroicons-plus',
    to: '/profile/experiences/new',
  },
]);

const sortedExperiences = computed(() =>
  [...experiences.value].sort((a, b) => {
    const aTime = toTimestamp(a.startDate);
    const bTime = toTimestamp(b.startDate);
    return bTime - aTime;
  })
);

const filteredByType = computed(() => {
  if (selectedFilter.value === 'all') {
    return sortedExperiences.value;
  }
  return sortedExperiences.value.filter((exp) => exp.experienceType === selectedFilter.value);
});

const filteredExperiences = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const list = filteredByType.value;
  if (!query) return list;

  return list.filter((experience) => {
    const fields = [
      experience.title,
      experience.companyName,
      experience.experienceType,
      ...(experience.responsibilities || []),
      ...(experience.tasks || []),
    ];
    return fields.some((field) => field?.toLowerCase().includes(query));
  });
});

// Load experiences when userId becomes available
watch(
  userId,
  async (newUserId) => {
    if (newUserId) {
      await loadExperiences();
    }
  },
  { immediate: true }
);

async function loadExperiences() {
  if (!userId.value) {
    return;
  }

  loading.value = true;
  hasLoaded.value = false;
  errorMessage.value = null;

  try {
    const result = await experienceRepo.list(userId.value);
    experiences.value = result || [];
    await loadStoryCounts();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('experiences.errors.loadFailed');
    console.error('[experiences] Error loading experiences:', error);
  } finally {
    loading.value = false;
    hasLoaded.value = true;
  }
}

async function loadStoryCounts() {
  const counts = await Promise.all(
    experiences.value.map(async (experience) => {
      try {
        const stories = await storyService.getStoriesByExperience(experience.id);
        return { id: experience.id, count: stories.length };
      } catch (error) {
        console.error(`[experiences] Error loading stories for ${experience.id}:`, error);
        return { id: experience.id, count: 0 };
      }
    })
  );

  storyCounts.value = counts.reduce<Record<string, number>>((acc, { id, count }) => {
    acc[id] = count;
    return acc;
  }, {});
}

function handleEdit(id: string) {
  if (id) {
    void router.push(`/profile/experiences/${id}`);
  } else {
    void router.push('/profile/experiences/new');
  }
}

function handleDelete(id: string) {
  experienceToDelete.value = id;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!experienceToDelete.value) return;

  try {
    await experienceRepo.delete(experienceToDelete.value);
    experiences.value = experiences.value.filter((exp) => exp.id !== experienceToDelete.value);
    await loadStoryCounts();
    showDeleteModal.value = false;
    experienceToDelete.value = null;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('experiences.errors.deleteFailed');
    console.error('[experiences] Error deleting experience:', error);
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
  experienceToDelete.value = null;
}

function handleViewStories(id: string) {
  void router.push(`/profile/experiences/${id}/stories`);
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('features.experiences.title')"
        :description="t('features.experiences.description')"
        :links="headerLinks"
      />

      <UPageBody>
        <GuidanceBanner v-if="guidance.banner" :banner="guidance.banner" class="mb-4" />

        <!-- Search and Filters -->
        <div
          v-if="hasLoaded && !loading && experiences.length > 0"
          class="mb-6 flex flex-col gap-4 justify-between sm:flex-row sm:items-center"
        >
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            :placeholder="t('experiences.list.search.placeholder')"
            size="lg"
            class="w-1/3"
          />
          <div class="flex gap-2">
            <UButton
              :variant="selectedFilter === 'all' ? 'solid' : 'outline'"
              color="primary"
              @click="selectedFilter = 'all'"
            >
              {{ t('experiences.list.filter.all') }}
            </UButton>
            <UButton
              :variant="selectedFilter === 'work' ? 'solid' : 'outline'"
              color="primary"
              @click="selectedFilter = 'work'"
            >
              {{ t('experiences.list.filter.work') }}
            </UButton>
            <UButton
              :variant="selectedFilter === 'education' ? 'solid' : 'outline'"
              color="primary"
              @click="selectedFilter = 'education'"
            >
              {{ t('experiences.list.filter.education') }}
            </UButton>
            <UButton
              :variant="selectedFilter === 'volunteer' ? 'solid' : 'outline'"
              color="primary"
              @click="selectedFilter = 'volunteer'"
            >
              {{ t('experiences.list.filter.volunteer') }}
            </UButton>
            <UButton
              :variant="selectedFilter === 'project' ? 'solid' : 'outline'"
              color="primary"
              @click="selectedFilter = 'project'"
            >
              {{ t('experiences.list.filter.project') }}
            </UButton>
          </div>
        </div>

        <!-- Error Alert -->
        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('ingestion.cv.upload.errors.unknown')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          @close="errorMessage = null"
        />

        <!-- Loading State -->
        <ListSkeletonCards v-if="loading || !hasLoaded" />

        <!-- Empty State -->
        <EmptyStateActionCard v-else-if="guidance.emptyState" :empty-state="guidance.emptyState" />

        <!-- No Results State -->
        <UCard v-else-if="filteredExperiences.length === 0">
          <UEmpty
            :title="t('experiences.list.search.noResults')"
            icon="i-heroicons-magnifying-glass"
          >
            <p class="text-sm text-gray-500">
              {{ t('experiences.list.search.noResults') }}
            </p>
          </UEmpty>
        </UCard>

        <!-- Experience Cards -->
        <UPageGrid v-else>
          <ExperienceCard
            v-for="experience in filteredExperiences"
            :key="experience.id"
            :experience="experience"
            :story-count="storyCounts[experience.id] ?? 0"
            @view-stories="handleViewStories"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </UPageGrid>
      </UPageBody>
    </UPage>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="showDeleteModal"
      :title="t('experiences.delete.title')"
      :description="t('experiences.delete.message')"
    >
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('common.cancel')"
          @click="cancelDelete"
        />
        <UButton color="error" :label="t('experiences.delete.confirm')" @click="confirmDelete" />
      </template>
    </UModal>
  </UContainer>
</template>
