<template>
  <UPage>
    <UPageHeader
      :title="t('home.title', { name: welcomeName })"
      :description="t('home.description')"
    />

    <UPageBody>
      <UCard v-if="showOnboarding" class="mb-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">{{ t('onboarding.actionBox.title') }}</h2>
            <p class="text-sm text-dimmed">
              {{ t('onboarding.actionBox.description') }}
            </p>
          </div>
          <UButton
            color="primary"
            variant="outline"
            icon="i-heroicons-arrow-right"
            :label="t('onboarding.actionBox.cta')"
            :to="{ name: 'onboarding' }"
          />
        </div>
      </UCard>

      <ProgressGuidanceSection v-if="!showOnboarding" class="mb-6" :progress="progress" />

      <PipelineSummaryBar
        v-if="!showOnboarding && showPipelineDashboard"
        class="mb-6"
        :counts="landingPipeline.counts.value"
        :loading="landingPipeline.isLoading.value"
      />

      <FocusJobCards
        v-if="!showOnboarding && showPipelineDashboard && showFocusToday"
        class="mb-6"
        :jobs="landingPipeline.focusJobs.value"
        :stages="kanbanSettings.state.stages.value"
        :loading="landingPipeline.isLoading.value"
      />

      <TodoPreviewSection
        v-if="!showOnboarding && showPipelineDashboard && showTodoPreview"
        class="mb-6"
        :jobs="landingPipeline.todoJobsPreview.value"
        :stages="kanbanSettings.state.stages.value"
        :loading="landingPipeline.isLoading.value"
      />

      <StalledPreviewSection
        v-if="!showOnboarding && showPipelineDashboard && showStalledPreview"
        class="mb-6"
        :jobs="landingPipeline.stalledJobsPreview.value"
        :stages="kanbanSettings.state.stages.value"
        :loading="landingPipeline.isLoading.value"
      />

      <BadgeGridCard
        v-if="badges.earnedBadgeDefinitions.value.length > 0"
        class="mb-6"
        :badges="badges.earnedBadgeDefinitions.value"
      />

      <UCard>
        <UPageGrid>
          <UPageCard
            :title="t('features.profile.title')"
            :description="t('features.profile.description')"
            icon="i-heroicons-user-circle"
            :to="{ name: 'profile' }"
          />
          <UPageCard
            :title="t('features.jobs.title')"
            :description="t('features.jobs.description')"
            icon="i-heroicons-building-office"
            :to="{ name: 'jobs' }"
          />
          <UPageCard
            :title="t('features.applications.title')"
            :description="t('features.applications.description')"
            icon="i-heroicons-document-text"
            :to="{ name: 'applications' }"
          />
        </UPageGrid>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ProgressGuidanceSection from '@/components/onboarding/ProgressGuidanceSection.vue';
import { useBadges } from '@/composables/useBadges';
import BadgeGridCard from '@/components/badges/BadgeGridCard.vue';
import { useUserProgress } from '@/composables/useUserProgress';
import PipelineSummaryBar from '@/components/dashboard/PipelineSummaryBar.vue';
import FocusJobCards from '@/components/dashboard/FocusJobCards.vue';
import TodoPreviewSection from '@/components/dashboard/TodoPreviewSection.vue';
import StalledPreviewSection from '@/components/dashboard/StalledPreviewSection.vue';
import { useKanbanSettings } from '@/application/kanban-settings/useKanbanSettings';
import { useLandingPipelineDashboard } from '@/composables/useLandingPipelineDashboard';

defineOptions({ name: 'HomePage' });

// Home page - requires authentication
const { t } = useI18n();
const showOnboarding = ref(false);
const progress = useUserProgress();
const badges = useBadges({ progress });
const kanbanSettings = useKanbanSettings();
const landingPipeline = useLandingPipelineDashboard({
  kanbanSettings,
});
const welcomeName = computed(
  () => progress.profile.value?.fullName?.trim() || t('home.fallbackName')
);

const showPipelineDashboard = computed(() => progress.state.value?.phase === 'bonus');
const showFocusToday = computed(
  () => landingPipeline.isLoading.value || landingPipeline.focusJobs.value.length > 0
);
const showTodoPreview = computed(
  () =>
    !landingPipeline.isLoading.value &&
    landingPipeline.counts.value.todoCount > 0 &&
    landingPipeline.todoJobsPreview.value.length > 0
);
const showStalledPreview = computed(
  () =>
    !landingPipeline.isLoading.value &&
    landingPipeline.stalledJobsPreview.value.length > 0
);

onMounted(() => {
  void badges.load();
  void landingPipeline.load();
  void progress.load();
});

// Check if user has any experiences when progress inputs are available
watch(
  () => progress.inputs?.value ?? null,
  (inputs) => {
    if (!inputs) {
      return;
    }
    showOnboarding.value = inputs.experienceCount === 0;
  },
  { immediate: true }
);
</script>
