<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';

const { t } = useI18n();

interface Props {
  experiences: ExtractedExperience[];
}

defineProps<Props>();

const emit = defineEmits<{
  remove: [index: number];
}>();

function formatDateRange(start?: string, end?: string | null): string {
  if (!start) return t('cvUpload.sections.experiences');
  if (!end) return `${start} - ${t('experiences.present')}`;
  return `${start} - ${end}`;
}
</script>

<template>
  <UCard v-if="experiences.length > 0">
    <template #header>
      <div class="flex items-center justify-between">
        <UText size="lg" weight="semibold">
          {{ t('cvUpload.sections.experiences') }}
        </UText>
        <UBadge color="primary">
          {{ experiences.length }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <UCard v-for="(exp, index) in experiences" :key="index" class="relative">
        <div class="space-y-2">
          <div class="flex items-start justify-between">
            <div>
              <UText weight="semibold">{{ exp.title }}</UText>
              <UText size="sm" color="neutral">
                {{ exp.company }}
              </UText>
            </div>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="emit('remove', index)"
            />
          </div>

          <UText size="sm" color="neutral">
            {{ formatDateRange(exp.startDate, exp.endDate) }}
          </UText>

          <div v-if="exp.responsibilities?.length" class="space-y-1">
            <UText size="sm" weight="medium">{{ t('experiences.form.responsibilities') }}:</UText>UText>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="(resp, i) in exp.responsibilities" :key="i">
                <UText size="sm">{{ resp }}</UText>
              </li>
            </ul>
          </div>

          <div v-if="exp.tasks?.length" class="space-y-1">
            <UText size="sm" weight="medium">{{ t('experiences.form.tasks') }}:</UText>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="(task, i) in exp.tasks" :key="i">
                {{ task }}
              </li>
            </ul>
          </div>
        </div>
      </UCard>
    </div>
  </UCard>
</template>
