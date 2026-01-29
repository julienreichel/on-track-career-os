<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { useUserProfile } from '@/application/user-profile/useUserProfile';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import { isValidEmail, isValidPhone } from '@/domain/user-profile/contactValidation';
import type { ProfileForm } from '@/components/profile/types';
import type { UserProfileUpdateInput } from '@/domain/user-profile/UserProfile';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import ProfileSectionCoreIdentity from '@/components/profile/section/CoreIdentity.vue';
import ProfileSectionWorkPermit from '@/components/profile/section/WorkPermit.vue';
import ProfileSectionContact from '@/components/profile/section/Contact.vue';
import ProfileSectionSocialLinks from '@/components/profile/section/SocialLinks.vue';
import ProfileSectionProfessionalAttributes from '@/components/profile/section/ProfessionalAttributes.vue';
import StickyFooterCard from '@/components/common/StickyFooterCard.vue';

const emit = defineEmits<{
  complete: [];
  back: [];
}>();

const { t } = useI18n();
const { userId, loadUserId } = useAuthUser();

const form = ref<ProfileForm>({
  fullName: '',
  headline: '',
  location: '',
  seniorityLevel: '',
  primaryEmail: '',
  primaryPhone: '',
  workPermitInfo: '',
  profilePhotoKey: null,
  aspirations: [],
  personalValues: [],
  strengths: [],
  interests: [],
  skills: [],
  certifications: [],
  languages: [],
  socialLinks: [],
});

const isEditing = ref(true);
const loading = ref(false);
const profileLoading = ref(true);
const error = ref<string | null>(null);
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

let saveProfile: ((input: UserProfileUpdateInput) => Promise<boolean>) | null = null;

const normalizeList = (items: Array<string | null> | null | undefined): string[] =>
  Array.isArray(items) ? items.filter((item): item is string => Boolean(item)) : [];

const loadProfile = async (id: string) => {
  profileLoading.value = true;
  const composable = useUserProfile(id);
  saveProfile = composable.save;

  try {
    await composable.load();
    if (composable.item.value) {
      const profile = composable.item.value;
      form.value = {
        fullName: profile.fullName ?? '',
        headline: profile.headline ?? '',
        location: profile.location ?? '',
        seniorityLevel: profile.seniorityLevel ?? '',
        primaryEmail: profile.primaryEmail ?? '',
        primaryPhone: profile.primaryPhone ?? '',
        workPermitInfo: profile.workPermitInfo ?? '',
        profilePhotoKey: profile.profilePhotoKey ?? null,
        aspirations: normalizeList(profile.aspirations),
        personalValues: normalizeList(profile.personalValues),
        strengths: normalizeList(profile.strengths),
        interests: normalizeList(profile.interests),
        skills: normalizeList(profile.skills),
        certifications: normalizeList(profile.certifications),
        languages: normalizeList(profile.languages),
        socialLinks: normalizeList(profile.socialLinks),
      };
      await loadPhotoPreview(form.value.profilePhotoKey);
    }
  } finally {
    profileLoading.value = false;
  }
};

const loadPhotoPreview = async (key: string | null) => {
  if (!key) {
    photoPreviewUrl.value = null;
    return;
  }
  try {
    const url = await profilePhotoService.getSignedUrl(key);
    photoPreviewUrl.value = url || null;
  } catch (err) {
    console.error('[onboarding] Failed to load photo preview:', err);
    photoPreviewUrl.value = null;
  }
};

const persistProfilePhotoKey = async (key: string | null) => {
  if (!userId.value) return;
  try {
    const updated = await directProfileService.updateUserProfile({
      id: userId.value,
      profilePhotoKey: key,
    });
    if (updated) {
      form.value.profilePhotoKey = updated.profilePhotoKey || null;
    }
  } catch (err) {
    console.error('[onboarding] Failed to persist photo key:', err);
    photoError.value = t('profile.validation.photoPersistFailed');
  }
};

watch(
  userId,
  async (id) => {
    if (!id) {
      await loadUserId();
    }
    if (userId.value) {
      await loadProfile(userId.value);
    }
  },
  { immediate: true }
);

const formatSocialLink = (link: string): string =>
  /^https?:\/\//i.test(link) ? link : `https://${link}`;

const hasCoreIdentity = computed(() =>
  Boolean(
    form.value.fullName || form.value.headline || form.value.location || form.value.seniorityLevel
  )
);
const hasWorkPermit = computed(() => Boolean(form.value.workPermitInfo));
const hasContactInfo = computed(() => Boolean(form.value.primaryEmail || form.value.primaryPhone));
const hasSocialLinks = computed(() => form.value.socialLinks.length > 0);
const hasProfessionalAttributes = computed(
  () => form.value.skills.length > 0 || form.value.languages.length > 0
);

const emailError = computed(() => {
  if (!form.value.primaryEmail) return undefined;
  return isValidEmail(form.value.primaryEmail) ? undefined : t('profile.validation.invalidEmail');
});

const phoneError = computed(() => {
  if (!form.value.primaryPhone) return undefined;
  return isValidPhone(form.value.primaryPhone) ? undefined : t('profile.validation.invalidPhone');
});

const hasValidationErrors = computed(() => Boolean(emailError.value || phoneError.value));

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
    console.error('[onboarding] Photo upload failed:', err);
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
    console.error('[onboarding] Photo removal failed:', err);
    photoError.value = t('profile.validation.photoRemoveFailed');
  } finally {
    uploadingPhoto.value = false;
  }
};

const handleSave = async () => {
  if (profileLoading.value) {
    return;
  }
  if (!form.value.fullName?.trim()) {
    error.value = t('onboarding.errors.fullNameRequired');
    return;
  }
  if (hasValidationErrors.value) {
    error.value = t('onboarding.errors.validationFailed');
    return;
  }
  if (!userId.value || !saveProfile) {
    error.value = t('onboarding.errors.missingUser');
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const payload: UserProfileUpdateInput = {
      id: userId.value,
      fullName: form.value.fullName,
      headline: form.value.headline,
      location: form.value.location,
      seniorityLevel: form.value.seniorityLevel,
      primaryEmail: form.value.primaryEmail,
      primaryPhone: form.value.primaryPhone,
      workPermitInfo: form.value.workPermitInfo,
      socialLinks: form.value.socialLinks,
      skills: form.value.skills,
      languages: form.value.languages,
      certifications: form.value.certifications,
      strengths: form.value.strengths,
      interests: form.value.interests,
      aspirations: form.value.aspirations,
      personalValues: form.value.personalValues,
    };

    const saved = await saveProfile(payload);
    if (saved) {
      emit('complete');
    } else {
      error.value = t('onboarding.errors.saveFailed');
    }
  } catch {
    error.value = t('onboarding.errors.saveFailed');
  } finally {
    loading.value = false;
  }
};

provide(profileFormContextKey, {
  form,
  isEditing,
  photoPreviewUrl,
  uploadingPhoto,
  photoError,
  photoInputRef,
  hasCoreIdentity,
  hasWorkPermit,
  hasContactInfo,
  hasSocialLinks,
  hasCareerDirection: computed(() => false),
  hasIdentityValues: computed(() => false),
  hasProfessionalAttributes,
  emailError,
  phoneError,
  triggerPhotoPicker,
  handlePhotoSelected,
  handleRemovePhoto,
  formatSocialLink,
});
</script>

<template>
  <div class="space-y-6 pb-24">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">{{ t('onboarding.steps.profileBasics.title') }}</h2>
      </template>
      <p class="text-sm text-dimmed">{{ t('onboarding.steps.profileBasics.hint') }}</p>
    </UCard>

    <UAlert
      v-if="error"
      icon="i-heroicons-exclamation-triangle"
      color="error"
      variant="soft"
      :title="t('onboarding.errors.title')"
      :description="error"
    />

    <template v-if="profileLoading">
      <UCard class="space-y-3">
        <USkeleton class="h-4 w-40" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-3/4" />
      </UCard>
    </template>
    <template v-else>
      <ProfileSectionCoreIdentity />
      <ProfileSectionWorkPermit />
      <ProfileSectionContact />
      <ProfileSectionSocialLinks />
      <ProfileSectionProfessionalAttributes />
    </template>

    <StickyFooterCard>
      <UButton
        variant="ghost"
        color="neutral"
        :label="t('common.back')"
        @click="emit('back')"
      />
      <UButton
        color="primary"
        :label="t('onboarding.actions.continue')"
        :loading="loading"
        :disabled="loading || profileLoading"
        @click="handleSave"
      />
    </StickyFooterCard>
  </div>
</template>
