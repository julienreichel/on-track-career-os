<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

const { t } = useI18n();

interface Props {
  experiences: ParseCvTextOutput['experiences'];
}

defineProps<Props>();

const emit = defineEmits<{
  remove: [index: number];
}>();

function formatDateRange(start?: string, end?: string): string {
  if (!start) return t('profile.cvUpload.experiences.dateUnknown');
  if (!end) return `${start} - ${t('profile.cvUpload.experiences.present')}`;
  return `${start} - ${end}`;
}
</script>

<template>
  <UCard v-if="experiences.length > 0">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{ t('profile.cvUpload.experiences.title') }}
        </h3>
        <UBadge color="primary">
          {{ experiences.length }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <UCard
        v-for="(exp, index) in experiences"
        :key="index"
        class="relative"
      >
        <div class="space-y-2">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-semibold">{{ exp.position }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ exp.company }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              color="red"
              variant="ghost"
              size="xs"
              @click="emit('remove', index)"
            />
          </div>

          <p class="text-sm text-gray-500">
            {{ formatDateRange(exp.startDate, exp.endDate) }}
          </p>

          <p class="text-sm">{{ exp.description }}</p>

          <div v-if="exp.achievements?.length" class="space-y-1">
            <p class="text-sm font-medium">
              {{ t('profile.cvUpload.experiences.achievements') }}:
            </p>
            <ul class="list-disc list-inside text-sm space-y-1">
              <li v-for="(achievement, i) in exp.achievements" :key="i">
                {{ achievement }}
              </li>
            </ul>
          </div>
        </div>
      </UCard>
    </div>
  </UCard>
</template>
