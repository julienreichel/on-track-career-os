<template>
  <UPage>
    <UPageHeader :title="t('profile.title')" :description="t('profile.description')" />

    <UPageBody>
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="soft"
        :title="t('profile.messages.loadError')"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
        @close="error = null"
      />

      <UAlert
        v-if="saveSuccess"
        icon="i-heroicons-check-circle"
        color="green"
        variant="soft"
        :title="t('profile.messages.saveSuccess')"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'green', variant: 'link' }"
        @close="saveSuccess = false"
      />

      <form @submit.prevent="handleSubmit">
        <!-- SECTION A: Core Identity -->
        <UCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.coreIdentity') }}
            </h3>
          </template>

          <div class="space-y-4">
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
        <UCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.careerDirection') }}
            </h3>
          </template>

          <div class="space-y-4">
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
        <UCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.identityValues') }}
            </h3>
          </template>

          <div class="space-y-4">
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
        <UCard class="mb-6">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('profile.sections.professionalAttributes') }}
            </h3>
          </template>

          <div class="space-y-4">
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
        <div class="flex justify-end gap-3">
          <UButton
            type="button"
            color="gray"
            variant="ghost"
            @click="handleCancel"
          >
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
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

// Profile page - manage user profile
const { t } = useI18n();
const router = useRouter();

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

// UI state
const loading = ref(false);
const error = ref<string | null>(null);
const saveSuccess = ref(false);

// Load profile on mount
onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    // TODO: Load profile from API
    // const profile = await userProfileService.getProfile();
    // form.value = { ...profile };
  } catch (err) {
    error.value = t('profile.messages.loadError');
    console.error('Failed to load profile:', err);
  } finally {
    loading.value = false;
  }
});

// Form handlers
const handleSubmit = async () => {
  if (!form.value.fullName) return;

  loading.value = true;
  error.value = null;
  saveSuccess.value = false;

  try {
    // TODO: Save profile via API
    // await userProfileService.saveProfile(form.value);
    saveSuccess.value = true;
    console.log('Profile saved:', form.value);
  } catch (err) {
    error.value = t('profile.messages.saveError');
    console.error('Failed to save profile:', err);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  router.push('/');
};
</script>
