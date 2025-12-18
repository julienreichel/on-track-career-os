<template>
  <UPage>
    <UPageHeader
      :title="t('profile.title')"
      :description="t('profile.description')"
      :links="headerLinks"
    />

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

      <form @submit.prevent="handleSubmit">
        <!-- SECTION A: Core Identity -->
        <UCard v-if="isEditing || hasCoreIdentity" class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.coreIdentity') }}
            </h3>
          </template>

          <div
            class="mb-4 flex flex-col gap-4 border-b border-gray-200 pb-4 dark:border-gray-800 sm:flex-row sm:items-center"
          >
            <UAvatar
              size="xl"
              class="ring-2 ring-primary-100 dark:ring-primary-900"
              :src="photoPreviewUrl || undefined"
              :alt="form.fullName || t('profile.fields.fullName')"
              icon="i-heroicons-user-circle"
            />
            <div class="flex-1 space-y-2">
              <p v-if="!photoPreviewUrl" class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('profile.photo.empty') }}
              </p>
              <div v-if="isEditing" class="flex flex-wrap gap-2">
                <UButton
                  color="primary"
                  variant="soft"
                  icon="i-heroicons-arrow-up-on-square"
                  :loading="uploadingPhoto"
                  :disabled="uploadingPhoto"
                  @click="triggerPhotoPicker"
                >
                  {{ t('profile.photo.upload') }}
                </UButton>
                <UButton
                  v-if="form.profilePhotoKey"
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  :loading="uploadingPhoto"
                  :disabled="uploadingPhoto"
                  @click="handleRemovePhoto"
                >
                  {{ t('profile.photo.remove') }}
                </UButton>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('profile.photo.help') }}
              </p>
              <p v-if="photoError" class="text-sm text-red-500">
                {{ photoError }}
              </p>
            </div>
          </div>

          <input
            ref="photoInputRef"
            type="file"
            class="hidden"
            accept="image/png,image/jpeg,image/webp"
            @change="handlePhotoSelected"
          >

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

        <!-- SECTION: Work Authorization -->
        <UCard v-if="isEditing || hasWorkPermit" class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.workPermit') }}
            </h3>
          </template>

          <div v-if="!isEditing">
            <p v-if="form.workPermitInfo" class="text-base text-gray-900 dark:text-gray-100">
              {{ form.workPermitInfo }}
            </p>
            <p v-else class="text-sm text-gray-500">
              {{ t('profile.fields.workPermitEmpty') }}
            </p>
          </div>

          <div v-else>
            <UFormField :label="t('profile.fields.workPermitInfo')">
              <UTextarea
                v-model="form.workPermitInfo"
                :rows="3"
                :placeholder="t('profile.fields.workPermitPlaceholder')"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- SECTION: Contact Info -->
        <UCard v-if="isEditing || hasContactInfo" class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.contactInfo') }}
            </h3>
          </template>

          <div v-if="!isEditing" class="space-y-4">
            <div v-if="form.primaryEmail">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.primaryEmail') }}
              </label>
              <a
                class="text-primary-600 dark:text-primary-400"
                :href="`mailto:${form.primaryEmail}`"
              >
                {{ form.primaryEmail }}
              </a>
            </div>
            <div v-if="form.primaryPhone">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('profile.fields.primaryPhone') }}
              </label>
              <p class="text-base text-gray-900 dark:text-gray-100">
                {{ form.primaryPhone }}
              </p>
            </div>
          </div>

          <div v-else class="space-y-4">
            <UFormField :label="t('profile.fields.primaryEmail')" :error="emailError">
              <UInput
                v-model="form.primaryEmail"
                type="email"
                :placeholder="t('profile.fields.emailPlaceholder')"
              />
            </UFormField>

            <UFormField :label="t('profile.fields.primaryPhone')" :error="phoneError">
              <UInput
                v-model="form.primaryPhone"
                :placeholder="t('profile.fields.phonePlaceholder')"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- SECTION: Social Links -->
        <UCard v-if="isEditing || hasSocialLinks" class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.socialLinks') }}
            </h3>
          </template>

          <div v-if="!isEditing" class="space-y-2">
            <div v-if="form.socialLinks.length === 0" class="text-sm text-gray-500">
              {{ t('profile.fields.socialLinksEmpty') }}
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="(link, index) in form.socialLinks"
                :key="`social-display-${index}`"
                class="flex items-center gap-2"
              >
                <UIcon name="i-heroicons-link" class="text-primary-500" />
                <a
                  class="text-primary-600 dark:text-primary-400 truncate"
                  target="_blank"
                  rel="noopener noreferrer"
                  :href="formatSocialLink(link)"
                >
                  {{ link }}
                </a>
              </li>
            </ul>
          </div>

          <div v-else>
            <TagInput
              v-model="form.socialLinks"
              :label="t('profile.fields.socialLinks')"
              :placeholder="t('profile.fields.socialUrlPlaceholder')"
              :hint="t('profile.fields.socialLinksHint')"
              color="primary"
            />
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
            :disabled="!form.fullName || loading || hasValidationErrors"
          >
            {{ loading ? t('profile.actions.saving') : t('profile.actions.save') }}
          </UButton>
        </div>
      </form>

      <!-- Management Links Section -->
      <UCard class="mt-6">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ t('profile.sections.relatedPages') }}
          </h3>
        </template>

        <UPageGrid>
          <UPageCard
            v-if="showCvUpload"
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
            :title="t('profile.links.cvDocuments')"
            :description="t('profile.links.cvDocumentsDescription')"
            icon="i-heroicons-document-duplicate"
            to="/cv"
          />

          <UPageCard
            :title="t('profile.links.communication')"
            :description="t('profile.links.communicationDescription')"
            icon="i-heroicons-chat-bubble-left-right"
            disabled
          />
        </UPageGrid>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { useUserProfile } from '@/application/user-profile/useUserProfile';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import { isValidEmail, isValidPhone } from '@/domain/user-profile/contactValidation';
import type { UserProfile, UserProfileUpdateInput } from '@/domain/user-profile/UserProfile';

// Profile page - manage user profile with view/edit mode
const { t } = useI18n();

// Get current authenticated user ID
const { userId } = useAuthUser();

// Profile composable state - will be initialized when userId is available
const profile = ref<UserProfile | null>(null);
const loading = ref(false);
const loadError = ref<string | null>(null);

// Experience check for CV upload
const showCvUpload = ref(false);
const userProfileRepo = new UserProfileRepository();
const experienceRepo = new ExperienceRepository();

// Check if user has any experiences
watch(userId, async (newUserId) => {
  if (!newUserId) return;

  try {
    const userProfile = await userProfileRepo.get(newUserId);
    if (!userProfile) {
      showCvUpload.value = true;
      return;
    }
    const experiences = await experienceRepo.list(userProfile);
    // Show CV upload only if user has no experiences
    showCvUpload.value = !experiences || experiences.length === 0;
  } catch (error) {
    console.error('Error checking experiences:', error);
    // Show CV upload on error (better UX to show than hide)
    showCvUpload.value = true;
  }
});

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
  primaryEmail: string;
  primaryPhone: string;
  workPermitInfo: string;
  profilePhotoKey: string | null;
  goals: string[];
  aspirations: string[];
  personalValues: string[];
  strengths: string[];
  interests: string[];
  skills: string[];
  certifications: string[];
  languages: string[];
  socialLinks: string[];
}

const form = ref<ProfileForm>({
  fullName: '',
  headline: '',
  location: '',
  seniorityLevel: '',
  primaryEmail: '',
  primaryPhone: '',
  workPermitInfo: '',
  profilePhotoKey: null,
  goals: [],
  aspirations: [],
  personalValues: [],
  strengths: [],
  interests: [],
  skills: [],
  certifications: [],
  languages: [],
  socialLinks: [],
});

// Keep a copy of original data for cancel functionality
const originalForm = ref<ProfileForm | null>(null);

// UI state
const isEditing = ref(false);
const error = ref<string | null>(null);
const saveSuccess = ref(false);
const photoPreviewUrl = ref<string | null>(null);
const uploadingPhoto = ref(false);
const photoError = ref<string | null>(null);
const photoInputRef = ref<HTMLInputElement | null>(null);

const profilePhotoService = new ProfilePhotoService();
const directProfileService = new UserProfileService();
const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024; // eslint-disable-line no-magic-numbers
const MAX_PHOTO_SIZE_MB = 5;
const MAX_PHOTO_BYTES = MAX_PHOTO_SIZE_MB * BYTES_PER_MEGABYTE;
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const toSafeString = (value?: string | null) => value ?? '';
const toOptionalString = (value?: string | null) => value ?? undefined;
const toSafeArray = (value?: (string | null | undefined)[] | null) =>
  (value?.filter((entry): entry is string => typeof entry === 'string') ?? []);

const sanitizeSocialLinks = (links: string[]): string[] => {
  const seen = new Set<string>();

  return links
    .map((link) => link.trim())
    .filter((link) => {
      if (!link) return false;
      if (seen.has(link)) return false;
      seen.add(link);
      return true;
    });
};

const formatSocialLink = (link: string): string => {
  if (!link) return '';
  return /^https?:\/\//i.test(link) ? link : `https://${link}`;
};

// Header links
const headerLinks = computed(() => {
  const links = [
    {
      label: t('navigation.backToHome'),
      icon: 'i-heroicons-arrow-left',
      to: '/',
    },
  ];

  if (!isEditing.value) {
    links.push({
      label: t('profile.actions.edit'),
      icon: 'i-heroicons-pencil',
      color: 'primary',
      onClick: startEditing,
      ariaLabel: t('canvas.aria.editProfile'),
    });
  }

  return links;
});

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

const hasContactInfo = computed(() => {
  return !!(form.value.primaryEmail || form.value.primaryPhone);
});

const hasSocialLinks = computed(() => form.value.socialLinks.length > 0);

const hasWorkPermit = computed(() => !!form.value.workPermitInfo);

const emailError = computed<string | undefined>(() => {
  if (!form.value.primaryEmail) return undefined;
  return isValidEmail(form.value.primaryEmail) ? undefined : t('profile.validation.invalidEmail');
});

const phoneError = computed<string | undefined>(() => {
  if (!form.value.primaryPhone) return undefined;
  return isValidPhone(form.value.primaryPhone) ? undefined : t('profile.validation.invalidPhone');
});

const hasValidationErrors = computed(() => {
  return Boolean(emailError.value) || Boolean(phoneError.value);
});

const loadPhotoPreview = async (key: string | null) => {
  if (!key) {
    photoPreviewUrl.value = null;
    return;
  }
  try {
    const url = await profilePhotoService.getSignedUrl(key);
    photoPreviewUrl.value = url || null;
  } catch (err) {
    console.error('[profile] Failed to load photo preview:', err);
    photoPreviewUrl.value = null;
  }
};

const persistProfilePhotoKey = async (key: string | null) => {
  if (!profile.value?.id) return;
  try {
    const updated = await directProfileService.updateUserProfile({
      id: profile.value.id,
      profilePhotoKey: key,
    });
    if (updated) {
      profile.value = updated;
      form.value.profilePhotoKey = updated.profilePhotoKey || null;
      if (originalForm.value) {
        originalForm.value = {
          ...originalForm.value,
          profilePhotoKey: form.value.profilePhotoKey,
        };
      }
    }
  } catch (err) {
    console.error('[profile] Failed to persist photo key:', err);
    photoError.value = t('profile.validation.photoPersistFailed');
  }
};

const triggerPhotoPicker = () => {
  photoInputRef.value?.click();
};

const handlePhotoSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) return;
  photoError.value = null;

  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    photoError.value = t('profile.validation.photoUnsupported');
    return;
  }

  if (file.size > MAX_PHOTO_BYTES) {
    photoError.value = t('profile.validation.photoTooLarge');
    return;
  }

  if (!userId.value) {
    photoError.value = t('profile.validation.photoUserMissing');
    return;
  }

  uploadingPhoto.value = true;
  const previousKey = form.value.profilePhotoKey;
  try {
    const key = await profilePhotoService.upload(userId.value, file);
    await persistProfilePhotoKey(key);
    await loadPhotoPreview(key);
    if (previousKey && previousKey !== key) {
      await profilePhotoService.delete(previousKey);
    }
  } catch (err) {
    console.error('[profile] Photo upload failed:', err);
    photoError.value = t('profile.validation.photoUploadFailed');
  } finally {
    uploadingPhoto.value = false;
  }
};

const handleRemovePhoto = async () => {
  if (!form.value.profilePhotoKey) return;
  uploadingPhoto.value = true;
  photoError.value = null;
  try {
    await profilePhotoService.delete(form.value.profilePhotoKey);
    await persistProfilePhotoKey(null);
    await loadPhotoPreview(null);
  } catch (err) {
    console.error('[profile] Photo removal failed:', err);
    photoError.value = t('profile.validation.photoRemoveFailed');
  } finally {
    uploadingPhoto.value = false;
  }
};

// Load profile data into form
const loadProfileToForm = () => {
  const currentProfile = profile.value;
  if (!currentProfile) return;

  form.value = {
    fullName: toSafeString(currentProfile.fullName),
    headline: toSafeString(currentProfile.headline),
    location: toSafeString(currentProfile.location),
    seniorityLevel: toSafeString(currentProfile.seniorityLevel),
    primaryEmail: toSafeString(currentProfile.primaryEmail),
    primaryPhone: toSafeString(currentProfile.primaryPhone),
    workPermitInfo: toSafeString(currentProfile.workPermitInfo),
    profilePhotoKey: currentProfile.profilePhotoKey || null,
    goals: toSafeArray(currentProfile.goals),
    aspirations: toSafeArray(currentProfile.aspirations),
    personalValues: toSafeArray(currentProfile.personalValues),
    strengths: toSafeArray(currentProfile.strengths),
    interests: toSafeArray(currentProfile.interests),
    skills: toSafeArray(currentProfile.skills),
    certifications: toSafeArray(currentProfile.certifications),
    languages: toSafeArray(currentProfile.languages),
    socialLinks: sanitizeSocialLinks(toSafeArray(currentProfile.socialLinks)),
  };
  // Save original form state for cancel
  originalForm.value = { ...form.value };
  loadPhotoPreview(form.value.profilePhotoKey);
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
const buildProfileUpdateInput = (): UserProfileUpdateInput => {
  const sanitizedLinks = sanitizeSocialLinks(form.value.socialLinks);
  return {
    id: profile.value.id,
    fullName: form.value.fullName,
    headline: toOptionalString(form.value.headline),
    location: toOptionalString(form.value.location),
    seniorityLevel: toOptionalString(form.value.seniorityLevel),
    primaryEmail: toOptionalString(form.value.primaryEmail),
    primaryPhone: toOptionalString(form.value.primaryPhone),
    workPermitInfo: toOptionalString(form.value.workPermitInfo),
    profilePhotoKey: form.value.profilePhotoKey || null,
    goals: form.value.goals,
    aspirations: form.value.aspirations,
    personalValues: form.value.personalValues,
    strengths: form.value.strengths,
    interests: form.value.interests,
    skills: form.value.skills,
    certifications: form.value.certifications,
    languages: form.value.languages,
    socialLinks: sanitizedLinks,
  };
};

const handleSubmit = async () => {
  if (!form.value.fullName || !profile.value?.id || !saveProfile) return;

  error.value = null;
  saveSuccess.value = false;

  const input = buildProfileUpdateInput();

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
