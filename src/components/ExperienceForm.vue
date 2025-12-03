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

  emit('save', form.value);
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
      <UFormGroup :label="t('experiences.form.title')" required>
        <UInput v-model="form.title" :placeholder="t('experiences.form.titlePlaceholder')" />
      </UFormGroup>

      <!-- Company Name -->
      <UFormGroup :label="t('experiences.form.company')">
        <UInput
          v-model="form.companyName"
          :placeholder="t('experiences.form.companyPlaceholder')"
        />
      </UFormGroup>

      <!-- Dates -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormGroup :label="t('experiences.form.startDate')" required>
          <UInput v-model="form.startDate" type="date" />
        </UFormGroup>

        <UFormGroup :label="t('experiences.form.endDate')">
          <UInput v-model="form.endDate" type="date" />
          <template #hint>
            <span class="text-xs">{{ t('experiences.form.endDateHint') }}</span>
          </template>
        </UFormGroup>
      </div>

      <!-- Responsibilities -->
      <UFormGroup :label="t('experiences.form.responsibilities')">
        <UTextarea
          v-model="responsibilitiesText"
          :placeholder="t('experiences.form.responsibilitiesPlaceholder')"
          :rows="5"
        />
        <template #hint>
          <span class="text-xs">{{ t('experiences.form.responsibilitiesHint') }}</span>
        </template>
      </UFormGroup>

      <!-- Tasks -->
      <UFormGroup :label="t('experiences.form.tasks')">
        <UTextarea
          v-model="tasksText"
          :placeholder="t('experiences.form.tasksPlaceholder')"
          :rows="5"
        />
        <template #hint>
          <span class="text-xs">{{ t('experiences.form.tasksHint') }}</span>
        </template>
      </UFormGroup>

      <!-- Status -->
      <UFormGroup :label="t('experiences.form.status')">
        <USelect
          v-model="form.status"
          :options="[
            { value: 'draft', label: t('experiences.status.draft') },
            { value: 'complete', label: t('experiences.status.complete') },
          ]"
          option-attribute="label"
          value-attribute="value"
        />
      </UFormGroup>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <UButton
          type="button"
          color="gray"
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
