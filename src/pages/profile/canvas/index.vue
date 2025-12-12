<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="t('canvas.page.title')" :description="t('canvas.page.description')" />

      <UPageBody>
        <!-- Error Alert -->
        <UAlert
          v-if="error"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('canvas.messages.error')"
          :description="error"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          @close="error = null"
        />

        <!-- Success Alert -->
        <UAlert
          v-if="successMessage"
          icon="i-heroicons-check-circle"
          color="success"
          variant="soft"
          :title="successMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'success', variant: 'link' }"
          @close="successMessage = null"
        />

        <PersonalCanvasComponent
          :canvas="canvas"
          :loading="loading"
          @generate="handleGenerate"
          @regenerate="handleRegenerate"
          @save="handleSave"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCanvasEngine } from '@/application/personal-canvas/useCanvasEngine';
import { useAuthUser } from '@/composables/useAuthUser';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';

definePageMeta({
  breadcrumbLabel: 'Canvas',
});

const { t } = useI18n();
const {
  canvas,
  loading,
  error: canvasError,
  loadCanvas,
  saveCanvas,
  regenerateCanvas,
} = useCanvasEngine();
const { userId } = useAuthUser();
const userProfileRepo = new UserProfileRepository();
const experienceRepo = new ExperienceRepository();
const storyService = new STARStoryService();

const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const profile = ref<{
  id: string;
  fullName?: string | null;
  headline?: string | null;
  summary?: string | null;
} | null>(null);

// Load profile and canvas when userId is available
watch(
  userId,
  async (newUserId) => {
    if (!newUserId) return;

    try {
      // Load user profile
      profile.value = await userProfileRepo.get(newUserId);

      if (!profile.value) {
        error.value = t('canvas.messages.noProfile');
        return;
      }

      // Try to load existing canvas for this user
      // Query by userId to find user's canvas
      const canvasList = await new PersonalCanvasRepository().list({ userId: { eq: newUserId } });
      if (canvasList && canvasList.length > 0 && canvasList[0]) {
        // User has a canvas, load it
        await loadCanvas(canvasList[0].id);
      }
    } catch (err) {
      console.error('[canvas] Error loading:', err);
      // Don't set error for missing canvas - that's expected for new users
      if (err instanceof Error && !err.message.includes('not found')) {
        error.value = err.message;
      }
    }
  },
  { immediate: true }
);

// Watch for canvas errors
watch(
  () => canvasError.value,
  (newError) => {
    if (newError) {
      error.value = newError;
    }
  }
);

/**
 * Load experiences and stories for AI canvas generation
 * Only called when user clicks Generate or Regenerate
 */
const loadExperiencesAndStories = async () => {
  if (!profile.value) return { experiences: [], stories: [] };

  const userProfile = await userProfileRepo.get(profile.value.id);
  if (!userProfile) return { experiences: [], stories: [] };

  const experiences = await experienceRepo.list(userProfile);

  // Load all stories from all experiences
  const allStories: STARStory[] = [];
  for (const exp of experiences) {
    const expStories = await storyService.getStoriesByExperience(exp);
    allStories.push(...expStories);
  }

  return { experiences, stories: allStories };
};

const handleGenerate = async () => {
  try {
    error.value = null;
    successMessage.value = null;

    if (!profile.value) {
      error.value = t('canvas.messages.noProfile');
      return;
    }

    // Load experiences and stories for canvas generation
    const { experiences, stories } = await loadExperiencesAndStories();

    // Build input for AI generation
    const input: PersonalCanvasInput = {
      profile: {
        fullName: profile.value.fullName || undefined,
        headline: profile.value.headline || undefined,
        summary: profile.value.summary || undefined,
      },
      experiences: experiences.map((exp) => ({
        title: exp.title || undefined,
        company: exp.companyName || undefined,
        startDate: exp.startDate || undefined,
        endDate: exp.endDate || undefined,
        responsibilities: exp.responsibilities?.filter((r): r is string => r !== null) || undefined,
        tasks: exp.tasks?.filter((t): t is string => t !== null) || undefined,
      })),
      stories: stories.value.map((story) => ({
        situation: story.situation || undefined,
        task: story.task || undefined,
        action: story.action || undefined,
        result: story.result || undefined,
        achievements: story.achievements?.filter((a): a is string => a !== null) || undefined,
        kpiSuggestions: story.kpiSuggestions?.filter((k): k is string => k !== null) || undefined,
      })),
    };

    // Generate canvas
    const result = await regenerateCanvas(input);

    if (result) {
      successMessage.value = t('canvas.messages.generated');

      // Save the generated canvas (owner field is auto-set by Amplify auth)
      await saveCanvas({
        userId: profile.value.id,
        customerSegments: result.customerSegments,
        valueProposition: result.valueProposition,
        channels: result.channels,
        customerRelationships: result.customerRelationships,
        keyActivities: result.keyActivities,
        keyResources: result.keyResources,
        keyPartners: result.keyPartners,
        costStructure: result.costStructure,
        revenueStreams: result.revenueStreams,
        lastGeneratedAt: new Date().toISOString(),
        needsUpdate: false,
      });
    }
  } catch (err) {
    console.error('[canvas] Error generating:', err);
    error.value = err instanceof Error ? err.message : t('errors.unknown');
  }
};

const handleRegenerate = async () => {
  try {
    error.value = null;
    successMessage.value = null;

    if (!profile.value) {
      error.value = t('canvas.messages.noProfile');
      return;
    }

    // Load experiences and stories for canvas regeneration
    const { experiences, stories } = await loadExperiencesAndStories();

    // Build input for AI regeneration
    const input: PersonalCanvasInput = {
      profile: {
        fullName: profile.value.fullName || undefined,
        headline: profile.value.headline || undefined,
        summary: profile.value.summary || undefined,
      },
      experiences: experiences.map((exp) => ({
        title: exp.title || undefined,
        company: exp.companyName || undefined,
        startDate: exp.startDate || undefined,
        endDate: exp.endDate || undefined,
        responsibilities: exp.responsibilities?.filter((r): r is string => r !== null) || undefined,
        tasks: exp.tasks?.filter((t): t is string => t !== null) || undefined,
      })),
      stories: stories.map((story) => ({
        situation: story.situation || undefined,
        task: story.task || undefined,
        action: story.action || undefined,
        result: story.result || undefined,
        achievements: story.achievements?.filter((a): a is string => a !== null) || undefined,
        kpiSuggestions: story.kpiSuggestions?.filter((k): k is string => k !== null) || undefined,
      })),
    };

    // Regenerate canvas
    const result = await regenerateCanvas(input);

    if (result) {
      successMessage.value = t('canvas.messages.regenerated');

      // Update existing canvas (owner field is auto-set by Amplify auth)
      await saveCanvas({
        userId: profile.value.id,
        customerSegments: result.customerSegments,
        valueProposition: result.valueProposition,
        channels: result.channels,
        customerRelationships: result.customerRelationships,
        keyActivities: result.keyActivities,
        keyResources: result.keyResources,
        keyPartners: result.keyPartners,
        costStructure: result.costStructure,
        revenueStreams: result.revenueStreams,
        lastGeneratedAt: new Date().toISOString(),
        needsUpdate: false,
      });
    }
  } catch (err) {
    console.error('[canvas] Error regenerating:', err);
    error.value = err instanceof Error ? err.message : t('errors.unknown');
  }
};

const handleSave = async (updates: Partial<PersonalCanvas>) => {
  try {
    error.value = null;
    successMessage.value = null;

    if (!canvas.value) {
      error.value = t('canvas.messages.noCanvas');
      return;
    }

    if (!profile.value) {
      error.value = t('canvas.messages.noProfile');
      return;
    }

    // Merge updates with existing canvas (owner field is auto-set by Amplify auth)
    await saveCanvas({
      userId: canvas.value.userId || profile.value.id,
      customerSegments: updates.customerSegments ?? canvas.value.customerSegments,
      valueProposition: updates.valueProposition ?? canvas.value.valueProposition,
      channels: updates.channels ?? canvas.value.channels,
      customerRelationships: updates.customerRelationships ?? canvas.value.customerRelationships,
      keyActivities: updates.keyActivities ?? canvas.value.keyActivities,
      keyResources: updates.keyResources ?? canvas.value.keyResources,
      keyPartners: updates.keyPartners ?? canvas.value.keyPartners,
      costStructure: updates.costStructure ?? canvas.value.costStructure,
      revenueStreams: updates.revenueStreams ?? canvas.value.revenueStreams,
      lastGeneratedAt: canvas.value.lastGeneratedAt,
      needsUpdate: false,
    });

    successMessage.value = t('canvas.messages.saved');
  } catch (err) {
    console.error('[canvas] Error saving:', err);
    error.value = err instanceof Error ? err.message : t('errors.unknown');
  }
};
</script>
