<template>
  <div>
    <UButton icon="i-heroicons-plus" color="neutral" variant="outline" block @click="isOpen = true">
      {{ $t('cvSectionAdd.addSection') }}
    </UButton>

    <UModal
      v-model:open="isOpen"
      :title="$t('cvSectionAdd.title')"
      :description="$t('cvSectionAdd.description')"
      close
    >
      <template #body>
        <div class="space-y-2">
          <UButton
            v-for="section in availableSections"
            :key="section.type"
            :icon="section.icon"
            color="neutral"
            variant="ghost"
            block
            class="justify-start"
            @click="addSection(section.type)"
          >
            <div class="flex-1 text-left">
              <div class="font-medium">{{ section.label }}</div>
              <div class="text-sm opacity-75">{{ section.description }}</div>
            </div>
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface SectionType {
  type: string;
  label: string;
  description: string;
  icon: string;
}

interface Props {
  existingTypes?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  existingTypes: () => [],
});

const emit = defineEmits<{
  add: [sectionType: string];
}>();

const { t } = useI18n();
const isOpen = ref(false);

const allSections = computed<SectionType[]>(() => [
  {
    type: 'summary',
    label: t('cvSectionAdd.sections.summary.label'),
    description: t('cvSectionAdd.sections.summary.description'),
    icon: 'i-heroicons-document-text',
  },
  {
    type: 'skills',
    label: t('cvSectionAdd.sections.skills.label'),
    description: t('cvSectionAdd.sections.skills.description'),
    icon: 'i-heroicons-sparkles',
  },
  {
    type: 'languages',
    label: t('cvSectionAdd.sections.languages.label'),
    description: t('cvSectionAdd.sections.languages.description'),
    icon: 'i-heroicons-language',
  },
  {
    type: 'certifications',
    label: t('cvSectionAdd.sections.certifications.label'),
    description: t('cvSectionAdd.sections.certifications.description'),
    icon: 'i-heroicons-academic-cap',
  },
  {
    type: 'interests',
    label: t('cvSectionAdd.sections.interests.label'),
    description: t('cvSectionAdd.sections.interests.description'),
    icon: 'i-heroicons-heart',
  },
  {
    type: 'custom',
    label: t('cvSectionAdd.sections.custom.label'),
    description: t('cvSectionAdd.sections.custom.description'),
    icon: 'i-heroicons-plus-circle',
  },
]);

// Filter out sections that already exist (except custom which can have multiple instances)
const availableSections = computed(() => {
  return allSections.value.filter(
    (section) => section.type === 'custom' || !props.existingTypes.includes(section.type)
  );
});

const addSection = (sectionType: string) => {
  emit('add', sectionType);
  isOpen.value = false;
};
</script>
