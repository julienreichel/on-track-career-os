<script setup lang="ts">
import { ref, onMounted, computed, h, resolveComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { TableColumn } from '@nuxt/ui';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { Experience } from '@/domain/experience/Experience';

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');

const { t } = useI18n();
const router = useRouter();
const experienceRepo = new ExperienceRepository();
const storyService = new STARStoryService();

const experiences = ref<Experience[]>([]);
const storyCounts = ref<Record<string, number>>({});
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const showDeleteModal = ref(false);
const experienceToDelete = ref<string | null>(null);

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return t('experiences.present');
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function getStatusBadge(status: string | null | undefined) {
  const statusValue = status || 'draft';
  return {
    draft: { color: 'neutral' as const, label: t('experiences.status.draft') },
    complete: { color: 'success' as const, label: t('experiences.status.complete') },
  }[statusValue];
}

// Table columns configuration using TanStack Table API
const columns = computed<TableColumn<Experience>[]>(() => [
  {
    accessorKey: 'title',
    header: t('experiences.table.title'),
  },
  {
    accessorKey: 'companyName',
    header: t('experiences.table.company'),
  },
  {
    accessorKey: 'startDate',
    header: t('experiences.table.startDate'),
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: 'endDate',
    header: t('experiences.table.endDate'),
    cell: ({ row }) => formatDate(row.original.endDate),
  },
  {
    accessorKey: 'status',
    header: t('experiences.table.status'),
    cell: ({ row }) => {
      const badge = getStatusBadge(row.original.status);
      return h(UBadge, {
        color: badge?.color,
        label: badge?.label,
        size: 'xs',
      });
    },
  },
  {
    id: 'stories',
    header: t('experiences.table.stories'),
    cell: ({ row }) => {
      const count = storyCounts.value?.[row.original.id] ?? 0;
      return h(UBadge, {
        color: count > 0 ? 'primary' : 'neutral',
        label: `${count}`,
        size: 'xs',
      });
    },
  },
  {
    id: 'actions',
    header: t('experiences.table.actions'),
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-2' }, [
        h(UButton, {
          icon: 'i-heroicons-document-text',
          size: 'xs',
          color: 'primary',
          variant: 'ghost',
          'aria-label': t('experiences.list.viewStories'),
          onClick: () => handleViewStories(row.original.id),
        }),
        h(UButton, {
          icon: 'i-heroicons-pencil',
          size: 'xs',
          color: 'neutral',
          variant: 'ghost',
          'aria-label': t('experiences.list.edit'),
          onClick: () => handleEdit(row.original.id),
        }),
        h(UButton, {
          icon: 'i-heroicons-trash',
          size: 'xs',
          color: 'error',
          variant: 'ghost',
          'aria-label': t('experiences.list.delete'),
          onClick: () => handleDelete(row.original.id),
        }),
      ]);
    },
  },
]);

// Load experiences on mount
onMounted(async () => {
  await loadExperiences();
  await loadStoryCounts();
});

async function loadExperiences() {
  loading.value = true;
  errorMessage.value = null;

  try {
    const result = await experienceRepo.list();
    experiences.value = result || [];
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load experiences';
    console.error('[experiences] Error loading experiences:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStoryCounts() {
  // Load story counts for all experiences
  for (const experience of experiences.value) {
    try {
      const stories = await storyService.getStoriesByExperience(experience.id);
      storyCounts.value[experience.id] = stories.length;
    } catch (error) {
      console.error(`[experiences] Error loading stories for ${experience.id}:`, error);
      storyCounts.value[experience.id] = 0;
    }
  }
}

function handleEdit(id: string) {
  if (id) {
    router.push(`/profile/experiences/${id}`);
  } else {
    router.push('/profile/experiences/new');
  }
}

function handleNewExperience() {
  router.push('/profile/experiences/new');
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
    showDeleteModal.value = false;
    experienceToDelete.value = null;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to delete experience';
    console.error('[experiences] Error deleting experience:', error);
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
  experienceToDelete.value = null;
}

function handleViewStories(id: string) {
  router.push(`/profile/experiences/${id}/stories`);
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('features.experiences.title')"
        :description="t('features.experiences.description')"
        :links="[
          {
            label: t('cvUpload.title'),
            icon: 'i-heroicons-arrow-up-tray',
            to: '/profile/cv-upload',
          },
          {
            label: t('experiences.list.addNew'),
            icon: 'i-heroicons-plus',
            onClick: handleNewExperience,
          },
        ]"
      />

      <UPageBody>
        <!-- Error Alert -->
        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('cvUpload.errors.unknown')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
          @close="errorMessage = null"
        />

        <!-- Loading State -->
        <UCard v-if="loading">
          <div class="flex flex-col items-center justify-center py-12 gap-4">
            <USkeleton class="h-8 w-full" />
          </div>
        </UCard>

        <!-- Empty State -->
        <UCard v-else-if="experiences.length === 0">
          <UEmpty :title="t('experiences.list.empty')" icon="i-heroicons-briefcase">
            <template #actions>
              <u-button
                :label="t('experiences.list.addNew')"
                icon="i-heroicons-plus"
                @click="handleNewExperience"
              />
            </template>
          </UEmpty>
        </UCard>

        <!-- Experience Table -->
        <UTable v-else :columns="columns" :data="experiences" :loading="loading" />
      </UPageBody>
    </UPage>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" :title="t('experiences.delete.title')">
      <template #body>
        <p>{{ t('experiences.delete.message') }}</p>
      </template>

      <template #footer>
        <u-button
          color="neutral"
          variant="ghost"
          :label="t('experiences.delete.cancel')"
          @click="cancelDelete"
        />
        <u-button color="error" :label="t('experiences.delete.confirm')" @click="confirmDelete" />
      </template>
    </UModal>
  </UContainer>
</template>
