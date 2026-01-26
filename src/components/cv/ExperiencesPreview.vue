<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ExperienceForm from '@/components/ExperienceForm.vue';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';
import type { ExperienceCreateInput } from '@/domain/experience/Experience';

const { t } = useI18n();

interface Props {
  experiences: ExtractedExperience[];
}
const props = defineProps<Props>();

const emit = defineEmits<{
  remove: [index: number];
  update: [index: number, value: ExtractedExperience];
}>();

const editIndex = ref<number | null>(null);
const localExperiences = ref<ExtractedExperience[]>([]);

watch(
  () => props.experiences,
  (value) => {
    localExperiences.value = value.map((exp) => ({
      ...exp,
      responsibilities: exp.responsibilities ? [...exp.responsibilities] : [],
      tasks: exp.tasks ? [...exp.tasks] : [],
    }));
  },
  { immediate: true }
);

function formatDateRange(start?: string, end?: string | null): string {
  if (!start) return t('cvUpload.sections.experiences');
  if (!end) return `${start} - ${t('experiences.present')}`;
  return `${start} - ${end}`;
}

const handleEdit = (index: number) => {
  editIndex.value = index;
};

const handleClose = () => {
  editIndex.value = null;
};

const handleRemove = (index: number) => {
  emit('remove', index);
  localExperiences.value.splice(index, 1);
  if (editIndex.value !== null) {
    if (editIndex.value === index) {
      handleClose();
    } else if (editIndex.value > index) {
      editIndex.value -= 1;
    }
  }
};

const toExperienceInput = (exp: ExtractedExperience): ExperienceCreateInput => ({
  title: exp.title,
  companyName: exp.companyName,
  startDate: exp.startDate,
  endDate: exp.endDate ?? '',
  responsibilities: exp.responsibilities ?? [],
  tasks: exp.tasks ?? [],
  rawText: '',
  status: 'draft',
  experienceType: exp.experienceType ?? 'work',
  userId: '',
});

const handleSave = (data: ExperienceCreateInput) => {
  if (editIndex.value === null) return;
  const normalizeList = (items?: Array<string | null> | null): string[] =>
    Array.isArray(items) ? items.filter((item): item is string => Boolean(item)) : [];
  const updatedExperience = {
    title: data.title,
    companyName: data.companyName || '',
    startDate: data.startDate,
    endDate: data.endDate ?? null,
    responsibilities: normalizeList(data.responsibilities),
    tasks: normalizeList(data.tasks),
    experienceType: data.experienceType ?? 'work',
  };
  localExperiences.value.splice(editIndex.value, 1, updatedExperience);
  emit('update', editIndex.value, updatedExperience);
  handleClose();
};
</script>

<template>
  <UCard v-if="localExperiences.length > 0">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{ t('cvUpload.sections.experiences') }}
        </h3>
        <UBadge color="primary">
          {{ localExperiences.length }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <template v-for="(exp, index) in localExperiences" :key="index">
        <ExperienceForm
          v-if="editIndex === index"
          :experience="toExperienceInput(exp)"
          :submit-label="t('common.apply')"
          @save="handleSave"
          @cancel="handleClose"
        />
        <UCard v-else class="relative">
          <div class="space-y-2">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="font-semibold">{{ exp.title }}</h4>
                <p class="text-sm text-muted-foreground">
                  {{ exp.companyName }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-heroicons-pencil"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :aria-label="t('common.edit')"
                  :data-testid="`experience-edit-${index}`"
                  @click="handleEdit(index)"
                />
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :aria-label="t('common.delete')"
                  :data-testid="`experience-remove-${index}`"
                  @click="handleRemove(index)"
                />
              </div>
            </div>

            <p class="text-sm text-muted-foreground">
              {{ formatDateRange(exp.startDate, exp.endDate) }}
            </p>

            <div v-if="exp.responsibilities?.length" class="space-y-1">
              <p class="text-sm font-medium">{{ t('experiences.form.responsibilities') }}:</p>
              <ul class="list-disc list-inside text-sm space-y-1">
                <li v-for="(resp, i) in exp.responsibilities" :key="i">
                  {{ resp }}
                </li>
              </ul>
            </div>

            <div v-if="exp.tasks?.length" class="space-y-1">
              <p class="text-sm font-medium">{{ t('experiences.form.tasks') }}:</p>
              <ul class="list-disc list-inside text-sm space-y-1">
                <li v-for="(task, i) in exp.tasks" :key="i">
                  {{ task }}
                </li>
              </ul>
            </div>
          </div>
        </UCard>
      </template>
    </div>
  </UCard>
</template>
