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
            <UFormField :label="t('profile.fields.goals')" :hint="t('profile.fields.goalsHint')">
              <UInput
                v-model="goalInput"
                :placeholder="t('profile.fields.goalsPlaceholder')"
                @keydown.enter.prevent="addGoal"
              />
              <div v-if="form.goals.length > 0" class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="(goal, index) in form.goals"
                  :key="index"
                  color="primary"
                  variant="subtle"
                >
                  {{ goal }}
                  <UButton
                    icon="i-heroicons-x-mark-20-solid"
                    size="2xs"
                    color="primary"
                    variant="link"
                    :padded="false"
                    @click="removeGoal(index)"
                  />
                </UBadge>
              </div>
            </UFormField>

            <UFormField
              :label="t('profile.fields.aspirations')"
              :hint="t('profile.fields.aspirationsHint')"
            >
              <UInput
                v-model="aspirationInput"
                :placeholder="t('profile.fields.aspirationsPlaceholder')"
                @keydown.enter.prevent="addAspiration"
              />
              <div v-if="form.aspirations.length > 0" class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="(aspiration, index) in form.aspirations"
                  :key="index"
                  color="primary"
                  variant="subtle"
                >
                  {{ aspiration }}
                  <UButton
                    icon="i-heroicons-x-mark-20-solid"
                    size="2xs"
                    color="primary"
                    variant="link"
                    :padded="false"
                    @click="removeAspiration(index)"
                  />
                </UBadge>
              </div>
            </UFormField>
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
            <UFormField
              :label="t('profile.fields.personalValues')"
              :hint="t('profile.fields.personalValuesHint')"
            >
              <UInput
                v-model="personalValueInput"
                :placeholder="t('profile.fields.personalValuesPlaceholder')"
                @keydown.enter.prevent="addPersonalValue"
              />
              <div v-if="form.personalValues.length > 0" class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="(value, index) in form.personalValues"
                  :key="index"
                  color="blue"
                  variant="subtle"
                >
                  {{ value }}
                  <UButton
                    icon="i-heroicons-x-mark-20-solid"
                    size="2xs"
                    color="blue"
                    variant="link"
                    :padded="false"
                    @click="removePersonalValue(index)"
                  />
                </UBadge>
              </div>
            </UFormField>

            <UFormField
              :label="t('profile.fields.strengths')"
              :hint="t('profile.fields.strengthsHint')"
            >
              <UInput
                v-model="strengthInput"
                :placeholder="t('profile.fields.strengthsPlaceholder')"
                @keydown.enter.prevent="addStrength"
              />
              <div v-if="form.strengths.length > 0" class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="(strength, index) in form.strengths"
                  :key="index"
                  color="blue"
                  variant="subtle"
                >
                  {{ strength }}
                  <UButton
                    icon="i-heroicons-x-mark-20-solid"
                    size="2xs"
                    color="blue"
                    variant="link"
                    :padded="false"
                    @click="removeStrength(index)"
                  />
                </UBadge>
              </div>
            </UFormField>

            <UFormField
              :label="t('profile.fields.interests')"
              :hint="t('profile.fields.interestsHint')"
            >
              <UInput
                v-model="interestInput"
                :placeholder="t('profile.fields.interestsPlaceholder')"
                @keydown.enter.prevent="addInterest"
              />
              <div v-if="form.interests.length > 0" class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="(interest, index) in form.interests"
                  :key="index"
                  color="blue"
                  variant="subtle"
                >
                  {{ interest }}
                  <UButton
                    icon="i-heroicons-x-mark-20-solid"
                    size="2xs"
                    color="blue"
                    variant="link"
                    :padded="false"
                    @click="removeInterest(index)"
                  />
                </UBadge>
              </div>
            </UFormField>
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
            <UFormField :label="t('profile.fields.skills')" :hint="t('profile.fields.skillsHint')">
              <UInput
                v-model="skillInput"
                :placeholder="t('profile.fields.skillsPlaceholder')"
                @keydown.enter.prevent="addSkill"
              />
              <div v-if="form.skills.length > 0" class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="(skill, index) in form.skills"
                  :key="index"
                  color="green"
                  variant="subtle"
                >
                  {{ skill }}
                  <UButton
                    icon="i-heroicons-x-mark-20-solid"
                    size="2xs"
                    color="green"
                    variant="link"
                    :padded="false"
                    @click="removeSkill(index)"
                  />
                </UBadge>
              </div>
            </UFormField>

            <UFormField
              :label="t('profile.fields.certifications')"
              :hint="t('profile.fields.certificationsHint')"
            >
              <UInput
                v-model="certificationInput"
                :placeholder="t('profile.fields.certificationsPlaceholder')"
                @keydown.enter.prevent="addCertification"
              />
              <div v-if="form.certifications.length > 0" class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="(cert, index) in form.certifications"
                  :key="index"
                  color="green"
                  variant="subtle"
                >
                  {{ cert }}
                  <UButton
                    icon="i-heroicons-x-mark-20-solid"
                    size="2xs"
                    color="green"
                    variant="link"
                    :padded="false"
                    @click="removeCertification(index)"
                  />
                </UBadge>
              </div>
            </UFormField>

            <UFormField
              :label="t('profile.fields.languages')"
              :hint="t('profile.fields.languagesHint')"
            >
              <UInput
                v-model="languageInput"
                :placeholder="t('profile.fields.languagesPlaceholder')"
                @keydown.enter.prevent="addLanguage"
              />
              <div v-if="form.languages.length > 0" class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="(language, index) in form.languages"
                  :key="index"
                  color="green"
                  variant="subtle"
                >
                  {{ language }}
                  <UButton
                    icon="i-heroicons-x-mark-20-solid"
                    size="2xs"
                    color="green"
                    variant="link"
                    :padded="false"
                    @click="removeLanguage(index)"
                  />
                </UBadge>
              </div>
            </UFormField>
          </div>
        </UCard>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3">
          <UButton type="button" color="gray" variant="ghost" @click="handleCancel">
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

// Input fields for array values
const goalInput = ref('');
const aspirationInput = ref('');
const personalValueInput = ref('');
const strengthInput = ref('');
const interestInput = ref('');
const skillInput = ref('');
const certificationInput = ref('');
const languageInput = ref('');

// UI state
const loading = ref(false);
const error = ref<string | null>(null);
const saveSuccess = ref(false);

// Array management functions
const addGoal = () => {
  if (goalInput.value.trim()) {
    form.value.goals.push(goalInput.value.trim());
    goalInput.value = '';
  }
};

const removeGoal = (index: number) => {
  form.value.goals.splice(index, 1);
};

const addAspiration = () => {
  if (aspirationInput.value.trim()) {
    form.value.aspirations.push(aspirationInput.value.trim());
    aspirationInput.value = '';
  }
};

const removeAspiration = (index: number) => {
  form.value.aspirations.splice(index, 1);
};

const addPersonalValue = () => {
  if (personalValueInput.value.trim()) {
    form.value.personalValues.push(personalValueInput.value.trim());
    personalValueInput.value = '';
  }
};

const removePersonalValue = (index: number) => {
  form.value.personalValues.splice(index, 1);
};

const addStrength = () => {
  if (strengthInput.value.trim()) {
    form.value.strengths.push(strengthInput.value.trim());
    strengthInput.value = '';
  }
};

const removeStrength = (index: number) => {
  form.value.strengths.splice(index, 1);
};

const addInterest = () => {
  if (interestInput.value.trim()) {
    form.value.interests.push(interestInput.value.trim());
    interestInput.value = '';
  }
};

const removeInterest = (index: number) => {
  form.value.interests.splice(index, 1);
};

const addSkill = () => {
  if (skillInput.value.trim()) {
    form.value.skills.push(skillInput.value.trim());
    skillInput.value = '';
  }
};

const removeSkill = (index: number) => {
  form.value.skills.splice(index, 1);
};

const addCertification = () => {
  if (certificationInput.value.trim()) {
    form.value.certifications.push(certificationInput.value.trim());
    certificationInput.value = '';
  }
};

const removeCertification = (index: number) => {
  form.value.certifications.splice(index, 1);
};

const addLanguage = () => {
  if (languageInput.value.trim()) {
    form.value.languages.push(languageInput.value.trim());
    languageInput.value = '';
  }
};

const removeLanguage = (index: number) => {
  form.value.languages.splice(index, 1);
};

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
