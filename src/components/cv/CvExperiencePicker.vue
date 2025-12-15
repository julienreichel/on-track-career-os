<template>
  <div class="cv-experience-picker space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">
        {{ $t('cvExperiencePicker.title') }}
      </h3>
      <UButton
        v-if="experiences.length > 0"
        size="xs"
        color="gray"
        variant="ghost"
        @click="toggleAll"
      >
        {{ allSelected ? $t('cvExperiencePicker.deselectAll') : $t('cvExperiencePicker.selectAll') }}
      </UButton>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-400" />
    </div>

    <div v-else-if="experiences.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-briefcase" class="text-4xl text-gray-400 mx-auto mb-2" />
      <p class="text-gray-600">{{ $t('cvExperiencePicker.noExperiences') }}</p>
      <UButton
        :to="{ name: 'profile-experiences' }"
        color="primary"
        class="mt-4"
      >
        {{ $t('cvExperiencePicker.addExperience') }}
      </UButton>
    </div>

    <div v-else class="space-y-2">
      <UCard
        v-for="experience in experiences"
        :key="experience.id"
        :ui="{ body: { padding: 'p-4' } }"
        class="cursor-pointer hover:bg-gray-50 transition-colors"
        :class="{ 'ring-2 ring-primary-500': isSelected(experience.id) }"
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
              <h4 class="font-semibold text-gray-900">{{ experience.title }}</h4>
              <span v-if="experience.companyName" class="text-sm text-gray-600">
                @ {{ experience.companyName }}
              </span>
            </div>
            <div v-if="experience.startDate || experience.endDate" class="text-sm text-gray-500 mt-1">
              {{ formatDateRange(experience.startDate, experience.endDate) }}
            </div>
            <div v-if="experience.experienceType" class="mt-2">
              <UBadge
                :label="$t(`experience.types.${experience.experienceType}`)"
                size="xs"
                color="gray"
                variant="subtle"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div v-if="modelValue.length > 0" class="pt-4 border-t">
      <p class="text-sm text-gray-600">
        {{ $t('cvExperiencePicker.selected', { count: modelValue.length }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import type { Experience } from '@/domain/experience/Experience';

interface Props {
  modelValue: string[];
  userId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const { t } = useI18n();
const experiences = ref<Experience[]>([]);
const loading = ref(false);
const experienceRepo = new ExperienceRepository();
const userProfileRepo = new UserProfileRepository();

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
    emit('update:modelValue', experiences.value.map((e) => e.id));
  }
};

const formatDateRange = (startDate?: string | null, endDate?: string | null): string => {
  if (!startDate && !endDate) return '';

  const start = startDate || t('cvExperiencePicker.unknown');
  const end = endDate || t('cvExperiencePicker.present');

  return `${start} - ${end}`;
};

const loadExperiences = async () => {
  loading.value = true;

  try {
    const profile = await userProfileRepo.get(props.userId);
    if (!profile) {
      console.error('[CvExperiencePicker] User profile not found');
      return;
    }

    experiences.value = await experienceRepo.list(profile);

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
  loadExperiences();
});

watch(() => props.userId, () => {
  loadExperiences();
});
</script>
