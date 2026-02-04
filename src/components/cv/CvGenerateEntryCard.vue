<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    templateName: string;
    sectionCount: number;
    experienceCount: number;
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

const showProfilePhotoLabel = computed(() =>
  props.showProfilePhoto
    ? t('applications.cvs.generate.entry.showProfilePhotoEnabled')
    : t('applications.cvs.generate.entry.showProfilePhotoDisabled')
);

const sectionLabel = computed(() =>
  t('applications.cvs.generate.entry.sections', { count: props.sectionCount })
);

const experienceLabel = computed(() =>
  t('applications.cvs.generate.entry.experiences', { count: props.experienceCount })
);
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-default">
          {{ t('applications.cvs.generate.entry.title') }}
        </h2>
        <p class="text-sm text-dimmed">
          {{ t('applications.cvs.generate.entry.description') }}
        </p>
      </div>
    </template>

    <div class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <p class="text-xs font-semibold uppercase text-dimmed">
            {{ t('applications.cvs.generate.entry.templateLabel') }}
          </p>
          <p class="text-sm font-medium text-default">
            {{ props.templateName }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-dimmed">
            {{ t('applications.cvs.generate.entry.sectionsLabel') }}
          </p>
          <p class="text-sm font-medium text-default">
            {{ sectionLabel }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-dimmed">
            {{ t('applications.cvs.generate.entry.experiencesLabel') }}
          </p>
          <p class="text-sm font-medium text-default">
            {{ experienceLabel }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-dimmed">
            {{ t('applications.cvs.generate.entry.otherLabel') }}
          </p>
          <p class="text-sm font-medium text-default">
            {{ showProfilePhotoLabel }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('applications.cvs.generate.actions.settings')"
          @click="emit('edit-settings')"
        />
        <UButton
          color="primary"
          :label="t('applications.cvs.generate.actions.generate')"
          :loading="props.generating"
          @click="emit('generate')"
        />
      </div>
    </div>
  </UCard>
</template>
