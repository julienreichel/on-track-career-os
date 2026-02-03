<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold">
        {{ $t('applications.cvs.experiencePicker.title') }}
      </h3>
      <UButton
        v-if="experiences.length > 0"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="toggleAll"
      >
        {{
          allSelected ? $t('applications.cvs.experiencePicker.deselectAll') : $t('applications.cvs.experiencePicker.selectAll')
        }}
      </UButton>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin size-8" />
    </div>

    <div v-else-if="experiences.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-briefcase" class="size-16 mx-auto mb-2" />
      <p class="mb-4">{{ $t('applications.cvs.experiencePicker.noExperiences') }}</p>
      <UButton :to="{ name: 'profile-experiences' }" color="primary">
        {{ $t('applications.cvs.experiencePicker.addExperience') }}
      </UButton>
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
              <span v-if="experience.companyName" class="text-sm">
                @ {{ experience.companyName }}
              </span>
            </div>
            <div v-if="experience.startDate || experience.endDate" class="text-sm mt-1">
              {{ formatDateRange(experience.startDate, experience.endDate) }}
            </div>
            <div v-if="experience.experienceType" class="mt-2">
              <UBadge
                size="xs"
                color="neutral"
                variant="outline"
                icon="i-heroicons-briefcase"
              >
                {{
                  $t(`experiences.types.${experience.experienceType}`, experience.experienceType)
                }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div v-if="modelValue.length > 0" class="pt-4 border-t">
      <p class="text-sm">
        {{ $t('applications.cvs.experiencePicker.selected', { count: modelValue.length }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';

interface Props {
  modelValue: string[];
  userId: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const { t } = useI18n();
const experiences = ref<Experience[]>([]);
const loading = ref(false);
const experienceRepo = new ExperienceRepository();

const allSelected = computed(() => {
  return experiences.value.length > 0 && props.modelValue.length === experiences.value.length;
});

const isSelected = (id: string): boolean => {
  return props.modelValue.includes(id);
};

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
      experiences.value.map((e) => e.id)
    );
  }
};

const formatDateRange = (startDate?: string | null, endDate?: string | null): string => {
  if (!startDate && !endDate) return '';

  const start = startDate || t('applications.cvs.experiencePicker.unknown');
  const end = endDate || t('applications.cvs.experiencePicker.present');

  return `${start} - ${end}`;
};

const loadExperiences = async () => {
  // Don't load if userId is not available yet
  if (!props.userId) {
    return;
  }

  loading.value = true;

  try {
    experiences.value = await experienceRepo.list(props.userId);

    // Sort by start date (most recent first)
    experiences.value.sort((a, b) => {
      const dateA = a.startDate || '';
      const dateB = b.startDate || '';
      return dateB.localeCompare(dateA);
    });
  } catch (error) {
    console.error('[CvExperiencePicker] Error loading experiences:', error);
  } finally {
    loading.value = false;
  }
};

// Load experiences on mount and when userId changes
onMounted(() => {
  void loadExperiences();
});

watch(
  () => props.userId,
  () => {
    void loadExperiences();
  }
);
</script>
