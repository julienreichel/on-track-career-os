<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Experience, ExperienceCreateInput } from '@/domain/experience/Experience';

const { t } = useI18n();

interface Props {
  experience?: Experience | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  experience: null,
  loading: false,
});

const emit = defineEmits<{
  save: [data: ExperienceCreateInput];
  cancel: [];
}>();

// Form state
const form = ref<ExperienceCreateInput>({
  title: '',
  companyName: '',
  startDate: '',
  endDate: '',
  responsibilities: [],
  tasks: [],
  rawText: '',
  status: 'draft',
  experienceType: 'work',
  userId: '', // Will be set by the page/parent
});

// Initialize form with experience data when available
watch(
  () => props.experience,
  (experience) => {
    if (experience) {
      form.value = {
        title: experience.title,
        companyName: experience.companyName || '',
        startDate: experience.startDate,
        endDate: experience.endDate || '',
        responsibilities: experience.responsibilities || [],
        tasks: experience.tasks || [],
        rawText: experience.rawText || '',
        status: experience.status || 'draft',
        experienceType: experience.experienceType || 'work',
        userId: experience.userId,
      };
    }
  },
  { immediate: true }
);

// String arrays for text areas
const responsibilitiesText = ref('');
const tasksText = ref('');

// Initialize text areas from arrays
watch(
  () => props.experience,
  (experience) => {
    if (experience) {
      responsibilitiesText.value = (experience.responsibilities || []).join('\n');
      tasksText.value = (experience.tasks || []).join('\n');
    }
  },
  { immediate: true }
);

// Helper to get status value for radio group (converts null to string)
function getStatusValue(): string {
  return form.value.status ?? 'draft';
}

function handleStatusChange(value: string) {
  form.value.status = value as 'draft' | 'complete';
}

function handleSubmit() {
  // Convert text areas to arrays
  form.value.responsibilities = responsibilitiesText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  form.value.tasks = tasksText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Convert empty date strings to null for GraphQL
  const dataToSave = {
    ...form.value,
    endDate: form.value.endDate?.trim() || null,
  };

  emit('save', dataToSave);
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ experience ? t('experiences.form.editTitle') : t('experiences.form.createTitle') }}
      </h3>
    </template>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Title -->
      <UFormField :label="t('experiences.form.title')" required>
        <UInput
          v-model="form.title"
          :placeholder="t('experiences.form.titlePlaceholder')"
          class="w-full lg:w-1/2"
        />
      </UFormField>

      <!-- Company Name -->
      <UFormField :label="t('experiences.form.company')">
        <UInput
          v-model="form.companyName"
          :placeholder="t('experiences.form.companyPlaceholder')"
          class="w-full lg:w-1/2"
        />
      </UFormField>

      <!-- Experience Type -->
      <UFormField :label="t('experiences.form.type')">
        <USelect
          v-model="form.experienceType"
          :options="[
            { value: 'work', label: t('experiences.types.work') },
            { value: 'education', label: t('experiences.types.education') },
            { value: 'volunteer', label: t('experiences.types.volunteer') },
            { value: 'project', label: t('experiences.types.project') },
          ]"
          class="w-full lg:w-1/2"
        />
      </UFormField>

      <!-- Dates -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField :label="t('experiences.form.startDate')" required>
          <UInput v-model="form.startDate" type="date" />
        </UFormField>

        <UFormField
          :label="t('experiences.form.endDate')"
          :hint="t('experiences.form.endDateHint')"
        >
          <UInput v-model="form.endDate" type="date" />
        </UFormField>
      </div>

      <!-- Responsibilities -->
      <UFormField
        :label="t('experiences.form.responsibilities')"
        :hint="t('experiences.form.responsibilitiesHint')"
      >
        <UTextarea
          v-model="responsibilitiesText"
          :placeholder="t('experiences.form.responsibilitiesPlaceholder')"
          :rows="5"
          resize="none"
          class="w-full"
        />
      </UFormField>

      <!-- Tasks -->
      <UFormField :label="t('experiences.form.tasks')" :hint="t('experiences.form.tasksHint')">
        <UTextarea
          v-model="tasksText"
          :placeholder="t('experiences.form.tasksPlaceholder')"
          :rows="5"
          resize="none"
          class="w-full"
        />
      </UFormField>

      <!-- Status -->
      <UFormField :label="t('experiences.form.status')">
        <URadioGroup
          :model-value="getStatusValue()"
          :items="[
            { value: 'draft', label: t('experiences.status.draft') },
            { value: 'complete', label: t('experiences.status.complete') },
          ]"
          @update:model-value="handleStatusChange"
        />
      </UFormField>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          :label="t('experiences.form.cancel')"
          @click="handleCancel"
        />
        <UButton
          type="submit"
          :label="t('experiences.form.save')"
          :loading="loading"
          :disabled="!form.title || !form.startDate"
        />
      </div>
    </form>
  </UCard>
</template>
