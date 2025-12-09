<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAiOperations } from '@/application/ai-operations/useAiOperations';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';
import { PDFParse } from 'pdf-parse';

// Configure PDF.js worker (must be set before any PDF operations)
PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

const { t } = useI18n();
const router = useRouter();
const aiOps = useAiOperations();
const experienceRepo = new ExperienceRepository();
const userProfileRepo = new UserProfileRepository();

// Workflow state
type WorkflowStep = 'upload' | 'parsing' | 'preview' | 'importing' | 'complete';
const currentStep = ref<WorkflowStep>('upload');

// Data state
const extractedText = ref<string>('');
const extractedExperiences = ref<ExtractedExperience[]>([]);
const extractedProfile = ref<ParseCvTextOutput['profile'] | null>(null);
const errorMessage = ref<string | null>(null);
const importCount = ref(0);
const uploadedFile = ref<File | null>(null);

// Handle file upload
async function handleUpload(file: File | null | undefined) {
  if (!file) return;

  uploadedFile.value = file;
  currentStep.value = 'parsing';
  errorMessage.value = null;

  try {
    let text: string;

    // Check file type and parse accordingly
    if (file.type === 'application/pdf') {
      // Parse PDF file using pdf-parse
      const arrayBuffer = await file.arrayBuffer();
      const parser = new PDFParse({ data: arrayBuffer });
      const result = await parser.getText();
      await parser.destroy();
      text = result.text;
    } else {
      // Read text file (txt, doc, docx - for now just txt)
      const reader = new FileReader();
      text = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    }

    if (!text || text.trim().length === 0) {
      throw new Error(t('cvUpload.errors.noTextExtracted'));
    }

    extractedText.value = text;
    // Step 1: Parse CV text to extract sections
    await aiOps.parseCv(text);

    if (aiOps.error.value) {
      throw new Error(aiOps.error.value);
    }

    if (!aiOps.parsedCv.value?.sections?.experiences) {
      throw new Error(t('cvUpload.errors.parsingFailed'));
    }

    // Extract profile information
    if (aiOps.parsedCv.value?.profile) {
      extractedProfile.value = aiOps.parsedCv.value.profile;
    }

    // Step 2: Extract experience blocks from parsed sections
    await aiOps.extractExperiences(aiOps.parsedCv.value.sections.experiences);

    if (aiOps.error.value) {
      throw new Error(aiOps.error.value);
    }

    if (!aiOps.experiences.value?.experiences) {
      throw new Error(t('cvUpload.errors.extractionFailed'));
    }

    extractedExperiences.value = aiOps.experiences.value.experiences;
    currentStep.value = 'preview';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('cvUpload.errors.unknown');
    currentStep.value = 'upload';
    uploadedFile.value = null;
  }
}

// Handle import confirmation
async function handleImport() {
  currentStep.value = 'importing';
  errorMessage.value = null;

  try {
    // Get current user ID from Amplify
    const user = useNuxtApp().$Amplify.Auth.getCurrentUser();
    const userId = (await user).userId;

    // Create Experience entities in database
    const createPromises = extractedExperiences.value.map((exp) =>
      experienceRepo.create({
        title: exp.title,
        companyName: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate || undefined,
        responsibilities: exp.responsibilities,
        tasks: exp.tasks,
        rawText: extractedText.value,
        status: 'draft',
        userId,
      })
    );

    const results = await Promise.all(createPromises);
    importCount.value = results.filter((r) => r !== null).length;

    // Update user profile with extracted information
    if (extractedProfile.value) {
      await updateUserProfile(userId, extractedProfile.value);
    }

    currentStep.value = 'complete';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('cvUpload.errors.importFailed');
    currentStep.value = 'preview';
  }
}

// Update user profile with extracted data, merging with existing data
async function updateUserProfile(
  userId: string,
  profile: ParseCvTextOutput['profile']
) {
  try {
    // Get existing profile
    const existingProfile = await userProfileRepo.get(userId);
    
    if (!existingProfile) {
      console.warn('User profile not found, skipping profile update');
      return;
    }

    // Helper to merge arrays without duplicates
    const mergeArrays = (existing: string[] | null | undefined, incoming: string[] | undefined) => {
      const existingSet = new Set(existing || []);
      const incomingArr = incoming || [];
      incomingArr.forEach((item) => existingSet.add(item));
      return Array.from(existingSet);
    };

    // Prepare update with merged data
    const updateData: Record<string, unknown> = {
      id: userId,
    };

    // Only update fields that have new data
    if (profile.fullName && !existingProfile.fullName) {
      updateData.fullName = profile.fullName;
    }
    if (profile.headline) {
      updateData.headline = profile.headline || existingProfile.headline;
    }
    if (profile.location) {
      updateData.location = profile.location || existingProfile.location;
    }
    if (profile.seniorityLevel) {
      updateData.seniorityLevel = profile.seniorityLevel || existingProfile.seniorityLevel;
    }

    // Merge arrays
    updateData.goals = mergeArrays(existingProfile.goals, profile.goals);
    updateData.aspirations = mergeArrays(existingProfile.aspirations, profile.aspirations);
    updateData.personalValues = mergeArrays(existingProfile.personalValues, profile.personalValues);
    updateData.strengths = mergeArrays(existingProfile.strengths, profile.strengths);
    updateData.interests = mergeArrays(existingProfile.interests, profile.interests);
    updateData.languages = mergeArrays(existingProfile.languages, profile.languages);

    // Merge skills from parsed CV sections
    if (aiOps.parsedCv.value?.sections?.skills) {
      updateData.skills = mergeArrays(existingProfile.skills, aiOps.parsedCv.value.sections.skills);
    }

    // Merge certifications from parsed CV sections
    if (aiOps.parsedCv.value?.sections?.certifications) {
      updateData.certifications = mergeArrays(
        existingProfile.certifications,
        aiOps.parsedCv.value.sections.certifications
      );
    }

    await userProfileRepo.update(updateData as never);
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Don't throw - profile update is optional, experiences were already imported
  }
}

// Handle cancel
function handleCancel() {
  currentStep.value = 'upload';
  extractedText.value = '';
  extractedExperiences.value = [];
  extractedProfile.value = null;
  errorMessage.value = null;
  uploadedFile.value = null;
  aiOps.reset();
}

// Remove an experience from the list
function removeExperience(index: number) {
  extractedExperiences.value.splice(index, 1);
}

// Remove profile field
function removeProfileField(field: keyof ParseCvTextOutput['profile']) {
  if (extractedProfile.value) {
    extractedProfile.value[field] = undefined as never;
  }
}

// Remove item from profile array field
function removeProfileArrayItem(
  field: keyof ParseCvTextOutput['profile'],
  index: number
) {
  if (extractedProfile.value && Array.isArray(extractedProfile.value[field])) {
    (extractedProfile.value[field] as string[]).splice(index, 1);
  }
}

// Navigate to experiences list
function viewExperiences() {
  router.push('/profile/experiences');
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="t('cvUpload.title')" :description="t('cvUpload.description')" />

      <UPageBody>
        <!-- Error Alert -->
        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('cvUpload.errors.unknown')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          @close="errorMessage = null"
        />

        <!-- Upload Step -->
        <UCard v-if="currentStep === 'upload'">
          <UFileUpload
            v-model="uploadedFile"
            accept=".pdf,.doc,.docx,.txt"
            :label="t('cvUpload.dropzone.label')"
            :description="t('cvUpload.dropzone.description')"
            icon="i-heroicons-document-text"
            @update:model-value="handleUpload"
          />
        </UCard>

        <!-- Parsing Step -->
        <UCard v-if="currentStep === 'parsing'">
          <UEmpty
            icon="i-heroicons-arrow-path"
            :title="t('cvUpload.parsing')"
            :description="t('cvUpload.parsingDescription')"
          />
          <UProgress animation="carousel" />
        </UCard>

        <!-- Preview Step -->
        <UCard v-if="currentStep === 'preview'">
          <template #header>
            <UPageHeader
              :title="t('cvUpload.parsedTitle')"
              :description="t('cvUpload.parsedDescription')"
            />
          </template>

          <UPageGrid v-if="extractedExperiences.length > 0">
            <UCard v-for="(exp, index) in extractedExperiences" :key="index" class="lg:col-span-3">
              <template #header>
                <UPageHeader
                  :title="exp.title"
                  :description="exp.company"
                  :links="[
                    {
                      label: t('cvUpload.removeExperience'),
                      icon: 'i-heroicons-trash',
                      color: 'error',
                      onClick: () => removeExperience(index),
                    },
                  ]"
                />
                <UBadge color="neutral" variant="subtle" size="sm">
                  {{ exp.startDate }} - {{ exp.endDate || t('experiences.present') }}
                </UBadge>
              </template>

              <template v-if="exp.responsibilities.length > 0">
                <p class="font-semibold mb-2">{{ t('experiences.form.responsibilities') }}:</p>
                <ul class="list-disc list-inside space-y-1 mb-4">
                  <li
                    v-for="(resp, idx) in exp.responsibilities.slice(
                      0,
                      exp.responsibilities.length > 3 ? 2 : exp.responsibilities.length
                    )"
                    :key="idx"
                  >
                    {{ resp }}
                  </li>
                  <li v-if="exp.responsibilities.length > 3">
                    <UBadge color="neutral" variant="subtle">
                      +{{ exp.responsibilities.length - 2 }} {{ t('cvUpload.more') }}
                    </UBadge>
                  </li>
                </ul>
              </template>

              <template v-if="exp.tasks.length > 0">
                <p class="font-semibold mb-2">{{ t('experiences.form.tasks') }}:</p>
                <ul class="list-disc list-inside space-y-1">
                  <li
                    v-for="(task, idx) in exp.tasks.slice(
                      0,
                      exp.tasks.length > 3 ? 2 : exp.tasks.length
                    )"
                    :key="idx"
                  >
                    {{ task }}
                  </li>
                  <li v-if="exp.tasks.length > 3">
                    <UBadge color="neutral" variant="subtle">
                      +{{ exp.tasks.length - 2 }} {{ t('cvUpload.more') }}
                    </UBadge>
                  </li>
                </ul>
              </template>
            </UCard>
          </UPageGrid>

          <!-- Profile Information Section -->
          <UCard v-if="extractedProfile" class="mt-6">
            <template #header>
              <UPageHeader
                :title="t('cvUpload.profile.title')"
                :description="t('cvUpload.parsedDescription')"
              />
            </template>

            <div class="space-y-4">
              <!-- Full Name -->
              <UFormField
                v-if="extractedProfile.fullName"
                :label="t('cvUpload.profile.fullName')"
              >
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="subtle" size="lg">
                    {{ extractedProfile.fullName }}
                  </UBadge>
                  <UButton
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="removeProfileField('fullName')"
                  />
                </div>
              </UFormField>

              <!-- Headline -->
              <UFormField
                v-if="extractedProfile.headline"
                :label="t('cvUpload.profile.headline')"
              >
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="subtle" size="lg">
                    {{ extractedProfile.headline }}
                  </UBadge>
                  <UButton
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="removeProfileField('headline')"
                  />
                </div>
              </UFormField>

              <!-- Location -->
              <UFormField
                v-if="extractedProfile.location"
                :label="t('cvUpload.profile.location')"
              >
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="subtle" size="lg">
                    {{ extractedProfile.location }}
                  </UBadge>
                  <UButton
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="removeProfileField('location')"
                  />
                </div>
              </UFormField>

              <!-- Seniority Level -->
              <UFormField
                v-if="extractedProfile.seniorityLevel"
                :label="t('cvUpload.profile.seniorityLevel')"
              >
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="subtle" size="lg">
                    {{ extractedProfile.seniorityLevel }}
                  </UBadge>
                  <UButton
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="removeProfileField('seniorityLevel')"
                  />
                </div>
              </UFormField>

              <!-- Goals -->
              <UFormField
                v-if="extractedProfile.goals && extractedProfile.goals.length > 0"
                :label="t('cvUpload.profile.goals')"
              >
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(goal, idx) in extractedProfile.goals"
                    :key="idx"
                    class="flex items-center gap-1"
                  >
                    <UBadge color="primary" variant="subtle">
                      {{ goal }}
                    </UBadge>
                    <UButton
                      icon="i-heroicons-x-mark"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click="removeProfileArrayItem('goals', idx)"
                    />
                  </div>
                </div>
              </UFormField>

              <!-- Aspirations -->
              <UFormField
                v-if="extractedProfile.aspirations && extractedProfile.aspirations.length > 0"
                :label="t('cvUpload.profile.aspirations')"
              >
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(aspiration, idx) in extractedProfile.aspirations"
                    :key="idx"
                    class="flex items-center gap-1"
                  >
                    <UBadge color="primary" variant="subtle">
                      {{ aspiration }}
                    </UBadge>
                    <UButton
                      icon="i-heroicons-x-mark"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click="removeProfileArrayItem('aspirations', idx)"
                    />
                  </div>
                </div>
              </UFormField>

              <!-- Personal Values -->
              <UFormField
                v-if="extractedProfile.personalValues && extractedProfile.personalValues.length > 0"
                :label="t('cvUpload.profile.personalValues')"
              >
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(value, idx) in extractedProfile.personalValues"
                    :key="idx"
                    class="flex items-center gap-1"
                  >
                    <UBadge color="primary" variant="subtle">
                      {{ value }}
                    </UBadge>
                    <UButton
                      icon="i-heroicons-x-mark"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click="removeProfileArrayItem('personalValues', idx)"
                    />
                  </div>
                </div>
              </UFormField>

              <!-- Strengths -->
              <UFormField
                v-if="extractedProfile.strengths && extractedProfile.strengths.length > 0"
                :label="t('cvUpload.profile.strengths')"
              >
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(strength, idx) in extractedProfile.strengths"
                    :key="idx"
                    class="flex items-center gap-1"
                  >
                    <UBadge color="success" variant="subtle">
                      {{ strength }}
                    </UBadge>
                    <UButton
                      icon="i-heroicons-x-mark"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click="removeProfileArrayItem('strengths', idx)"
                    />
                  </div>
                </div>
              </UFormField>

              <!-- Interests -->
              <UFormField
                v-if="extractedProfile.interests && extractedProfile.interests.length > 0"
                :label="t('cvUpload.profile.interests')"
              >
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(interest, idx) in extractedProfile.interests"
                    :key="idx"
                    class="flex items-center gap-1"
                  >
                    <UBadge color="info" variant="subtle">
                      {{ interest }}
                    </UBadge>
                    <UButton
                      icon="i-heroicons-x-mark"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click="removeProfileArrayItem('interests', idx)"
                    />
                  </div>
                </div>
              </UFormField>

              <!-- Languages -->
              <UFormField
                v-if="extractedProfile.languages && extractedProfile.languages.length > 0"
                :label="t('cvUpload.profile.languages')"
              >
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(language, idx) in extractedProfile.languages"
                    :key="idx"
                    class="flex items-center gap-1"
                  >
                    <UBadge color="neutral" variant="subtle">
                      {{ language }}
                    </UBadge>
                    <UButton
                      icon="i-heroicons-x-mark"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click="removeProfileArrayItem('languages', idx)"
                    />
                  </div>
                </div>
              </UFormField>

              <!-- No Profile Data Message -->
              <UEmpty
                v-if="
                  !extractedProfile.fullName &&
                  !extractedProfile.headline &&
                  !extractedProfile.location &&
                  !extractedProfile.seniorityLevel &&
                  (!extractedProfile.goals || extractedProfile.goals.length === 0) &&
                  (!extractedProfile.aspirations || extractedProfile.aspirations.length === 0) &&
                  (!extractedProfile.personalValues || extractedProfile.personalValues.length === 0) &&
                  (!extractedProfile.strengths || extractedProfile.strengths.length === 0) &&
                  (!extractedProfile.interests || extractedProfile.interests.length === 0) &&
                  (!extractedProfile.languages || extractedProfile.languages.length === 0)
                "
                :description="t('cvUpload.profile.noProfileData')"
                icon="i-heroicons-user"
              />
            </div>
          </UCard>

          <template #footer>
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('cvUpload.cancel')"
              @click="handleCancel"
            />
            <UButton
              :label="t('cvUpload.confirmImport')"
              icon="i-heroicons-arrow-down-tray"
              @click="handleImport"
            />
          </template>
        </UCard>

        <!-- Importing Step -->
        <UCard v-if="currentStep === 'importing'">
          <UEmpty icon="i-heroicons-arrow-path" :title="t('cvUpload.importing')" />
          <UProgress animation="carousel" />
        </UCard>

        <!-- Complete Step -->
        <UCard v-if="currentStep === 'complete'">
          <UEmpty
            icon="i-heroicons-check-circle"
            :title="t('cvUpload.success', { count: importCount })"
            color="success"
          >
            <template #actions>
              <UButton
                :label="t('cvUpload.viewExperiences')"
                icon="i-heroicons-arrow-right"
                @click="viewExperiences"
              />
            </template>
          </UEmpty>
        </UCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
