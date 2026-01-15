<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { useUserProfile } from '@/application/user-profile/useUserProfile';
import { isValidEmail, isValidPhone } from '@/domain/user-profile/contactValidation';
import type { ProfileForm } from '@/components/profile/types';
import type { UserProfileUpdateInput } from '@/domain/user-profile/UserProfile';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import ProfileSectionCoreIdentity from '@/components/profile/section/CoreIdentity.vue';
import ProfileSectionWorkPermit from '@/components/profile/section/WorkPermit.vue';
import ProfileSectionContact from '@/components/profile/section/Contact.vue';
import ProfileSectionSocialLinks from '@/components/profile/section/SocialLinks.vue';
import ProfileSectionProfessionalAttributes from '@/components/profile/section/ProfessionalAttributes.vue';

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

const isEditing = ref(true);
const loading = ref(false);
const error = ref<string | null>(null);
const photoPreviewUrl = ref<string | null>(null);
const uploadingPhoto = ref(false);
const photoError = ref<string | null>(null);
const photoInputRef = ref<HTMLInputElement | null>(null);

let saveProfile: ((input: UserProfileUpdateInput) => Promise<boolean>) | null = null;

const normalizeList = (items: Array<string | null> | null | undefined): string[] =>
  Array.isArray(items) ? items.filter((item): item is string => Boolean(item)) : [];

const loadProfile = async (id: string) => {
  const composable = useUserProfile(id);
  saveProfile = composable.save;

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
      goals: normalizeList(profile.goals),
      aspirations: normalizeList(profile.aspirations),
      personalValues: normalizeList(profile.personalValues),
      strengths: normalizeList(profile.strengths),
      interests: normalizeList(profile.interests),
      skills: normalizeList(profile.skills),
      certifications: normalizeList(profile.certifications),
      languages: normalizeList(profile.languages),
      socialLinks: normalizeList(profile.socialLinks),
    };
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
  Boolean(form.value.fullName || form.value.headline || form.value.location || form.value.seniorityLevel)
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

const hasBasics = computed(
  () =>
    Boolean(form.value.fullName?.trim()) &&
    hasContactInfo.value &&
    hasWorkPermit.value &&
    hasSocialLinks.value &&
    hasProfessionalAttributes.value
);

const hasValidationErrors = computed(() => Boolean(emailError.value || phoneError.value));

const triggerPhotoPicker = () => {
  photoError.value = t('onboarding.profile.photoDisabled');
};

const handlePhotoSelected = async () => {
  photoError.value = t('onboarding.profile.photoDisabled');
};

const handleRemovePhoto = async () => {
  photoError.value = t('onboarding.profile.photoDisabled');
};

const handleSave = async () => {
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
      goals: form.value.goals,
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
  <div class="space-y-6">
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

    <ProfileSectionCoreIdentity />
    <ProfileSectionWorkPermit />
    <ProfileSectionContact />
    <ProfileSectionSocialLinks />
    <ProfileSectionProfessionalAttributes />

    <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
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
        :disabled="!hasBasics || hasValidationErrors || loading"
        @click="handleSave"
      />
    </div>
  </div>
</template>
