<template>
  <UPage>
    <UPageHeader :title="t('profile.title')" :description="t('profile.description')">
      <template #actions>
        <UButton v-if="!isEditing" icon="i-heroicons-pencil" color="primary" @click="startEditing">
          {{ t('profile.actions.edit') }}
        </UButton>
      </template>
    </UPageHeader>

    <UPageBody>
      <UAlert
        v-if="error || loadError"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="error || loadError || ''"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
        @close="
          () => {
            error = null;
            loadError = null;
          }
        "
      />

      <UAlert
        v-if="saveSuccess"
        icon="i-heroicons-check-circle"
        color="success"
        variant="soft"
        :title="t('profile.messages.saveSuccess')"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'success', variant: 'link' }"
        @close="saveSuccess = false"
      />

      <!-- Navigation Links Section -->
      <UCard class="mb-6">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ t('profile.sections.relatedPages') }}
          </h3>
        </template>

        <UPageGrid>
          <UPageCard
            :title="t('profile.links.uploadCv')"
            :description="t('profile.links.uploadCvDescription')"
            icon="i-heroicons-document-arrow-up"
            to="/profile/cv-upload"
          />

          <UPageCard
            :title="t('profile.links.experiences')"
            :description="t('profile.links.experiencesDescription')"
            icon="i-heroicons-briefcase"
            to="/profile/experiences"
          />

          <UPageCard
            :title="t('profile.links.starStories')"
            :description="t('profile.links.starStoriesDescription')"
            icon="i-heroicons-star"
            to="/profile/stories"
          />

          <UPageCard
            :title="t('profile.links.personalCanvas')"
            :description="t('profile.links.personalCanvasDescription')"
            icon="i-heroicons-squares-2x2"
            to="/profile/canvas"
          />

          <UPageCard
            :title="t('profile.links.communication')"
            :description="t('profile.links.communicationDescription')"
            icon="i-heroicons-chat-bubble-left-right"
            disabled
          />
        </UPageGrid>
      </UCard>

      <!-- Edit Button (prominent when not editing) -->
      <div v-if="!isEditing" class="mb-6 flex justify-end">
        <UButton icon="i-heroicons-pencil" color="primary" size="lg" @click="startEditing">
          {{ t('profile.actions.edit') }}
        </UButton>
      </div>

      <form @submit.prevent="handleSubmit">
        <!-- SECTION A: Core Identity -->
        <UCard v-if="isEditing || hasCoreIdentity" class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.coreIdentity') }}
            </h3>
          </template>

          <!-- Display Mode -->
          <div v-if="!isEditing" class="space-y-4">
            <div v-if="form.fullName">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.fullName') }}
                <span class="text-red-500">*</span>
              </label>
              <p class="text-base text-gray-900 dark:text-gray-100">
                {{ form.fullName }}
              </p>
            </div>

            <div v-if="form.headline">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.headline') }}
              </label>
              <p class="text-base text-gray-900 dark:text-gray-100">
                {{ form.headline }}
              </p>
            </div>

            <div v-if="form.location">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.location') }}
              </label>
              <p class="text-base text-gray-900 dark:text-gray-100">
                {{ form.location }}
              </p>
            </div>

            <div v-if="form.seniorityLevel">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.seniorityLevel') }}
              </label>
              <p class="text-base text-gray-900 dark:text-gray-100">
                {{ form.seniorityLevel }}
              </p>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="space-y-4">
            <UFormField :label="t('profile.fields.fullName')" required>
              <UInput
                v-model="form.fullName"
                :placeholder="t('profile.fields.fullNamePlaceholder')"
                required
              />
            </UFormField>

            <UFormField :label="t('profile.fields.headline')">
              <UInput
                v-model="form.headline"
                :placeholder="t('profile.fields.headlinePlaceholder')"
              />
            </UFormField>

            <UFormField :label="t('profile.fields.location')">
              <UInput
                v-model="form.location"
                :placeholder="t('profile.fields.locationPlaceholder')"
              />
            </UFormField>

            <UFormField :label="t('profile.fields.seniorityLevel')">
              <UInput
                v-model="form.seniorityLevel"
                :placeholder="t('profile.fields.seniorityLevelPlaceholder')"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- SECTION B: Career Direction -->
        <UCard v-if="isEditing || hasCareerDirection" class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.careerDirection') }}
            </h3>
          </template>

          <!-- Display Mode -->
          <div v-if="!isEditing" class="space-y-4">
            <div v-if="form.goals.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.goals') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(goal, index) in form.goals"
                  :key="index"
                  color="primary"
                  variant="subtle"
                >
                  {{ goal }}
                </UBadge>
              </div>
            </div>

            <div v-if="form.aspirations.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.aspirations') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(aspiration, index) in form.aspirations"
                  :key="index"
                  color="primary"
                  variant="subtle"
                >
                  {{ aspiration }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="space-y-4">
            <TagInput
              v-model="form.goals"
              :label="t('profile.fields.goals')"
              :placeholder="t('profile.fields.goalsPlaceholder')"
              :hint="t('profile.fields.goalsHint')"
              color="primary"
            />

            <TagInput
              v-model="form.aspirations"
              :label="t('profile.fields.aspirations')"
              :placeholder="t('profile.fields.aspirationsPlaceholder')"
              :hint="t('profile.fields.aspirationsHint')"
              color="primary"
            />
          </div>
        </UCard>

        <!-- SECTION C: Identity & Values -->
        <UCard v-if="isEditing || hasIdentityValues" class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.identityValues') }}
            </h3>
          </template>

          <!-- Display Mode -->
          <div v-if="!isEditing" class="space-y-4">
            <div v-if="form.personalValues.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.personalValues') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(value, index) in form.personalValues"
                  :key="index"
                  color="info"
                  variant="subtle"
                >
                  {{ value }}
                </UBadge>
              </div>
            </div>

            <div v-if="form.strengths.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.strengths') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(strength, index) in form.strengths"
                  :key="index"
                  color="info"
                  variant="subtle"
                >
                  {{ strength }}
                </UBadge>
              </div>
            </div>

            <div v-if="form.interests.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.interests') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(interest, index) in form.interests"
                  :key="index"
                  color="info"
                  variant="subtle"
                >
                  {{ interest }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="space-y-4">
            <TagInput
              v-model="form.personalValues"
              :label="t('profile.fields.personalValues')"
              :placeholder="t('profile.fields.personalValuesPlaceholder')"
              :hint="t('profile.fields.personalValuesHint')"
              color="info"
            />

            <TagInput
              v-model="form.strengths"
              :label="t('profile.fields.strengths')"
              :placeholder="t('profile.fields.strengthsPlaceholder')"
              :hint="t('profile.fields.strengthsHint')"
              color="info"
            />

            <TagInput
              v-model="form.interests"
              :label="t('profile.fields.interests')"
              :placeholder="t('profile.fields.interestsPlaceholder')"
              :hint="t('profile.fields.interestsHint')"
              color="info"
            />
          </div>
        </UCard>

        <!-- SECTION D: Professional Attributes -->
        <UCard v-if="isEditing || hasProfessionalAttributes" class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.professionalAttributes') }}
            </h3>
          </template>

          <!-- Display Mode -->
          <div v-if="!isEditing" class="space-y-4">
            <div v-if="form.skills.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.skills') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(skill, index) in form.skills"
                  :key="index"
                  color="success"
                  variant="subtle"
                >
                  {{ skill }}
                </UBadge>
              </div>
            </div>

            <div v-if="form.certifications.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.certifications') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(cert, index) in form.certifications"
                  :key="index"
                  color="success"
                  variant="subtle"
                >
                  {{ cert }}
                </UBadge>
              </div>
            </div>

            <div v-if="form.languages.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.languages') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(lang, index) in form.languages"
                  :key="index"
                  color="success"
                  variant="subtle"
                >
                  {{ lang }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="space-y-4">
            <TagInput
              v-model="form.skills"
              :label="t('profile.fields.skills')"
              :placeholder="t('profile.fields.skillsPlaceholder')"
              :hint="t('profile.fields.skillsHint')"
              color="success"
            />

            <TagInput
              v-model="form.certifications"
              :label="t('profile.fields.certifications')"
              :placeholder="t('profile.fields.certificationsPlaceholder')"
              :hint="t('profile.fields.certificationsHint')"
              color="success"
            />

            <TagInput
              v-model="form.languages"
              :label="t('profile.fields.languages')"
              :placeholder="t('profile.fields.languagesPlaceholder')"
              :hint="t('profile.fields.languagesHint')"
              color="success"
            />
          </div>
        </UCard>

        <!-- Form Actions -->
        <div v-if="isEditing" class="flex justify-end gap-3">
          <UButton type="button" color="neutral" variant="ghost" @click="cancelEditing">
            {{ t('profile.actions.cancel') }}
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!form.fullName || loading"
          >
            {{ loading ? t('profile.actions.saving') : t('profile.actions.save') }}
          </UButton>
        </div>
      </form>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { useUserProfile } from '@/application/user-profile/useUserProfile';
import type { UserProfile, UserProfileUpdateInput } from '@/domain/user-profile/UserProfile';

// Profile page - manage user profile with view/edit mode
const { t } = useI18n();

// Get current authenticated user ID
const { userId } = useAuthUser();

// Profile composable state - will be initialized when userId is available
const profile = ref<UserProfile | null>(null);
const loading = ref(false);
const loadError = ref<string | null>(null);

// Profile save operation
let saveProfile: ((input: UserProfileUpdateInput) => Promise<boolean>) | null = null;

// Initialize useUserProfile when userId is available
watch(
  userId,
  (newUserId) => {
    if (newUserId) {
      const userProfileComposable = useUserProfile(newUserId);
      profile.value = userProfileComposable.item.value;
      loading.value = userProfileComposable.loading.value;
      loadError.value = userProfileComposable.error.value;
      saveProfile = userProfileComposable.save;

      // Load profile data
      userProfileComposable.load().then(() => {
        profile.value = userProfileComposable.item.value;
        loadProfileToForm();
      });
    }
  },
  { immediate: true }
);

// Form state
interface ProfileForm {
  fullName: string;
  headline: string;
  location: string;
  seniorityLevel: string;
  goals: string[];
  aspirations: string[];
  personalValues: string[];
  strengths: string[];
  interests: string[];
  skills: string[];
  certifications: string[];
  languages: string[];
}

const form = ref<ProfileForm>({
  fullName: '',
  headline: '',
  location: '',
  seniorityLevel: '',
  goals: [],
  aspirations: [],
  personalValues: [],
  strengths: [],
  interests: [],
  skills: [],
  certifications: [],
  languages: [],
});

// Keep a copy of original data for cancel functionality
const originalForm = ref<ProfileForm | null>(null);

// UI state
const isEditing = ref(false);
const error = ref<string | null>(null);
const saveSuccess = ref(false);

// Computed properties to check if sections have content
const hasCoreIdentity = computed(() => {
  return !!(
    form.value.fullName ||
    form.value.headline ||
    form.value.location ||
    form.value.seniorityLevel
  );
});

const hasCareerDirection = computed(() => {
  return form.value.goals.length > 0 || form.value.aspirations.length > 0;
});

const hasIdentityValues = computed(() => {
  return (
    form.value.personalValues.length > 0 ||
    form.value.strengths.length > 0 ||
    form.value.interests.length > 0
  );
});

const hasProfessionalAttributes = computed(() => {
  return (
    form.value.skills.length > 0 ||
    form.value.certifications.length > 0 ||
    form.value.languages.length > 0
  );
});

// Load profile data into form
const loadProfileToForm = () => {
  if (profile.value) {
    form.value = {
      fullName: profile.value.fullName || '',
      headline: profile.value.headline || '',
      location: profile.value.location || '',
      seniorityLevel: profile.value.seniorityLevel || '',
      goals: (profile.value.goals || []).filter((g): g is string => g !== null),
      aspirations: (profile.value.aspirations || []).filter((a): a is string => a !== null),
      personalValues: (profile.value.personalValues || []).filter((v): v is string => v !== null),
      strengths: (profile.value.strengths || []).filter((s): s is string => s !== null),
      interests: (profile.value.interests || []).filter((i): i is string => i !== null),
      skills: (profile.value.skills || []).filter((s): s is string => s !== null),
      certifications: (profile.value.certifications || []).filter((c): c is string => c !== null),
      languages: (profile.value.languages || []).filter((l): l is string => l !== null),
    };
    // Save original form state for cancel
    originalForm.value = { ...form.value };
  }
};

// Edit mode handlers
const startEditing = () => {
  isEditing.value = true;
  error.value = null;
  saveSuccess.value = false;
};

const cancelEditing = () => {
  // Restore original form values
  if (originalForm.value) {
    form.value = { ...originalForm.value };
  }
  isEditing.value = false;
  error.value = null;
};

// Form submission
const handleSubmit = async () => {
  if (!form.value.fullName || !profile.value?.id || !saveProfile) return;

  error.value = null;
  saveSuccess.value = false;

  const input: UserProfileUpdateInput = {
    id: profile.value.id,
    fullName: form.value.fullName,
    headline: form.value.headline || undefined,
    location: form.value.location || undefined,
    seniorityLevel: form.value.seniorityLevel || undefined,
    goals: form.value.goals,
    aspirations: form.value.aspirations,
    personalValues: form.value.personalValues,
    strengths: form.value.strengths,
    interests: form.value.interests,
    skills: form.value.skills,
    certifications: form.value.certifications,
    languages: form.value.languages,
  };

  const success = await saveProfile(input);

  if (success) {
    saveSuccess.value = true;
    isEditing.value = false;
    // Update original form for next edit
    originalForm.value = { ...form.value };
  } else {
    error.value = t('profile.messages.saveError');
  }
};
</script>
