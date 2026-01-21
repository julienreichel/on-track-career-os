<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    templateName: string;
    sectionCount: number;
    experienceCount: number;
    askEachTime: boolean;
    showProfilePhoto: boolean;
    generating?: boolean;
  }>(),
  {
    generating: false,
  }
);

const emit = defineEmits<{
  generate: [];
  'edit-settings': [];
}>();

const { t } = useI18n();

const askEachTimeLabel = computed(() =>
  props.askEachTime
    ? t('cvGenerate.entry.askEachTimeEnabled')
    : t('cvGenerate.entry.askEachTimeDisabled')
);

const showProfilePhotoLabel = computed(() =>
  props.showProfilePhoto
    ? t('cvGenerate.entry.showProfilePhotoEnabled')
    : t('cvGenerate.entry.showProfilePhotoDisabled')
);

const sectionLabel = computed(() => t('cvGenerate.entry.sections', { count: props.sectionCount }));

const experienceLabel = computed(() =>
  t('cvGenerate.entry.experiences', { count: props.experienceCount })
);
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-default">
          {{ t('cvGenerate.entry.title') }}
        </h2>
        <p class="text-sm text-dimmed">
          {{ t('cvGenerate.entry.description') }}
        </p>
      </div>
    </template>

    <div class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <p class="text-xs font-semibold uppercase text-dimmed">
            {{ t('cvGenerate.entry.templateLabel') }}
          </p>
          <p class="text-sm font-medium text-default">
            {{ props.templateName }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-dimmed">
            {{ t('cvGenerate.entry.sectionsLabel') }}
          </p>
          <p class="text-sm font-medium text-default">
            {{ sectionLabel }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-dimmed">
            {{ t('cvGenerate.entry.experiencesLabel') }}
          </p>
          <p class="text-sm font-medium text-default">
            {{ experienceLabel }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-dimmed">
            {{ t('cvGenerate.entry.otherLabel') }}
          </p>
          <p class="text-sm font-medium text-default">
            {{ askEachTimeLabel }} · {{ showProfilePhotoLabel }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('cvGenerate.actions.settings')"
          @click="emit('edit-settings')"
        />
        <UButton
          color="primary"
          :label="t('cvGenerate.actions.generate')"
          :loading="props.generating"
          @click="emit('generate')"
        />
      </div>
    </div>
  </UCard>
</template>
