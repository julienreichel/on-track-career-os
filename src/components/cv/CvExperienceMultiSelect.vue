<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-default">
        {{ title }}
      </h3>
      <UButton
        v-if="experiences.length > 0"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="toggleAll"
      >
        {{ allSelected ? deselectAllLabel : selectAllLabel }}
      </UButton>
    </div>

    <div v-if="loading" class="flex justify-center py-6">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin size-6" />
    </div>

    <div v-else-if="experiences.length === 0" class="rounded-lg border border-dashed p-4">
      <p class="text-sm text-dimmed">
        {{ emptyLabel }}
      </p>
    </div>

    <div v-else class="space-y-2">
      <UCard
        v-for="experience in experiences"
        :key="experience.id"
        :variant="isSelected(experience.id) ? 'subtle' : 'outline'"
        class="cursor-pointer transition-colors"
        @click="toggle(experience.id)"
      >
        <div class="flex items-start gap-3">
          <UCheckbox
            :model-value="isSelected(experience.id)"
            class="mt-1"
            @click.stop="toggle(experience.id)"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <h4 class="font-semibold">{{ experience.title }}</h4>
              <span v-if="experience.companyName" class="text-sm text-dimmed">
                @ {{ experience.companyName }}
              </span>
            </div>
            <div v-if="experience.startDate || experience.endDate" class="text-xs text-dimmed mt-1">
              {{ formatDateRange(experience.startDate, experience.endDate) }}
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div v-if="modelValue.length > 0" class="pt-2">
      <p class="text-xs text-dimmed">
        {{ selectedLabel }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Experience } from '@/domain/experience/Experience';

interface Props {
  experiences: Experience[];
  modelValue: string[];
  loading?: boolean;
  title?: string;
  emptyLabel?: string;
  selectAllLabel?: string;
  deselectAllLabel?: string;
  selectedLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: '',
  emptyLabel: '',
  selectAllLabel: '',
  deselectAllLabel: '',
  selectedLabel: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const allSelected = computed(
  () => props.experiences.length > 0 && props.modelValue.length === props.experiences.length
);

const isSelected = (id: string): boolean => props.modelValue.includes(id);

const toggle = (id: string) => {
  const selected = [...props.modelValue];
  const index = selected.indexOf(id);

  if (index === -1) {
    selected.push(id);
  } else {
    selected.splice(index, 1);
  }

  emit('update:modelValue', selected);
};

const toggleAll = () => {
  if (allSelected.value) {
    emit('update:modelValue', []);
  } else {
    emit(
      'update:modelValue',
      props.experiences.map((experience) => experience.id)
    );
  }
};

const formatDateRange = (startDate?: string | null, endDate?: string | null): string => {
  if (!startDate && !endDate) return '';
  if (!startDate) return endDate ?? '';
  if (!endDate) return `${startDate} - Present`;
  return `${startDate} - ${endDate}`;
};
</script>
