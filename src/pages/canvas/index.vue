<template>
  <UPage>
    <UPageHeader
      :title="t('canvas.page.title')"
      :description="t('canvas.page.description')"
    />

    <UPageBody>
      <!-- Error Alert -->
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="t('canvas.messages.error')"
        :description="error"
        class="mb-6"
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
        class="mb-6"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'success', variant: 'link' }"
        @close="successMessage = null"
      />

      <UContainer>
        <PersonalCanvasComponent
          :canvas="canvas"
          :loading="loading"
          @generate="handleGenerate"
          @regenerate="handleRegenerate"
          @save="handleSave"
        />
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCanvasEngine } from '@/application/personal-canvas/useCanvasEngine';
import { useAuthUser } from '@/composables/useAuthUser';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';

const { t } = useI18n();
const { canvas, loading, error: canvasError, loadCanvas, saveCanvas, regenerateCanvas } = useCanvasEngine();
const { userId } = useAuthUser();
const userProfileRepo = new UserProfileRepository();

const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const profile = ref<{ id: string; fullName?: string | null; headline?: string | null; summary?: string | null } | null>(null);

// Load profile and canvas when userId is available
watch(userId, async (newUserId) => {
  if (!newUserId) return;

  try {
    // Load user profile
    profile.value = await userProfileRepo.get(newUserId);
    
    if (!profile.value) {
      error.value = t('canvas.messages.noProfile');
      return;
    }

    // Try to load existing canvas for this user
    // For MVP, we use userId as canvas ID (one canvas per user)
    await loadCanvas(newUserId);
  } catch (err) {
    console.error('[canvas] Error loading:', err);
    // Don't set error for missing canvas - that's expected for new users
    if (err instanceof Error && !err.message.includes('not found')) {
      error.value = err.message;
    }
  }
}, { immediate: true });

// Watch for canvas errors
watch(() => canvasError.value, (newError) => {
  if (newError) {
    error.value = newError;
  }
});

const handleGenerate = async () => {
  try {
    error.value = null;
    successMessage.value = null;

    if (!profile.value) {
      error.value = t('canvas.messages.noProfile');
      return;
    }

    // Build input for AI generation
    const input: PersonalCanvasInput = {
      profile: {
        fullName: profile.value.fullName || undefined,
        headline: profile.value.headline || undefined,
        summary: profile.value.summary || undefined,
      },
      experiences: [], // TODO: Load from useExperienceStore when implemented
      stories: [], // TODO: Load from useStoryEngine when implemented
    };

    // Generate canvas
    const result = await regenerateCanvas(input);
    
    if (result) {
      successMessage.value = t('canvas.messages.generated');
      
      // Save the generated canvas
      await saveCanvas({
        userId: profile.value.id,
        valueProposition: result.valueProposition,
        keyActivities: result.keyActivities,
        strengthsAdvantage: result.strengthsAdvantage,
        targetRoles: result.targetRoles,
        channels: result.channels,
        resources: result.resources,
        careerDirection: result.careerDirection,
        painRelievers: result.painRelievers,
        gainCreators: result.gainCreators,
        lastGeneratedAt: new Date().toISOString(),
        needsUpdate: false,
        owner: `${profile.value.id}::${profile.value.id}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
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

    // Build input for AI regeneration
    const input: PersonalCanvasInput = {
      profile: {
        fullName: profile.value.fullName || undefined,
        headline: profile.value.headline || undefined,
        summary: profile.value.summary || undefined,
      },
      experiences: [], // TODO: Load from useExperienceStore when implemented
      stories: [], // TODO: Load from useStoryEngine when implemented
    };

    // Regenerate canvas
    const result = await regenerateCanvas(input);
    
    if (result) {
      successMessage.value = t('canvas.messages.regenerated');
      
      // Update existing canvas
      await saveCanvas({
        userId: profile.value.id,
        valueProposition: result.valueProposition,
        keyActivities: result.keyActivities,
        strengthsAdvantage: result.strengthsAdvantage,
        targetRoles: result.targetRoles,
        channels: result.channels,
        resources: result.resources,
        careerDirection: result.careerDirection,
        painRelievers: result.painRelievers,
        gainCreators: result.gainCreators,
        lastGeneratedAt: new Date().toISOString(),
        needsUpdate: false,
        owner: canvas.value?.owner || `${profile.value.id}::${profile.value.id}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
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

    // Merge updates with existing canvas
    await saveCanvas({
      userId: canvas.value.userId || profile.value.id,
      valueProposition: updates.valueProposition ?? canvas.value.valueProposition,
      keyActivities: updates.keyActivities ?? canvas.value.keyActivities,
      strengthsAdvantage: updates.strengthsAdvantage ?? canvas.value.strengthsAdvantage,
      targetRoles: updates.targetRoles ?? canvas.value.targetRoles,
      channels: updates.channels ?? canvas.value.channels,
      resources: updates.resources ?? canvas.value.resources,
      careerDirection: updates.careerDirection ?? canvas.value.careerDirection,
      painRelievers: updates.painRelievers ?? canvas.value.painRelievers,
      gainCreators: updates.gainCreators ?? canvas.value.gainCreators,
      lastGeneratedAt: canvas.value.lastGeneratedAt,
      needsUpdate: false,
      owner: canvas.value.owner,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    successMessage.value = t('canvas.messages.saved');
  } catch (err) {
    console.error('[canvas] Error saving:', err);
    error.value = err instanceof Error ? err.message : t('errors.unknown');
  }
};
</script>
