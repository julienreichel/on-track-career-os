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
        <section ref="coreIdentityRef">
          <ProfileSectionCoreIdentity />
        </section>
        <section ref="workPermitRef">
          <ProfileSectionWorkPermit />
        </section>
        <section ref="contactRef">
          <ProfileSectionContact />
        </section>
        <section ref="socialLinksRef">
          <ProfileSectionSocialLinks />
        </section>
        <section v-if="!isLimitedEditing || hasCareerDirection" ref="careerDirectionRef">
          <ProfileSectionCareerDirection />
        </section>
        <section v-if="!isLimitedEditing || hasIdentityValues" ref="identityValuesRef">
          <ProfileSectionIdentityValues />
        </section>
        <section ref="professionalAttributesRef">
          <ProfileSectionProfessionalAttributes />
        </section>

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
            {{ loading ? t('profile.actions.saving') : t('common.save') }}
          </UButton>
        </div>
      </form>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthUser } from '@/composables/useAuthUser';
import { useUserProfile } from '@/application/user-profile/useUserProfile';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';
import { isValidEmail, isValidPhone } from '@/domain/user-profile/contactValidation';
import { useAnalytics } from '@/composables/useAnalytics';
import { useUserProgress } from '@/composables/useUserProgress';
import type { UserProfile, UserProfileUpdateInput } from '@/domain/user-profile/UserProfile';
import { profileFormContextKey } from '@/components/profile/profileFormContext';
import type { ProfileForm } from '@/components/profile/types';
import type { PageHeaderLink } from '@/types/ui';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { userId } = useAuthUser();
const progress = useUserProgress();

const profile = ref<UserProfile | null>(null);
const loading = ref(false);
const loadError = ref<string | null>(null);
const error = ref<string | null>(null);
const saveSuccess = ref(false);

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

const originalForm = ref<ProfileForm | null>(null);
const isEditing = ref(false);
const editingSection = ref<string | null>(null);
const photoPreviewUrl = ref<string | null>(null);
const uploadingPhoto = ref(false);
const photoError = ref<string | null>(null);
const photoInputRef = ref<HTMLInputElement | null>(null);
const coreIdentityRef = ref<HTMLElement | null>(null);
const workPermitRef = ref<HTMLElement | null>(null);
const contactRef = ref<HTMLElement | null>(null);
const socialLinksRef = ref<HTMLElement | null>(null);
const careerDirectionRef = ref<HTMLElement | null>(null);
const identityValuesRef = ref<HTMLElement | null>(null);
const professionalAttributesRef = ref<HTMLElement | null>(null);

const profilePhotoService = new ProfilePhotoService();
const directProfileService = new UserProfileService();
const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024; // eslint-disable-line no-magic-numbers
const MAX_PHOTO_SIZE_MB = 5;
const MAX_PHOTO_BYTES = MAX_PHOTO_SIZE_MB * BYTES_PER_MEGABYTE;
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const toSafeString = (value?: string | null) => value ?? '';
const toSafeArray = (value?: (string | null | undefined)[] | null) =>
  value?.filter((entry): entry is string => typeof entry === 'string') ?? [];

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

const hasCoreIdentity = computed(() => {
  return !!(
    form.value.fullName ||
    form.value.headline ||
    form.value.location ||
    form.value.seniorityLevel
  );
});

const hasCareerDirection = computed(() => form.value.aspirations.length > 0);

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
const missingCoreIdentity = computed(() => !hasCoreIdentity.value);
const missingWorkPermit = computed(() => !hasWorkPermit.value);
const missingContact = computed(() => !hasContactInfo.value);
const missingSocialLinks = computed(() => !hasSocialLinks.value);
const missingCareerDirection = computed(() => !hasCareerDirection.value);
const missingIdentityValues = computed(() => !hasIdentityValues.value);
const missingProfessionalAttributes = computed(() => !hasProfessionalAttributes.value);

const emailError = computed<string | undefined>(() => {
  if (!form.value.primaryEmail) return undefined;
  return isValidEmail(form.value.primaryEmail) ? undefined : t('profile.validation.invalidEmail');
});

const phoneError = computed<string | undefined>(() => {
  if (!form.value.primaryPhone) return undefined;
  return isValidPhone(form.value.primaryPhone) ? undefined : t('profile.validation.invalidPhone');
});

const hasValidationErrors = computed(() => Boolean(emailError.value) || Boolean(phoneError.value));
const needsProfileBasics = computed(
  () => progress.state.value?.phase1?.missing?.includes('profileBasics') ?? false
);
const isLimitedEditing = computed(() => isEditing.value && needsProfileBasics.value);
const sectionEditingEnabled = computed(() => !isEditing.value && !editingSection.value);

let saveProfile: ((input: UserProfileUpdateInput) => Promise<boolean>) | null = null;

const initProfile = (id: string) => {
  const composable = useUserProfile(id);
  profile.value = composable.item.value;
  loading.value = composable.loading.value;
  loadError.value = composable.error.value;
  saveProfile = composable.save;

  void composable.load().then(() => {
    profile.value = composable.item.value;
    loadProfileToForm();
    if (route.query.mode === 'edit') {
      startEditing();
      const removeAfterEach = router.afterEach(() => {
        void scrollToFirstMissingSection();
        removeAfterEach();
      });
      void router.replace({ path: route.path, query: {} });
    }
  });
};

watch(
  userId,
  (newUserId) => {
    if (newUserId) {
      initProfile(newUserId);
    }
  },
  { immediate: true }
);

onMounted(() => {
  void progress.load();
});

const loadProfileToForm = () => {
  if (!profile.value) return;

  form.value = {
    fullName: toSafeString(profile.value.fullName),
    headline: toSafeString(profile.value.headline),
    location: toSafeString(profile.value.location),
    seniorityLevel: toSafeString(profile.value.seniorityLevel),
    primaryEmail: toSafeString(profile.value.primaryEmail),
    primaryPhone: toSafeString(profile.value.primaryPhone),
    workPermitInfo: toSafeString(profile.value.workPermitInfo),
    profilePhotoKey: profile.value.profilePhotoKey || null,
    aspirations: toSafeArray(profile.value.aspirations),
    personalValues: toSafeArray(profile.value.personalValues),
    strengths: toSafeArray(profile.value.strengths),
    interests: toSafeArray(profile.value.interests),
    skills: toSafeArray(profile.value.skills),
    certifications: toSafeArray(profile.value.certifications),
    languages: toSafeArray(profile.value.languages),
    socialLinks: sanitizeSocialLinks(toSafeArray(profile.value.socialLinks)),
  };

  originalForm.value = JSON.parse(JSON.stringify(form.value));
  void loadPhotoPreview(form.value.profilePhotoKey);
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

const startEditing = () => {
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  editingSection.value = null;
  error.value = null;
  saveSuccess.value = false;
  if (originalForm.value) {
    form.value = JSON.parse(JSON.stringify(originalForm.value));
    void loadPhotoPreview(form.value.profilePhotoKey);
  }
};

const scrollToFirstMissingSection = async () => {
  await nextTick();

  const targets: Array<[boolean, HTMLElement | null]> = [
    [missingCoreIdentity.value, coreIdentityRef.value],
    [missingWorkPermit.value, workPermitRef.value],
    [missingContact.value, contactRef.value],
    [missingSocialLinks.value, socialLinksRef.value],
    [
      missingCareerDirection.value && (!isLimitedEditing.value || hasCareerDirection.value),
      careerDirectionRef.value,
    ],
    [
      missingIdentityValues.value && (!isLimitedEditing.value || hasIdentityValues.value),
      identityValuesRef.value,
    ],
    [missingProfessionalAttributes.value, professionalAttributesRef.value],
  ];

  const match = targets.find(([isMissing, element]) => isMissing && element);
  if (!match) return;
  const [, element] = match;
  element?.scrollIntoView({ block: 'start', behavior: 'smooth' });
};

const saveProfileUpdates = async () => {
  if (!profile.value?.id || !saveProfile) return;
  if (hasValidationErrors.value) return;

  loading.value = true;
  error.value = null;

  try {
    const payload: UserProfileUpdateInput = {
      id: profile.value.id,
      fullName: form.value.fullName,
      headline: form.value.headline || null,
      location: form.value.location || null,
      seniorityLevel: form.value.seniorityLevel || null,
      primaryEmail: form.value.primaryEmail || null,
      primaryPhone: form.value.primaryPhone || null,
      workPermitInfo: form.value.workPermitInfo || null,
      aspirations: form.value.aspirations,
      personalValues: form.value.personalValues,
      strengths: form.value.strengths,
      interests: form.value.interests,
      skills: form.value.skills,
      certifications: form.value.certifications,
      languages: form.value.languages,
      socialLinks: sanitizeSocialLinks(form.value.socialLinks),
    };

    const success = await saveProfile(payload);
    if (!success) {
      error.value = t('profile.messages.saveError');
      return;
    }
    saveSuccess.value = true;
    originalForm.value = JSON.parse(JSON.stringify(form.value));

    // Track profile update
    const { captureEvent } = useAnalytics();
    captureEvent('profile_updated');
  } catch (err) {
    console.error('[profile] Save failed:', err);
    error.value = t('profile.messages.saveError');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  await saveProfileUpdates();
  if (!error.value) {
    isEditing.value = false;
    editingSection.value = null;
  }
};

const startSectionEditing = (section: string) => {
  editingSection.value = section;
  error.value = null;
  saveSuccess.value = false;
};

const cancelSectionEditing = () => {
  editingSection.value = null;
  error.value = null;
  saveSuccess.value = false;
  if (originalForm.value) {
    form.value = JSON.parse(JSON.stringify(originalForm.value));
    void loadPhotoPreview(form.value.profilePhotoKey);
  }
};

const saveSectionEditing = async () => {
  if (!editingSection.value) return;
  await saveProfileUpdates();
  if (!error.value) {
    editingSection.value = null;
  }
};

const headerLinks = computed<PageHeaderLink[]>(() => {
  const links: PageHeaderLink[] = [
    {
      label: t('profile.links.backToSummary'),
      icon: 'i-heroicons-user',
      to: '/profile',
    },
  ];

  return links;
});

provide(profileFormContextKey, {
  form,
  isEditing,
  editingSection,
  sectionEditingEnabled,
  loading,
  hasValidationErrors,
  photoPreviewUrl,
  uploadingPhoto,
  photoError,
  photoInputRef,
  hasCoreIdentity,
  hasWorkPermit,
  hasContactInfo,
  hasSocialLinks,
  hasCareerDirection,
  hasIdentityValues,
  hasProfessionalAttributes,
  emailError,
  phoneError,
  startSectionEditing,
  cancelSectionEditing,
  saveSectionEditing,
  triggerPhotoPicker,
  handlePhotoSelected,
  handleRemovePhoto,
  formatSocialLink,
});
</script>
