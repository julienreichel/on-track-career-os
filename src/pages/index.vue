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

      <ActiveJobsCard
        v-if="!showOnboarding && showActiveJobs"
        class="mb-6"
        :states="activeJobs.states.value"
        :loading="activeJobs.loading.value"
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
import ActiveJobsCard from '@/components/dashboard/ActiveJobsCard.vue';
import { useBadges } from '@/composables/useBadges';
import BadgeGridCard from '@/components/badges/BadgeGridCard.vue';
import { useActiveJobsDashboard } from '@/composables/useActiveJobsDashboard';
import { useUserProgress } from '@/composables/useUserProgress';

// Home page - requires authentication
const { t } = useI18n();
const showOnboarding = ref(false);
const progress = useUserProgress();
const badges = useBadges({ progress });
const activeJobs = useActiveJobsDashboard({
  materials: {
    cvs: computed(() => progress.snapshot?.value?.cvs ?? []),
    coverLetters: computed(() => progress.snapshot?.value?.coverLetters ?? []),
    speechBlocks: computed(() => progress.snapshot?.value?.speechBlocks ?? []),
  },
});
const welcomeName = computed(
  () => progress.profile.value?.fullName?.trim() || t('home.fallbackName')
);

const showActiveJobs = computed(() => {
  if (progress.state.value?.phase !== 'bonus') {
    return false;
  }
  return activeJobs.loading.value || activeJobs.states.value.length > 0;
});

onMounted(() => {
  void badges.load();
  void activeJobs.load();
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
