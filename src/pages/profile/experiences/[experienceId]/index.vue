<script setup lang="ts">
import { logError } from '@/utils/logError';
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience, ExperienceCreateInput } from '@/domain/experience/Experience';
import ExperienceForm from '@/components/ExperienceForm.vue';
import type { PageHeaderLink } from '@/types/ui';
import { useErrorDisplay } from '@/composables/useErrorDisplay';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const experienceRepo = new ExperienceRepository();
const { pageError, setPageError, clearPageError, notifyActionError } = useErrorDisplay();

const experience = ref<Experience | null>(null);
const loading = ref(false);
const saving = ref(false);
const isEditing = ref(false);

const experienceId = computed(() => {
  const id = route.params.experienceId;
  return typeof id === 'string' ? id : null;
});

const isNewExperience = computed(() => experienceId.value === 'new' || !experienceId.value);

// Update page meta with company name for breadcrumb
watch(
  () => experience.value,
  (exp) => {
    if (exp?.companyName) {
      // Update route meta for breadcrumb
      route.meta.breadcrumbLabel = exp.companyName;
    } else if (isNewExperience.value) {
      route.meta.breadcrumbLabel = t('common.labels.new');
    }
  },
  { immediate: true }
);

// Load experience if editing
onMounted(async () => {
  if (!isNewExperience.value && experienceId.value) {
    await loadExperience(experienceId.value);
    isEditing.value = false;
  } else if (isNewExperience.value) {
    route.meta.breadcrumbLabel = t('common.labels.new');
    isEditing.value = true;
  }
});

async function loadExperience(id: string) {
  loading.value = true;
  clearPageError();

  try {
    const result = await experienceRepo.get(id);
    if (!result) {
      throw new Error(t('experiences.errors.notFound'));
    }
    experience.value = result;
  } catch (error) {
    const message = error instanceof Error ? error.message : t('experiences.errors.loadFailed');
    setPageError(message);
    logError('[experience] Error loading experience:', error);
  } finally {
    loading.value = false;
  }
}

async function handleSave(data: ExperienceCreateInput) {
  saving.value = true;

  try {
    // Get current user ID
    const user = useNuxtApp().$Amplify.Auth.getCurrentUser();
    const userId = (await user).userId;

    if (isNewExperience.value) {
      // Create new experience
      await experienceRepo.create({
        ...data,
        userId,
      });

      // Track experience creation
      const { useAnalytics } = await import('@/composables/useAnalytics');
      const { captureEvent } = useAnalytics();
      captureEvent('experience_created');

      void router.push('/profile/experiences');
    } else if (experienceId.value) {
      // Update existing experience
      await experienceRepo.update({
        id: experienceId.value,
        ...data,
      });
      await loadExperience(experienceId.value);
      isEditing.value = false;
    }
  } catch (error) {
    notifyActionError({
      title: t('experiences.errors.saveFailed'),
      description: error instanceof Error ? error.message : undefined,
    });
    logError('[experience] Error saving experience:', error);
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  if (isNewExperience.value) {
    void router.push('/profile/experiences');
    return;
  }
  isEditing.value = false;
}

function handleEdit() {
  isEditing.value = true;
}

const displayTitle = computed(() => experience.value?.title || t('experiences.card.noTitle'));
const displayCompany = computed(
  () => experience.value?.companyName || t('experiences.card.noCompany')
);
const displayType = computed(() => {
  const type = experience.value?.experienceType || 'work';
  return t(`experiences.types.${type}`, type);
});
const displayStatus = computed(() => {
  const status = experience.value?.status;
  return status ? t(`experiences.status.${status}`) : t('common.notAvailable');
});
const displayStartDate = computed(() => experience.value?.startDate || t('common.notAvailable'));
const displayEndDate = computed(() => {
  if (!experience.value?.startDate && !experience.value?.endDate) {
    return t('common.notAvailable');
  }
  return experience.value?.endDate || t('experiences.present');
});
const responsibilitiesList = computed(() => experience.value?.responsibilities ?? []);
const tasksList = computed(() => experience.value?.tasks ?? []);

const headerLinks = computed<PageHeaderLink[]>(() => {
  const links: PageHeaderLink[] = [
    {
      label: t('experiences.list.title'),
      icon: 'i-heroicons-arrow-left',
      to: '/profile/experiences',
    },
  ];

  if (!isNewExperience.value && experienceId.value) {
    links.push({
      label: t('experiences.list.viewStories'),
      icon: 'i-heroicons-document-text',
      to: `/profile/experiences/${experienceId.value}/stories`,
    });
  }

  return links;
});
</script>

<template>
  <UPage>
    <UPageHeader
      :title="isNewExperience ? t('experiences.form.createTitle') : displayTitle"
      :description="isNewExperience ? undefined : displayCompany"
      :links="headerLinks"
    />

    <UPageBody>
      <!-- Error Alert -->
      <UAlert
        v-if="pageError"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="t('experiences.errors.loadFailed')"
        :description="pageError"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
        @close="clearPageError"
      />

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary" />
      </div>

      <template v-else>
        <div v-if="!isEditing" class="space-y-6">
          <UCard class="relative">
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-heroicons-pencil"
              :aria-label="t('common.actions.edit')"
              class="absolute right-4 top-4 cursor-pointer"
              @click="handleEdit"
            />
            <div class="space-y-6">
              <div>
                <p class="text-sm text-gray-500">{{ t('experiences.form.title') }}</p>
                <p class="text-base text-gray-900 dark:text-gray-100">{{ displayTitle }}</p>
              </div>

              <div>
                <p class="text-sm text-gray-500">{{ t('experiences.form.company') }}</p>
                <p class="text-base text-gray-900 dark:text-gray-100">{{ displayCompany }}</p>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="text-sm text-gray-500">{{ t('experiences.form.type') }}</p>
                  <p class="text-base text-gray-900 dark:text-gray-100">{{ displayType }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">{{ t('experiences.form.status') }}</p>
                  <p class="text-base text-gray-900 dark:text-gray-100">{{ displayStatus }}</p>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="text-sm text-gray-500">{{ t('experiences.form.startDate') }}</p>
                  <p class="text-base text-gray-900 dark:text-gray-100">
                    {{ displayStartDate }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">{{ t('experiences.form.endDate') }}</p>
                  <p class="text-base text-gray-900 dark:text-gray-100">{{ displayEndDate }}</p>
                </div>
              </div>

              <div>
                <p class="text-sm text-gray-500">
                  {{ t('experiences.form.responsibilities') }}
                </p>
                <ul
                  v-if="responsibilitiesList.length"
                  class="mt-2 list-disc space-y-1 pl-4 text-gray-900 dark:text-gray-100"
                >
                  <li v-for="(item, idx) in responsibilitiesList" :key="idx">{{ item }}</li>
                </ul>
                <p v-else class="mt-2 text-sm text-gray-500">
                  {{ t('experiences.card.noSummary') }}
                </p>
              </div>

              <div>
                <p class="text-sm text-gray-500">{{ t('experiences.form.tasks') }}</p>
                <ul
                  v-if="tasksList.length"
                  class="mt-2 list-disc space-y-1 pl-4 text-gray-900 dark:text-gray-100"
                >
                  <li v-for="(item, idx) in tasksList" :key="idx">{{ item }}</li>
                </ul>
                <p v-else class="mt-2 text-sm text-gray-500">
                  {{ t('experiences.card.noSummary') }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <ExperienceForm
          v-else
          :experience="experience"
          :loading="saving"
          @save="handleSave"
          @cancel="handleCancel"
        />
      </template>
    </UPageBody>
  </UPage>
</template>
