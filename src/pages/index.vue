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
            v-if="showCvUpload"
            :title="t('features.cvUpload.title')"
            :description="t('features.cvUpload.description')"
            icon="i-heroicons-arrow-up-tray"
            :to="{ name: 'profile-cv-upload' }"
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
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { useAuthUser } from '@/composables/useAuthUser';
import ProgressGuidanceSection from '@/components/onboarding/ProgressGuidanceSection.vue';
import ActiveJobsCard from '@/components/dashboard/ActiveJobsCard.vue';
import { useBadges } from '@/composables/useBadges';
import BadgeGridCard from '@/components/badges/BadgeGridCard.vue';
import { useActiveJobsDashboard } from '@/composables/useActiveJobsDashboard';
import { useUserProgress } from '@/composables/useUserProgress';

// Home page - requires authentication
const { t } = useI18n();
const { userId } = useAuthUser();

const showCvUpload = ref(false);
const showOnboarding = ref(false);
const experienceRepo = new ExperienceRepository();
const badges = useBadges();
const activeJobs = useActiveJobsDashboard();
const progress = useUserProgress();
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

// Check if user has any experiences when userId is available
watch(userId, async (newUserId) => {
  if (!newUserId) return;

  try {
    const experiences = await experienceRepo.list(newUserId);
    showOnboarding.value = !experiences || experiences.length === 0;
    // Show CV upload only if user has no experiences
    showCvUpload.value = !experiences || experiences.length === 0;
  } catch (error) {
    console.error('Error checking experiences:', error);
    // Show CV upload on error (better UX to show than hide)
    showCvUpload.value = true;
    showOnboarding.value = true;
  }
});
</script>
